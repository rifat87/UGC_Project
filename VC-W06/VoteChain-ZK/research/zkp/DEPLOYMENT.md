# VoteChain-ZK local deployment order

The ZK deployment is separate from the frozen `LocalVoting.sol` baseline.

## 1. Install the pinned Semaphore V4 dependencies

```bash
npm run setup:zk
```

## 2. Build contracts

```bash
forge build
```

This builds the official Semaphore verifier/contracts and `src/ZKLocalVoting.sol` using the imports from `.zk-deps/node_modules`.

## 3. Start a local Anvil network

```bash
anvil
```

Use only development/test keys for local execution.

## 4. Deploy the ZK stack

Set a nonzero election identifier and run the Foundry deployment script:

```bash
export ELECTION_ID=20260818
export SEMAPHORE_MERKLE_ROOT_DURATION=604800
forge script script/DeployZKLocalVoting.s.sol:DeployZKLocalVoting \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

Deployment order inside the script is:

```text
SemaphoreVerifier
      |
      v
Semaphore(verifier)
      |
      v
ZKLocalVoting(semaphore, electionId, merkleTreeDuration)
      |
      v
ZKLocalVoting creates one Semaphore group
with ZKLocalVoting itself as group administrator
```

The Election Commission remains the `ZKLocalVoting` deployer. Group membership can only be appended through `registerVoterCommitment()` while the election is in `Registration`.

## 5. Synchronize the generated ABI

```bash
npm run sync:zk-abi
```

Source artifact:

```text
out/ZKLocalVoting.sol/ZKLocalVoting.json
```

Destinations:

```text
votechain-central-server/abi/ZKLocalVoting.json
votechain-frontend-ts/src/abi/ZKLocalVoting.json
```

## 6. Configure application services

Set the deployed `ZKLocalVoting` address in both backend and frontend configuration, configure the backend RPC URL and a dedicated 32-byte `ZK_CREDENTIAL_SECRET_KEY`, then install/start the application dependencies.

The backend may optionally set `ZK_CONTRACT_DEPLOYMENT_BLOCK` to the deployment block for faster event reconstruction. It is only a query optimization; group membership order/root remains chain-authoritative.

## 7. Registration order

During `Registration`:

```text
candidate metadata -> MongoDB -> registerCandidate(candidateId)
voter civil+biometric enrollment -> random Semaphore identity -> encrypted credential in MongoDB
                                 -> registerVoterCommitment(commitment)
                                 -> backend reconciliation against chain membership
```

After all eligible commitments are registered:

```text
startElection()
```

No new commitments can be added after activation.
