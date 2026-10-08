// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../src/LocalVoting.sol";

contract LocalVotingTest is Test {
    LocalVoting voting;

    address electionCommission;
    address voteWallet = vm.addr(1);
    address outsider = vm.addr(2);

    uint256 constant CANDIDATE_1 = 1;
    uint256 constant CANDIDATE_2 = 2;

    bytes32 voterHash1;
    bytes32 voterHash2;
    bytes32 unregisteredVoterHash;

    function setUp() public {
        electionCommission = address(this);
        voting = new LocalVoting();

        voterHash1 = keccak256(abi.encodePacked("V12345", "salt1"));
        voterHash2 = keccak256(abi.encodePacked("V67890", "salt2"));
        unregisteredVoterHash = keccak256(abi.encodePacked("V99999", "salt3"));
    }

    /* ----------------------------------
       Deployment and Authority
    ---------------------------------- */

    function test_DeploymentSetsElectionCommission() public {
        assertEq(voting.electionCommission(), electionCommission);
    }

    function test_InitialStateIsRegistration() public {
        assertEq(uint256(voting.getElectionState()), uint256(LocalVoting.ElectionState.Registration));
        assertEq(uint256(voting.state()), uint256(LocalVoting.ElectionState.Registration));
    }

    /* ----------------------------------
       Candidate Registration
    ---------------------------------- */

    function test_RegisterCandidate_Success() public {
        voting.registerCandidate(CANDIDATE_1);

        (bool exists, uint256 voteCount) = voting.candidates(CANDIDATE_1);
        assertTrue(exists);
        assertEq(voteCount, 0);
        assertEq(voting.getVoteCount(CANDIDATE_1), 0);
        assertEq(voting.candidateCount(), 1);
    }

    function test_RegisterCandidate_IncrementsCount() public {
        voting.registerCandidate(CANDIDATE_1);
        voting.registerCandidate(CANDIDATE_2);

        assertEq(voting.candidateCount(), 2);
    }

    function test_RevertWhen_RegisteringDuplicateCandidate() public {
        voting.registerCandidate(CANDIDATE_1);

        vm.expectRevert(bytes("Candidate ID already registered"));
        voting.registerCandidate(CANDIDATE_1);

        assertEq(voting.candidateCount(), 1);
    }

    function test_RevertWhen_NonCommissionRegistersCandidate() public {
        vm.expectRevert(bytes("Only Election Commission can call this function"));
        vm.prank(outsider);
        voting.registerCandidate(CANDIDATE_1);
    }

    function test_RevertWhen_RegisteringCandidateAfterActivation() public {
        voting.startElection();

        vm.expectRevert(bytes("Election is not in Registration state"));
        voting.registerCandidate(CANDIDATE_1);
    }

    function test_RevertWhen_RegisteringCandidateAfterElectionEnd() public {
        voting.startElection();
        voting.endElection();

        vm.expectRevert(bytes("Election is not in Registration state"));
        voting.registerCandidate(CANDIDATE_1);
    }

    /* ----------------------------------
       Voter Registration
    ---------------------------------- */

    function test_RegisterVoter_Success() public {
        voting.registerVoter(voterHash1);

        assertTrue(voting.voterEligible(voterHash1));
        assertFalse(voting.hasVoted(voterHash1));
        assertEq(voting.registeredVoterCount(), 1);
    }

    function test_RegisterVoter_IncrementsCount() public {
        voting.registerVoter(voterHash1);
        voting.registerVoter(voterHash2);

        assertEq(voting.registeredVoterCount(), 2);
    }

    function test_RevertWhen_RegisteringDuplicateVoter() public {
        voting.registerVoter(voterHash1);

        vm.expectRevert(bytes("Voter hash already registered"));
        voting.registerVoter(voterHash1);

        assertEq(voting.registeredVoterCount(), 1);
    }

    function test_RevertWhen_RegisteringInvalidVoterHash() public {
        vm.expectRevert(bytes("Invalid voter hash"));
        voting.registerVoter(bytes32(0));
    }

    function test_RevertWhen_NonCommissionRegistersVoter() public {
        vm.expectRevert(bytes("Only Election Commission can call this function"));
        vm.prank(outsider);
        voting.registerVoter(voterHash1);
    }

    function test_RevertWhen_RegisteringVoterAfterActivation() public {
        voting.startElection();

        vm.expectRevert(bytes("Election is not in Registration state"));
        voting.registerVoter(voterHash1);
    }

    function test_RevertWhen_RegisteringVoterAfterElectionEnd() public {
        voting.startElection();
        voting.endElection();

        vm.expectRevert(bytes("Election is not in Registration state"));
        voting.registerVoter(voterHash1);
    }

    /* ----------------------------------
       Election Lifecycle
    ---------------------------------- */

    function test_StartElection_Success() public {
        voting.startElection();

        assertEq(uint256(voting.getElectionState()), uint256(LocalVoting.ElectionState.Active));
    }

    function test_RevertWhen_NonCommissionStartsElection() public {
        vm.expectRevert(bytes("Only Election Commission can call this function"));
        vm.prank(outsider);
        voting.startElection();
    }

    function test_RevertWhen_StartingElectionTwice() public {
        voting.startElection();

        vm.expectRevert(bytes("Election is not in Registration state"));
        voting.startElection();
    }

    function test_RevertWhen_EndingBeforeActive() public {
        vm.expectRevert(bytes("Election is not Active"));
        voting.endElection();
    }

    function test_EndElection_Success() public {
        voting.startElection();
        voting.endElection();

        assertEq(uint256(voting.getElectionState()), uint256(LocalVoting.ElectionState.Ended));
    }

    function test_RevertWhen_NonCommissionEndsElection() public {
        voting.startElection();

        vm.expectRevert(bytes("Only Election Commission can call this function"));
        vm.prank(outsider);
        voting.endElection();
    }

    function test_RevertWhen_EndingElectionTwice() public {
        voting.startElection();
        voting.endElection();

        vm.expectRevert(bytes("Election is not Active"));
        voting.endElection();
    }

    function test_StateCannotReturnToPreviousPhase() public {
        voting.startElection();
        voting.endElection();

        vm.expectRevert(bytes("Election is not in Registration state"));
        voting.startElection();

        assertEq(uint256(voting.getElectionState()), uint256(LocalVoting.ElectionState.Ended));
    }

    /* ----------------------------------
       Voting
    ---------------------------------- */

    function test_RevertWhen_VotingBeforeActive() public {
        voting.registerCandidate(CANDIDATE_1);
        voting.registerVoter(voterHash1);

        vm.expectRevert(bytes("Election is not Active"));
        vm.prank(voteWallet);
        voting.castVote(CANDIDATE_1, voterHash1);
    }

    function test_CastVote_SuccessDuringActive() public {
        _registerCandidateAndVoter(CANDIDATE_1, voterHash1);
        voting.startElection();

        vm.prank(voteWallet);
        voting.castVote(CANDIDATE_1, voterHash1);

        assertEq(voting.getVoteCount(CANDIDATE_1), 1);
        assertTrue(voting.hasVoted(voterHash1));
    }

    function test_CastVote_IncrementsExactlyOneCandidateTally() public {
        voting.registerCandidate(CANDIDATE_1);
        voting.registerCandidate(CANDIDATE_2);
        voting.registerVoter(voterHash1);
        voting.startElection();

        vm.prank(voteWallet);
        voting.castVote(CANDIDATE_1, voterHash1);

        assertEq(voting.getVoteCount(CANDIDATE_1), 1);
        assertEq(voting.getVoteCount(CANDIDATE_2), 0);
    }

    function test_RevertWhen_InvalidCandidate() public {
        voting.registerVoter(voterHash1);
        voting.startElection();

        vm.expectRevert(bytes("Invalid candidate"));
        vm.prank(voteWallet);
        voting.castVote(999, voterHash1);
    }

    function test_RevertWhen_UnregisteredVoter() public {
        voting.registerCandidate(CANDIDATE_1);
        voting.startElection();

        vm.expectRevert(bytes("Unrecognised voter hash"));
        vm.prank(voteWallet);
        voting.castVote(CANDIDATE_1, unregisteredVoterHash);
    }

    function test_RevertWhen_VoterVotesTwice() public {
        _registerCandidateAndVoter(CANDIDATE_1, voterHash1);
        voting.startElection();

        vm.startPrank(voteWallet);
        voting.castVote(CANDIDATE_1, voterHash1);

        vm.expectRevert(bytes("You have already voted"));
        voting.castVote(CANDIDATE_1, voterHash1);
        vm.stopPrank();
    }

    function test_RevertWhen_VotingAfterEnded() public {
        _registerCandidateAndVoter(CANDIDATE_1, voterHash1);
        voting.startElection();
        voting.endElection();

        vm.expectRevert(bytes("Election is not Active"));
        vm.prank(voteWallet);
        voting.castVote(CANDIDATE_1, voterHash1);
    }

    function test_OneNonAdminWalletCanSubmitVotesForMultipleVoterHashes() public {
        voting.registerCandidate(CANDIDATE_1);
        voting.registerCandidate(CANDIDATE_2);
        voting.registerVoter(voterHash1);
        voting.registerVoter(voterHash2);
        voting.startElection();

        vm.startPrank(voteWallet);
        voting.castVote(CANDIDATE_1, voterHash1);
        voting.castVote(CANDIDATE_2, voterHash2);
        vm.stopPrank();

        assertEq(voting.getVoteCount(CANDIDATE_1), 1);
        assertEq(voting.getVoteCount(CANDIDATE_2), 1);
        assertTrue(voting.hasVoted(voterHash1));
        assertTrue(voting.hasVoted(voterHash2));
    }

    function test_RevertWhen_GetVoteCountForInvalidCandidate() public {
        vm.expectRevert(bytes("Candidate not found"));
        voting.getVoteCount(999);
    }

    /* ----------------------------------
       Gas Report Scenario
    ---------------------------------- */

    function test_GasReport() public {
        voting.registerCandidate(CANDIDATE_1);
        voting.registerVoter(voterHash1);
        voting.startElection();

        vm.prank(voteWallet);
        voting.castVote(CANDIDATE_1, voterHash1);

        voting.endElection();
    }

    function _registerCandidateAndVoter(uint256 candidateId, bytes32 voterHash) internal {
        voting.registerCandidate(candidateId);
        voting.registerVoter(voterHash);
    }
}
