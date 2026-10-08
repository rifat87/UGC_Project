# VoteChain-ZK Reproducibility

## Pinned Semaphore V4

The implementation pins:

- `@semaphore-protocol/core` = `4.14.3`
- `@semaphore-protocol/contracts` = `4.14.3`

These dependencies are isolated under `.zk-deps` so the frozen VC-W02 backend/frontend lockfiles do not need to be rewritten merely to add the ZK protocol runtime.

```bash
npm run setup:zk
```

## Standalone protocol PoC

```bash
npm run zk:poc
```

Expected properties: member proof verifies; non-member is not accepted; changed message and changed scope invalidate a proof; same identity + same scope has the same nullifier; different scope has a different nullifier.

## Solidity build/tests

```bash
forge fmt --check
forge build
forge test -vv
forge test --gas-report | tee research/gas/VC-W03-zk-gas.txt
forge build --sizes | tee research/gas/VC-W03-zk-contract-sizes.txt
npm run sync:zk-abi
```

The generated ABI source of truth is `out/ZKLocalVoting.sol/ZKLocalVoting.json`. The sync script copies the ABI to both application layers.

## Backend

```bash
cd votechain-central-server
npm ci
npm test -- --runInBand
```

## Frontend

```bash
cd votechain-frontend-ts
npm ci
npm run build
npm run lint
```

## Local E2E

Start Anvil, then run:

```bash
npm run zk:e2e
```

See `research/zkp/e2e/README.md` for the exact synthetic flow.

## Voter database migration rule

Historical VC-W01/VC-W02 voter records must not be converted into Semaphore identities by hashing/deriving from NID, the legacy voter hash, DOB, biometrics, or wallet address. Mark them as legacy if needed and perform fresh ZK enrollment so each voter receives a random Semaphore identity:

```bash
cd votechain-central-server
MIGRATION_ALLOW_RUN=true MONGO_URI='<intended database>' node scripts/markLegacyVotersForZkMigration.js
```

Back up and explicitly select the intended database before any migration. The script does not generate credentials; it only marks legacy records for controlled re-enrollment.

## Deterministic group reconstruction

`ZKLocalVoting` is the Semaphore group administrator and exposes only append-only voter-commitment registration during `Registration`; it does not expose group update/removal operations. The proof backend therefore reconstructs the exact member ordering from the contract's `VoterCommitmentRegistered` event log, then checks the reconstructed JavaScript `Group` size and Merkle root against `getGroupSize()` and `getGroupRoot()` before generating any proof. A mismatch fails closed.

For long-lived networks, set the contract deployment block to avoid scanning from genesis:

```bash
ZK_CONTRACT_DEPLOYMENT_BLOCK=<deployment block>
```

This value is only a query optimization. The chain event sequence plus current chain root/size remains the group authority; MongoDB is not allowed to invent membership ordering.
