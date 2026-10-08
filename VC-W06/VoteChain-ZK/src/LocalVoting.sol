// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract LocalVoting {
    address public electionCommission;

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
    uint256 public candidateCount;

    mapping(bytes32 => bool) public voterEligible;
    mapping(bytes32 => bool) public hasVoted;
    uint256 public registeredVoterCount;

    constructor() {
        electionCommission = msg.sender;
        state = ElectionState.Registration;
    }

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

    function registerCandidate(uint256 candidateId) public onlyCommission onlyRegistration {
        require(!candidates[candidateId].exists, "Candidate ID already registered");

        candidates[candidateId] = CandidateState({exists: true, voteCount: 0});
        candidateCount++;
    }

    function registerVoter(bytes32 voterHash) public onlyCommission onlyRegistration {
        require(voterHash != bytes32(0), "Invalid voter hash");
        require(!voterEligible[voterHash], "Voter hash already registered");

        voterEligible[voterHash] = true;
        registeredVoterCount++;
    }

    function startElection() public onlyCommission onlyRegistration {
        state = ElectionState.Active;
    }

    function castVote(uint256 candidateId, bytes32 voterHash) public onlyActive {
        require(candidates[candidateId].exists, "Invalid candidate");
        require(voterEligible[voterHash], "Unrecognised voter hash");
        require(!hasVoted[voterHash], "You have already voted");

        hasVoted[voterHash] = true;
        candidates[candidateId].voteCount++;
    }

    function endElection() public onlyCommission onlyActive {
        state = ElectionState.Ended;
    }

    function getVoteCount(uint256 candidateId) public view returns (uint256) {
        require(candidates[candidateId].exists, "Candidate not found");
        return candidates[candidateId].voteCount;
    }

    function getElectionState() public view returns (ElectionState) {
        return state;
    }
}
