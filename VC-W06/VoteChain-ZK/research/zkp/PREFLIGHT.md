# Semaphore V4 preflight — VC-W03

Date checked: 18 August 2026

## Version decision

VoteChain-ZK pins the following official Semaphore V4 packages exactly:

```text
@semaphore-protocol/core       4.14.3
@semaphore-protocol/contracts  4.14.3
```

`@semaphore-protocol/core` 4.14.3 aggregates the mutually compatible V4 identity, group, and proof packages at 4.14.3. The Solidity package is pinned separately because Foundry imports its official group and proof-verification contracts/interfaces.

## Official sources checked

- Semaphore release v4.14.3: https://github.com/semaphore-protocol/semaphore/releases/tag/v4.14.3
- Core package manifest at v4.14.3: https://github.com/semaphore-protocol/semaphore/blob/v4.14.3/packages/core/package.json
- V4 Identity implementation: https://github.com/semaphore-protocol/semaphore/blob/v4.14.3/packages/identity/src/index.ts
- V4 Group implementation: https://github.com/semaphore-protocol/semaphore/blob/v4.14.3/packages/group/src/index.ts
- V4 proof generation implementation: https://github.com/semaphore-protocol/semaphore/blob/v4.14.3/packages/proof/src/generateProof.ts
- V4 Solidity proof interface: https://github.com/semaphore-protocol/semaphore/blob/v4.14.3/packages/contracts/contracts/interfaces/ISemaphore.sol
- V4 Semaphore contract: https://github.com/semaphore-protocol/semaphore/blob/v4.14.3/packages/contracts/contracts/Semaphore.sol

## API decisions used by VoteChain

- `new Identity()` generates a random identity; `identity.export()` exports the private credential and `Identity.import()` restores it.
- `Group` is the V4 Lean-IMT group representation; ordered identity commitments determine its root.
- `generateProof(identity, group, message, scope, ...)` binds both public values and derives the Semaphore nullifier from the identity and scope.
- `ISemaphore.SemaphoreProof` contains Merkle depth/root, nullifier, message, scope, and eight proof points.
- `Semaphore.validateProof(groupId, proof)` verifies membership and rejects an already-used nullifier before VoteChain increments a candidate tally.
- VoteChain sets `message = candidateId` and `scope = electionId` exactly as frozen by the VC-W03 specification.

No custom circuit, custom nullifier, personal voter wallet, or vote-wallet allowlist is introduced.
