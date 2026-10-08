// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ISemaphore} from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import {ISemaphoreGroups} from "@semaphore-protocol/contracts/interfaces/ISemaphoreGroups.sol";

/// @title VoteChain ZK voting contract backed by Semaphore V4.
/// @notice The transaction sender is infrastructure only; voter uniqueness is enforced by Semaphore nullifiers.
contract ZKLocalVoting {
    address public immutable electionCommission;
    uint256 public immutable electionId;
    uint256 public immutable groupId;
    ISemaphore public immutable semaphore;

    enum ElectionState {
        Registration,
        Active,
        Ended
    }

    ElectionState public state;

    struct CandidateState {
        bool exists;
        uint256 voteCount;
    }

    mapping(uint256 => CandidateState) public candidates;
    mapping(uint256 => bool) public registeredCommitments;
    uint256 public candidateCount;
    uint256 public registeredVoterCount;

    event CandidateRegistered(uint256 indexed candidateId);
    event VoterCommitmentRegistered(uint256 indexed identityCommitment);
    event ElectionStarted(uint256 indexed electionId, uint256 indexed groupId);
    event ElectionEnded(uint256 indexed electionId);
    event VoteCast(uint256 indexed candidateId, uint256 indexed nullifier);

    modifier onlyCommission() {
        require(msg.sender == electionCommission, "Only Election Commission can call this function");
        _;
    }

    modifier onlyRegistration() {
        require(state == ElectionState.Registration, "Election is not in Registration state");
        _;
    }

    modifier onlyActive() {
        require(state == ElectionState.Active, "Election is not Active");
        _;
    }

    constructor(ISemaphore semaphore_, uint256 electionId_, uint256 merkleTreeDuration_) {
        require(address(semaphore_) != address(0), "Invalid Semaphore address");
        require(electionId_ != 0, "Invalid election ID");
        require(merkleTreeDuration_ != 0, "Invalid Merkle root duration");

        electionCommission = msg.sender;
        electionId = electionId_;
        semaphore = semaphore_;
        state = ElectionState.Registration;

        // The VoteChain contract is the Semaphore group admin, so only the
        // Election Commission path below can mutate membership before activation.
        groupId = semaphore_.createGroup(address(this), merkleTreeDuration_);
    }

    function registerCandidate(uint256 candidateId) external onlyCommission onlyRegistration {
        require(candidateId != 0, "Invalid candidate ID");
        require(!candidates[candidateId].exists, "Candidate ID already registered");

        candidates[candidateId] = CandidateState({exists: true, voteCount: 0});
        unchecked {
            candidateCount++;
        }

        emit CandidateRegistered(candidateId);
    }

    function registerVoterCommitment(uint256 identityCommitment) external onlyCommission onlyRegistration {
        require(identityCommitment != 0, "Invalid identity commitment");
        require(!registeredCommitments[identityCommitment], "Identity commitment already registered");

        // Mark first; any downstream revert rolls this state change back atomically.
        registeredCommitments[identityCommitment] = true;
        semaphore.addMember(groupId, identityCommitment);

        unchecked {
            registeredVoterCount++;
        }

        emit VoterCommitmentRegistered(identityCommitment);
    }

    function startElection() external onlyCommission onlyRegistration {
        state = ElectionState.Active;
        emit ElectionStarted(electionId, groupId);
    }

    function castVote(uint256 candidateId, ISemaphore.SemaphoreProof calldata proof) external onlyActive {
        require(candidates[candidateId].exists, "Invalid candidate");
        require(proof.message == candidateId, "Proof message does not match candidate");
        require(proof.scope == electionId, "Proof scope does not match election");

        // Semaphore V4 validates membership and records the group-scoped nullifier.
        // A reused nullifier reverts inside Semaphore before the tally is updated.
        semaphore.validateProof(groupId, proof);

        candidates[candidateId].voteCount++;
        emit VoteCast(candidateId, proof.nullifier);
    }

    function endElection() external onlyCommission onlyActive {
        state = ElectionState.Ended;
        emit ElectionEnded(electionId);
    }

    function getVoteCount(uint256 candidateId) external view returns (uint256) {
        require(candidates[candidateId].exists, "Candidate not found");
        return candidates[candidateId].voteCount;
    }

    function getElectionState() external view returns (ElectionState) {
        return state;
    }

    function getGroupRoot() external view returns (uint256) {
        return ISemaphoreGroups(address(semaphore)).getMerkleTreeRoot(groupId);
    }

    function getGroupSize() external view returns (uint256) {
        return ISemaphoreGroups(address(semaphore)).getMerkleTreeSize(groupId);
    }

    function getCommitmentIndex(uint256 identityCommitment) external view returns (uint256) {
        require(registeredCommitments[identityCommitment], "Identity commitment not registered");
        return ISemaphoreGroups(address(semaphore)).indexOf(groupId, identityCommitment);
    }
}
