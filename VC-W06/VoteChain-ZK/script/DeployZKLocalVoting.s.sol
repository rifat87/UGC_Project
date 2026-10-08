// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {Semaphore} from "@semaphore-protocol/contracts/Semaphore.sol";
import {SemaphoreVerifier} from "@semaphore-protocol/contracts/base/SemaphoreVerifier.sol";
import {ISemaphoreVerifier} from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";
import {ZKLocalVoting} from "../src/ZKLocalVoting.sol";

contract DeployZKLocalVoting is Script {
    function run() external returns (SemaphoreVerifier verifier, Semaphore semaphore, ZKLocalVoting voting) {
        uint256 electionId = vm.envUint("ELECTION_ID");
        require(electionId != 0, "ELECTION_ID must be non-zero");
        uint256 merkleTreeDuration = vm.envOr("SEMAPHORE_MERKLE_ROOT_DURATION", uint256(7 days));

        vm.startBroadcast();
        verifier = new SemaphoreVerifier();
        semaphore = new Semaphore(ISemaphoreVerifier(address(verifier)));
        voting = new ZKLocalVoting(semaphore, electionId, merkleTreeDuration);
        vm.stopBroadcast();
    }
}
