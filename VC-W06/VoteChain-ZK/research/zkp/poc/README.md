# Semaphore V4 Standalone PoC

Pinned runtime: `@semaphore-protocol/core@4.14.3`.

Run from repository root:

```bash
npm run setup:zk
node research/zkp/poc/semaphore-poc.mjs
```

The PoC verifies a registered member proof, rejects a non-member, confirms that mutating `message` or `scope` invalidates a proof, confirms same-identity/same-scope nullifier stability, and confirms a different election scope yields a different nullifier. It writes non-secret measurements to `research/zkp/logs/semaphore-poc-result.json`.
