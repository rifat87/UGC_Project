// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import {ZKLocalVoting} from "../src/ZKLocalVoting.sol";
import {ISemaphore} from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

/// @dev Selector-compatible Semaphore mock for VoteChain contract wiring/lifecycle tests.
/// Real Groth16 membership/nullifier behavior is covered by the standalone Semaphore V4 PoC
/// and should also be exercised against the official contracts in the local integration gate.
contract MockSemaphoreForVoteChain {
    struct GroupData {
        address admin;
        uint256 root;
        uint256 size;
    }

    uint256 public groupCounter;
    mapping(uint256 => GroupData) public groups;
    mapping(uint256 => mapping(uint256 => bool)) public members;
    mapping(uint256 => mapping(uint256 => uint256)) public memberIndex;
    mapping(uint256 => mapping(uint256 => bool)) public nullifierUsed;

    function createGroup(address admin, uint256) external returns (uint256 groupId) {
        groupId = groupCounter++;
        groups[groupId].admin = admin;
    }

    function addMember(uint256 groupId, uint256 commitment) external {
        GroupData storage group = groups[groupId];
        require(msg.sender == group.admin, "not group admin");
        require(!members[groupId][commitment], "duplicate member");
        members[groupId][commitment] = true;
        memberIndex[groupId][commitment] = group.size;
        group.size += 1;
        group.root = uint256(keccak256(abi.encode(group.root, commitment, group.size)));
    }

    function validateProof(uint256 groupId, ISemaphore.SemaphoreProof calldata proof) external {
        require(proof.merkleTreeRoot == groups[groupId].root, "invalid root");
        require(members[groupId][proof.points[0]], "invalid member");
        require(!nullifierUsed[groupId][proof.nullifier], "nullifier already used");
        nullifierUsed[groupId][proof.nullifier] = true;
    }

    function getMerkleTreeRoot(uint256 groupId) external view returns (uint256) {
        return groups[groupId].root;
    }

    function getMerkleTreeSize(uint256 groupId) external view returns (uint256) {
        return groups[groupId].size;
    }

    function indexOf(uint256 groupId, uint256 commitment) external view returns (uint256) {
        require(members[groupId][commitment], "member not found");
        return memberIndex[groupId][commitment];
    }
}

contract ZKLocalVotingTest is Test {
    ZKLocalVoting voting;
    MockSemaphoreForVoteChain semaphore;

    address electionCommission;
    address voteWallet = vm.addr(1);
    address outsider = vm.addr(2);

    uint256 constant ELECTION_ID = 20260818;
    uint256 constant CANDIDATE_A = 1;
    uint256 constant CANDIDATE_B = 2;
    uint256 constant COMMITMENT_A = 111111;
    uint256 constant COMMITMENT_B = 222222;
    uint256 constant OUTSIDER_COMMITMENT = 999999;

    function setUp() public {
        electionCommission = address(this);
        semaphore = new MockSemaphoreForVoteChain();
        voting = new ZKLocalVoting(ISemaphore(address(semaphore)), ELECTION_ID, 7 days);
    }

    function _proof(
        uint256 commitment,
        uint256 candidateId,
        uint256 scope,
        uint256 nullifier
    ) internal view returns (ISemaphore.SemaphoreProof memory proof) {
        proof.merkleTreeDepth = 1;
        proof.merkleTreeRoot = voting.getGroupRoot();
        proof.nullifier = nullifier;
        proof.message = candidateId;
        proof.scope = scope;
        proof.points[0] = commitment; // membership marker used only by this test mock.
    }

    function _registerAndActivate() internal {
        voting.registerCandidate(CANDIDATE_A);
        voting.registerCandidate(CANDIDATE_B);
        voting.registerVoterCommitment(COMMITMENT_A);
        voting.registerVoterCommitment(COMMITMENT_B);
        voting.startElection();
    }

    function test_DeploymentSetsElectionCommissionAndIdentifiers() public view {
        assertEq(voting.electionCommission(), electionCommission);
        assertEq(voting.electionId(), ELECTION_ID);
        assertEq(uint256(voting.getElectionState()), uint256(ZKLocalVoting.ElectionState.Registration));
    }

    function test_RegisterCandidate_AdminOnlyAndUnique() public {
        voting.registerCandidate(CANDIDATE_A);
        assertEq(voting.candidateCount(), 1);
        (bool exists, uint256 voteCount) = voting.candidates(CANDIDATE_A);
        assertTrue(exists);
        assertEq(voteCount, 0);

        vm.expectRevert(bytes("Candidate ID already registered"));
        voting.registerCandidate(CANDIDATE_A);

        vm.prank(outsider);
        vm.expectRevert(bytes("Only Election Commission can call this function"));
        voting.registerCandidate(CANDIDATE_B);
    }

    function test_RegisterVoterCommitment_AdminOnlyAndUnique() public {
        voting.registerVoterCommitment(COMMITMENT_A);
        assertTrue(voting.registeredCommitments(COMMITMENT_A));
        assertEq(voting.registeredVoterCount(), 1);
        assertEq(voting.getGroupSize(), 1);
        assertEq(voting.getCommitmentIndex(COMMITMENT_A), 0);

        vm.expectRevert(bytes("Identity commitment already registered"));
        voting.registerVoterCommitment(COMMITMENT_A);

        vm.prank(outsider);
        vm.expectRevert(bytes("Only Election Commission can call this function"));
        voting.registerVoterCommitment(COMMITMENT_B);
    }

    function test_RegistrationStopsAfterActivation() public {
        voting.startElection();

        vm.expectRevert(bytes("Election is not in Registration state"));
        voting.registerCandidate(CANDIDATE_A);

        vm.expectRevert(bytes("Election is not in Registration state"));
        voting.registerVoterCommitment(COMMITMENT_A);
    }

    function test_LifecycleAuthorityAndTransitions() public {
        vm.prank(outsider);
        vm.expectRevert(bytes("Only Election Commission can call this function"));
        voting.startElection();

        voting.startElection();
        assertEq(uint256(voting.getElectionState()), uint256(ZKLocalVoting.ElectionState.Active));

        vm.prank(outsider);
        vm.expectRevert(bytes("Only Election Commission can call this function"));
        voting.endElection();

        voting.endElection();
        assertEq(uint256(voting.getElectionState()), uint256(ZKLocalVoting.ElectionState.Ended));
    }

    function test_VoteOnlyDuringActive() public {
        voting.registerCandidate(CANDIDATE_A);
        voting.registerVoterCommitment(COMMITMENT_A);
        ISemaphore.SemaphoreProof memory proof = _proof(COMMITMENT_A, CANDIDATE_A, ELECTION_ID, 1001);

        vm.expectRevert(bytes("Election is not Active"));
        voting.castVote(CANDIDATE_A, proof);

        voting.startElection();
        voting.castVote(CANDIDATE_A, proof);
        voting.endElection();

        ISemaphore.SemaphoreProof memory proof2 = _proof(COMMITMENT_A, CANDIDATE_A, ELECTION_ID, 1002);
        vm.expectRevert(bytes("Election is not Active"));
        voting.castVote(CANDIDATE_A, proof2);
    }

    function test_RegisteredCommitmentProofIncrementsExactlyOneTally() public {
        _registerAndActivate();
        ISemaphore.SemaphoreProof memory proof = _proof(COMMITMENT_A, CANDIDATE_A, ELECTION_ID, 2001);

        vm.prank(voteWallet);
        voting.castVote(CANDIDATE_A, proof);

        assertEq(voting.getVoteCount(CANDIDATE_A), 1);
        assertEq(voting.getVoteCount(CANDIDATE_B), 0);
    }

    function test_NonMemberProofRejected() public {
        _registerAndActivate();
        ISemaphore.SemaphoreProof memory proof = _proof(OUTSIDER_COMMITMENT, CANDIDATE_A, ELECTION_ID, 3001);

        vm.prank(voteWallet);
        vm.expectRevert(bytes("invalid member"));
        voting.castVote(CANDIDATE_A, proof);
    }

    function test_WrongGroupRootRejected() public {
        _registerAndActivate();
        ISemaphore.SemaphoreProof memory proof = _proof(COMMITMENT_A, CANDIDATE_A, ELECTION_ID, 4001);
        proof.merkleTreeRoot += 1;

        vm.prank(voteWallet);
        vm.expectRevert(bytes("invalid root"));
        voting.castVote(CANDIDATE_A, proof);
    }

    function test_CandidateBindingRejectsProofForDifferentCandidate() public {
        _registerAndActivate();
        ISemaphore.SemaphoreProof memory proofForA = _proof(COMMITMENT_A, CANDIDATE_A, ELECTION_ID, 5001);

        vm.prank(voteWallet);
        vm.expectRevert(bytes("Proof message does not match candidate"));
        voting.castVote(CANDIDATE_B, proofForA);
    }

    function test_InvalidCandidateRejected() public {
        _registerAndActivate();
        ISemaphore.SemaphoreProof memory proof = _proof(COMMITMENT_A, 999, ELECTION_ID, 6001);

        vm.prank(voteWallet);
        vm.expectRevert(bytes("Invalid candidate"));
        voting.castVote(999, proof);
    }

    function test_WrongElectionScopeRejected() public {
        _registerAndActivate();
        ISemaphore.SemaphoreProof memory proof = _proof(COMMITMENT_A, CANDIDATE_A, ELECTION_ID + 1, 7001);

        vm.prank(voteWallet);
        vm.expectRevert(bytes("Proof scope does not match election"));
        voting.castVote(CANDIDATE_A, proof);
    }

    function test_NullifierPreventsSecondVoteFromSameIdentity() public {
        _registerAndActivate();
        ISemaphore.SemaphoreProof memory first = _proof(COMMITMENT_A, CANDIDATE_A, ELECTION_ID, 8001);
        ISemaphore.SemaphoreProof memory second = _proof(COMMITMENT_A, CANDIDATE_B, ELECTION_ID, 8001);

        vm.startPrank(voteWallet);
        voting.castVote(CANDIDATE_A, first);
        vm.expectRevert(bytes("nullifier already used"));
        voting.castVote(CANDIDATE_B, second);
        vm.stopPrank();

        assertEq(voting.getVoteCount(CANDIDATE_A), 1);
        assertEq(voting.getVoteCount(CANDIDATE_B), 0);
    }

    function test_OneNonAdminWalletCanSubmitProofsForMultipleVoters() public {
        _registerAndActivate();
        ISemaphore.SemaphoreProof memory voterAProof = _proof(COMMITMENT_A, CANDIDATE_A, ELECTION_ID, 9001);
        ISemaphore.SemaphoreProof memory voterBProof = _proof(COMMITMENT_B, CANDIDATE_B, ELECTION_ID, 9002);

        vm.startPrank(voteWallet);
        voting.castVote(CANDIDATE_A, voterAProof);
        voting.castVote(CANDIDATE_B, voterBProof);
        vm.stopPrank();

        assertEq(voting.getVoteCount(CANDIDATE_A), 1);
        assertEq(voting.getVoteCount(CANDIDATE_B), 1);
    }
}
