# Local VoteChain-ZK E2E

Prerequisites: Node dependencies installed, Semaphore V4 dependencies installed, Foundry build completed, and Anvil running on `127.0.0.1:8545`.

```bash
npm run setup:zk
(cd votechain-central-server && npm ci)
forge build
anvil
# in another terminal
node research/zkp/e2e/local-zk-e2e.mjs
```

The script deploys the official Semaphore verifier, official Semaphore contract, and `ZKLocalVoting`; registers two candidates and three synthetic voter commitments; freezes the election group; generates real Semaphore V4 proofs; uses the same non-admin Anvil wallet to submit voter A and voter B votes; rejects voter A's second vote by reused election-scope nullifier; ends the election; and rejects a fresh voter C proof after the election is ended. Non-secret measurements are saved in `research/zkp/logs/local-zk-e2e-result.json`.
