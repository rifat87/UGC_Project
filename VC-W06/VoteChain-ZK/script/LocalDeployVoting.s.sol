// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Script} from "forge-std/Script.sol";
import {LocalVoting} from "../src/LocalVoting.sol";

contract DeployVoting is Script {
    function run() external {
        vm.startBroadcast();
        LocalVoting voting = new LocalVoting();
        vm.stopBroadcast();
    }
}
