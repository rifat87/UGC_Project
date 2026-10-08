#!/bin/bash

# Kill any running Anvil instances
pkill -f anvil

# Check if state file exists
if [ -f "./anvil-state.json" ]; then
    echo "Loading existing Anvil state..."
    anvil --load-state ./anvil-state.json &
else
    echo "Starting fresh Anvil instance..."
    anvil --dump-state ./anvil-state.json &
fi

# Wait for Anvil to start
sleep 2

# Set environment variables for deployment
export DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Deploy the contract only if we're starting fresh
if [ ! -f "./anvil-state.json" ]; then
    echo "Deploying contract..."
    forge script script/LocalDeployVoting.s.sol:LocalDeployVoting --rpc-url http://localhost:8545 --broadcast
fi

# Keep Anvil running in the background
wait 