# VoteChain VC-W03 Final Report

## Final VoteChain-ZK — Semaphore V4 Integration

**Task ID:** VC-W03  
**Date:** 18 August 2026  
**Input:** Revised/frozen `VoteChain_VC-W02_AppIntegration.zip`  
**Implementation status:** **Source implementation complete** for the frozen VC-W03 architecture.  
**Verification status:** Backend/static gates pass. The worker runtime cannot install npm packages and does not contain Forge/Anvil/MongoDB, so real Semaphore proof execution, Solidity compilation/tests, dependency-based frontend build/lint, local E2E, ABI generation from Foundry output, gas/size measurement and proof benchmarks are explicitly **NOT TESTED / ENVIRONMENT BLOCKED**. VC-W03 is therefore **not truthfully marked fully acceptance-complete** in this runtime.

No cryptographic success, gas value, proof timing, contract size, frontend build success, or E2E success is fabricated.

---

# A. Input Baseline Confirmed

VC-W03 was implemented from the revised/frozen VC-W02 application integration package, not from the original pre-cleanup codebase.

The historical cleaned non-ZKP Solidity baseline was preserved exactly. Hashes after VC-W03 source work are:

| Frozen file | SHA-256 |
|---|---|
| `src/LocalVoting.sol` | `b5718b72b0ef3762c84c611234bc376d49b76bd09c139a9886fd91e1dd19133a` |
| `test/LocalVotingTest.t.sol` | `a74ebea5402b6fcdc07a5a0a79fe8c3a7add6199cf17c472cc36d1c24c97ee90` |
| `script/LocalDeployVoting.s.sol` | `e28c54d0ce1627f4ea317298db6717af8f6f73a338be98c917a7f66b42f423db` |
| `research/gas/VC-W01-clean-baseline-gas.txt` | `293d244052efb22060f6133a8821a6356de89eea2a1e5c89198b0a44beb72bdc` |

These match the accepted VC-W02 report baseline. The non-ZKP contract was not mutated into a ZK contract; the new implementation is separate as `src/ZKLocalVoting.sol`.

The VC-W02 candidate architecture remains intact: MongoDB owns civil/application candidate metadata, `candidateId` is the on-chain key, and blockchain state is authoritative for candidate existence/tally.

---

# B. Semaphore Version / Dependency Decision

A current official Semaphore V4 preflight was performed before integration.

Pinned packages:

```text
@semaphore-protocol/core       4.14.3
@semaphore-protocol/contracts  4.14.3
```

They are isolated under:

```text
.zk-deps/package.json
```

with exact versions rather than ranges. The official `core` package at this tag aggregates mutually compatible Semaphore V4 identity, group and proof functionality, while the official `contracts` package supplies the Solidity group/proof-verification stack.

Official sources checked on 18 August 2026:

```text
https://github.com/semaphore-protocol/semaphore/releases/tag/v4.14.3
https://github.com/semaphore-protocol/semaphore/blob/v4.14.3/packages/core/package.json
https://github.com/semaphore-protocol/semaphore/blob/v4.14.3/packages/identity/src/index.ts
https://github.com/semaphore-protocol/semaphore/blob/v4.14.3/packages/group/src/index.ts
https://github.com/semaphore-protocol/semaphore/blob/v4.14.3/packages/proof/src/generateProof.ts
https://github.com/semaphore-protocol/semaphore/blob/v4.14.3/packages/contracts/contracts/interfaces/ISemaphore.sol
https://github.com/semaphore-protocol/semaphore/blob/v4.14.3/packages/contracts/contracts/Semaphore.sol
```

The exact API supports the frozen design:

```text
new Identity()               -> random Semaphore identity
identity.commitment          -> public group member value
identity.export()            -> private credential representation
Identity.import(...)         -> credential restoration
new Group(commitments)       -> deterministic Lean-IMT group
generateProof(identity, group, message, scope, ...)
ISemaphore.SemaphoreProof
Semaphore.validateProof(groupId, proof)
```

VoteChain binds:

```text
message = candidateId
scope   = electionId
```

No custom Circom circuit, custom nullifier, personal-voter wallet, wallet allowlist, or alternative ZKP protocol was introduced.

The implementation allows official Semaphore proving artifacts to be supplied explicitly through paired `ZK_SNARK_WASM` / `ZK_SNARK_ZKEY` paths for reproducibility. Otherwise the official package behavior is used.

---

# C. Standalone PoC Result

A standalone Semaphore V4 PoC is implemented at:

```text
research/zkp/poc/semaphore-poc.mjs
```

It is written to demonstrate, with the official runtime:

```text
random Identity
 -> commitment
 -> Group.addMember / Group constructor
 -> generateProof(message=candidateId, scope=electionId)
 -> verifyProof
 -> nullifier
```

It also asserts:

- registered member proof verifies;
- non-member proof is not accepted;
- changing the candidate/message invalidates the proof;
- changing election scope invalidates the proof;
- same identity + same scope produces the same nullifier even for another candidate message;
- different scope produces a different nullifier;
- proof generation time, off-chain verification time and serialized proof size are recorded only after successful execution.

**Execution result in this worker runtime:** **NOT TESTED / ENVIRONMENT BLOCKED.**

Command:

```bash
npm run setup:zk
```

Result: dependency installation timed out because the runtime cannot resolve/reach the npm registry.

Command:

```bash
node research/zkp/poc/semaphore-poc.mjs
```

Result: exits before cryptographic execution because `.zk-deps/node_modules/@semaphore-protocol/core` could not be installed.

Therefore this report does **not** claim the standalone Groth16 proof passed here. The source and exact execution command are included for a network-enabled environment.

---

# D. Final ZK Architecture

## Registration

```text
Admin collects voter civil data + existing biometric enrollment
        |
        v
Backend validates voter / duplicate NID
        |
        v
new random Semaphore Identity()
        |
        +--> public commitment
        |
        +--> Identity.export() private credential
                 |
                 v
        AES-256-GCM with dedicated ZK_CREDENTIAL_SECRET_KEY
                 |
                 v
        MongoDB stores ciphertext + commitment + pending status
        |
        v
Frontend receives ONLY public commitment
        |
        v
Election Commission wallet
        |
        v
ZKLocalVoting.registerVoterCommitment(commitment)
        |
        v
official Semaphore group.addMember
        |
        v
backend reconciliation verifies chain membership/index
```

## Election-day vote

```text
candidateId selected
        |
        v
face OR fingerprint verification
        |
        v
matched NID used internally only
        |
        v
MongoDB voter lookup
        |
        v
explicit biometric proof-generation gate
        |
        v
load encrypted ZK credential
        |
        v
decrypt internally + Identity.import
        |
        v
reconstruct group from on-chain VoterCommitmentRegistered events
        |
        +--> compare JS group size/root to chain getGroupSize/getGroupRoot
        |
        v
generateProof(message=candidateId, scope=electionId)
        |
        v
local proof verification when available
        |
        v
frontend receives candidateId + electionId + Semaphore proof only
        |
        v
existing connected non-admin vote wallet
        |
        v
ZKLocalVoting.castVote(candidateId, proof)
        |
        +--> Active?
        +--> candidate exists?
        +--> proof.message == candidateId?
        +--> proof.scope == electionId?
        +--> official Semaphore proof valid?
        +--> official Semaphore nullifier unused?
        |
        v
candidate voteCount++
```

The browser never receives the Semaphore private identity or its encryption key.

---

# E. Smart Contract Changes

A separate `src/ZKLocalVoting.sol` was added.

Core state:

```solidity
address public immutable electionCommission;
uint256 public immutable electionId;
uint256 public immutable groupId;
ISemaphore public immutable semaphore;

enum ElectionState { Registration, Active, Ended }
ElectionState public state;

struct CandidateState {
    bool exists;
    uint256 voteCount;
}

mapping(uint256 => CandidateState) public candidates;
mapping(uint256 => bool) public registeredCommitments;
uint256 public candidateCount;
uint256 public registeredVoterCount;
```

Key design detail: `ZKLocalVoting` creates the Semaphore group with **itself as group administrator**. External accounts therefore cannot directly use the Semaphore group-management API to mutate this election group. `ZKLocalVoting` exposes only append-only `registerVoterCommitment()` while `Registration` is active and exposes no update/remove wrapper. Once `startElection()` succeeds, the eligible set is frozen through the VoteChain interface.

Required functions implemented:

```text
registerCandidate(candidateId)
registerVoterCommitment(identityCommitment)
startElection()
castVote(candidateId, SemaphoreProof)
endElection()
getVoteCount(candidateId)
getElectionState()
getGroupRoot()
getGroupSize()
getCommitmentIndex(commitment)
```

`castVote` checks the frozen VoteChain bindings before delegating to official Semaphore validation:

```text
state == Active
candidate exists
proof.message == candidateId
proof.scope == electionId
semaphore.validateProof(groupId, proof)
```

Only after successful official validation does the candidate tally increment.

The contract contains no active:

```text
NID
voter name
DOB
location
voterHash
encryptedSalt
ZK private credential
biometric material
hasVoted[voterHash]
```

Deployment tooling was added in `script/DeployZKLocalVoting.s.sol`. It deploys:

```text
SemaphoreVerifier -> Semaphore -> ZKLocalVoting -> VoteChain-controlled Semaphore group
```

No production address is hard-coded.

---

# F. MongoDB / Credential Storage Changes

The Voter model retains protected civil fields off-chain and adds:

```text
zkIdentityCommitment
zkCredential.version
zkCredential.iv
zkCredential.ciphertext
zkCredential.authTag
zkRegistrationStatus = pending | registered | failed | legacy
zkGroupIndex
zkRegistrationTxHash
```

The ZK identity is generated using `new Identity()` with no deterministic seed. It is not derived from NID, voterHash, DOB, name, biometric data, or wallet address.

Credential encryption is a distinct authenticated-encryption mechanism:

```text
AES-256-GCM
12-byte random IV
separate 32-byte ZK_CREDENTIAL_SECRET_KEY
identityCommitment bound as authenticated additional data (AAD)
```

The private credential is exported only inside the backend, immediately encrypted for storage, and restored only inside backend proof generation.

The legacy fields:

```text
voterHash
encryptedSalt
```

remain in the database schema only for historical VC-W01/VC-W02 records and comparison. New ZK enrollment does not populate or consume them.

A guarded migration helper:

```text
votechain-central-server/scripts/markLegacyVotersForZkMigration.js
```

marks old records for controlled re-enrollment. It **does not** manufacture a Semaphore identity from legacy identity material. Existing voters require fresh random ZK enrollment.

---

# G. Backend Proof Flow

The ZK backend was separated into focused services:

```text
semaphoreRuntime.js      pinned runtime loader
identityService.js       random identity + encrypted credential creation
credentialCrypto.js      AES-256-GCM encrypt/decrypt
biometricProofGate.js    explicit successful-biometric gate
proofCore.js             credential restore + candidate/scope proof binding
proofService.js          chain registration + group reconstruction orchestration
proofSerialization.js    browser/ethers-safe proof serialization
groupEvents.js           deterministic on-chain registration-event ordering
groupCore.js             JS Group reconstruction + root/size checks
groupService.js          chain event/root/size retrieval
snarkArtifacts.js        optional paired proving artifact configuration
```

## Biometric gating

Both active biometric paths preserve their existing matching architecture:

```text
face: current Python face-recognition path
fingerprint: current ESP32/serial DETECT path
```

Only after a successful match does the controller call the explicit `prepareProofAfterBiometricAuthentication()` boundary. Backend tests prove a failed biometric gate does not invoke the proof generator.

The fingerprint serial port is now configurable through:

```text
FINGERPRINT_SERIAL_PORT
```

without redesigning the device protocol.

## Group reconstruction

MongoDB is **not** trusted to guess member ordering.

The ZK contract is the Semaphore group administrator and emits one `VoterCommitmentRegistered` event for every successful VoteChain-controlled append. The backend:

1. queries those events;
2. sorts them deterministically by block/log order;
3. rebuilds the official JS `Group` with exactly that order;
4. obtains current `getGroupSize()` and `getGroupRoot()` from the chain;
5. rejects proof generation if either reconstructed size or root differs.

The backend also checks `registeredCommitments(commitment)` directly on-chain before decrypting/generating a proof. Mongo registration status is not allowed to become the eligibility authority.

This design fails closed on stale/incorrect group data.

---

# H. Frontend Flow

## Admin

During `Registration`:

```text
capture/enroll biometrics
 -> create backend ZK voter enrollment
 -> receive public identity commitment only
 -> Election Commission wallet registerVoterCommitment(commitment)
 -> reconcile status against chain
```

The browser never receives:

```text
Semaphore private key / exported identity
encrypted ZK credential
decryption key
voterHash
encryptedSalt
```

## Voter

The active flow is:

```text
candidateId selection
 -> biometric verification
 -> "Preparing anonymous eligibility proof..."
 -> backend proof response
 -> same connected non-admin vote wallet
 -> castVote(candidateId, proof)
 -> confirmation/reset
```

The frontend checks that `proof.message` matches the selected candidate before submission. The contract performs the authoritative check again.

## Public

The existing public endpoint/UI continues to expose only election state and privacy-safe candidate metadata plus blockchain-authoritative vote counts. No voter-level information is added.

---

# I. voterHash Removal From ZK Path

The active ZK path no longer uses:

```text
voterHash generation
encryptedSalt reconstruction
voterHash response after biometric verification
registerVoter(voterHash)
castVote(candidateId, voterHash)
voterEligible[voterHash]
hasVoted[voterHash]
```

A repository scan over the active backend vote/proof services, active biometric controllers, voter UI, biometric UI and `useContract.ts` found **no `voterHash`, `encryptedSalt`, or `VOTER_SALT_SECRET_KEY` matches**.

Legacy references remain only where needed to preserve the independent historical baseline/database migration boundary.

`src/LocalVoting.sol` is intentionally preserved as the non-ZKP experimental comparison version.

---

# J. Nullifier Behavior

VoteChain does not invent a second nullifier algorithm.

The proof uses:

```text
scope = electionId
```

so Semaphore derives the identity/scope nullifier. `Semaphore.validateProof` performs proof verification and nullifier reuse protection before returning to `ZKLocalVoting`.

Conceptually:

```text
same identity + same electionId
        -> same Semaphore nullifier
        -> first valid proof accepted
        -> later proof in same election rejected
```

Changing `candidateId` does not create a new election identity allowance because the nullifier is scoped to the election, not the candidate.

A different `electionId` produces a different scope and therefore different nullifier semantics, supporting future election separation without reintroducing a persistent `voterHash`.

The PoC source asserts these properties but real cryptographic execution remains environment-blocked in this worker runtime.

---

# K. Wallet Semantics

The frozen wallet model is preserved.

```text
connected address == electionCommission
        -> admin role / privileged registration + lifecycle transactions

connected non-admin address
        -> vote-submission infrastructure wallet
```

`castVote` has no wallet-based voter identity rule.

No:

```text
authorizedVoteWallet
onlyVoteWallet
vote-wallet allowlist
relayer allowlist
wallet-to-voter mapping
hasVoted[msg.sender]
personal citizen wallet requirement
```

was added.

`test/ZKLocalVotingTest.t.sol` contains an explicit same-wallet test in which one non-admin infrastructure wallet submits two different voters' valid-nullifier proofs. The local E2E script also uses the same signer for voter A and voter B.

The Foundry execution of that contract test and the real E2E remain environment-blocked here; the behavior is implemented in source and covered by the mock-Semaphore unit design.

---

# L. Privacy / Security Boundary

The implementation is designed to support the following claims once the real cryptographic gates are executed successfully:

```text
anonymous on-chain eligibility proof via Semaphore membership
no persistent voterHash in ZK vote transactions
one accepted vote per Semaphore identity per election scope
candidate-bound proof message
public blockchain-authoritative tally
civil voter data and biometrics remain off-chain
```

It does **not** provide or claim:

```text
complete voter anonymity
authority-blind anonymity
hidden candidate choice / ballot secrecy
receipt-freeness
coercion resistance
timing-correlation resistance
national deployment readiness
```

Important remaining trust boundaries:

1. The backend/credential infrastructure stores each voter’s encrypted Semaphore credential and holds the decryption secret, so it remains trusted and can associate a civil identity with a credential/commitment.
2. Biometric authentication timing can potentially correlate with subsequent blockchain submission timing.
3. `candidateId` is the public proof message, so the selected candidate remains visible on-chain.
4. The generated Semaphore proof is a bearer transaction input before confirmation. Under the intentionally frozen public/shared-wallet architecture, mempool/front-running/denial-of-service behavior is an operational threat to discuss rather than “fix” by silently binding voter identity to a wallet.
5. The group commitment list is public, as expected for Semaphore membership; the proof hides which registered commitment produced the vote.

---

# M. File-by-File Change List

Compared with the revised VC-W02 input package:

| Status | File | Purpose |
|---|---|---|
| Changed | `.gitignore` | Ignore isolated ZK dependencies/build outputs. |
| New | `.zk-deps/package.json` | Exact Semaphore V4 package pins. |
| Changed | `foundry.toml` | Add isolated Semaphore contracts dependency path. |
| Changed | `package.json` | ZK setup, PoC, E2E and ABI-sync commands. |
| New | `research/zkp/PREFLIGHT.md` | Exact V4 dependency/API decision and official sources. |
| New | `research/zkp/DEPLOYMENT.md` | Reproducible local ZK deployment order. |
| New | `research/zkp/README.md` | ZK reproduction/migration/group-reconstruction commands. |
| New | `research/zkp/poc/README.md` | Standalone PoC instructions. |
| New | `research/zkp/poc/semaphore-poc.mjs` | Official-runtime identity/group/proof/nullifier PoC. |
| New | `research/zkp/e2e/README.md` | Local synthetic E2E procedure. |
| New | `research/zkp/e2e/local-zk-e2e.mjs` | Real Semaphore + Anvil E2E/measurement runner. |
| New | `research/zkp/logs/README.md` | Explicit no-fabrication benchmark policy/output locations. |
| New | `src/ZKLocalVoting.sol` | Final separate VoteChain-ZK election contract. |
| New | `test/ZKLocalVotingTest.t.sol` | ZK lifecycle, membership/nullifier/wallet-semantics contract tests. |
| New | `script/DeployZKLocalVoting.s.sol` | SemaphoreVerifier -> Semaphore -> ZKLocalVoting deployment. |
| New | `scripts/setup-zk-deps.sh` | Exact ZK dependency installation. |
| New | `scripts/sync-zk-local-voting-abi.mjs` | Foundry-artifact-based ZK ABI synchronization. |
| Changed | `votechain-central-server/.env.example` | ZK credential key, deployment block, serial-port and active ZK config placeholders. |
| Changed | `votechain-central-server/models/Voter.js` | Encrypted ZK credential, commitment and reconciliation state. |
| Changed | `votechain-central-server/controllers/voterController.js` | Random ZK identity enrollment and chain-truth reconciliation. |
| Changed | `votechain-central-server/controllers/voteController.js` | Face-gated backend proof generation; no voterHash response. |
| Changed | `votechain-central-server/controllers/fingerprintController.js` | Fingerprint-gated backend proof generation; configurable serial port; no voterHash response. |
| Changed | `votechain-central-server/routes/voterRoutes.js` | ZK enrollment/reconciliation routes. |
| Changed | `votechain-central-server/routes/voteRoutes.js` | Active ZK face-proof path; legacy vote stubs removed. |
| New | `votechain-central-server/scripts/markLegacyVotersForZkMigration.js` | Guarded legacy marking; requires fresh random ZK enrollment. |
| Changed | `votechain-central-server/services/privacyProjection.js` | Safe voter projection + public commitment-only enrollment response. |
| New | `votechain-central-server/services/zk/semaphoreRuntime.js` | Official runtime loader. |
| New | `votechain-central-server/services/zk/identityService.js` | Random Semaphore identity creation. |
| New | `votechain-central-server/services/zk/credentialCrypto.js` | Dedicated AES-256-GCM credential protection. |
| New | `votechain-central-server/services/zk/biometricProofGate.js` | Explicit successful-biometric gate. |
| New | `votechain-central-server/services/zk/groupEvents.js` | Deterministic on-chain member ordering. |
| New | `votechain-central-server/services/zk/groupCore.js` | Group reconstruction/root-size validation. |
| New | `votechain-central-server/services/zk/groupService.js` | Contract event/root/size synchronization. |
| New | `votechain-central-server/services/zk/proofSerialization.js` | Contract/browser-safe proof serialization. |
| New | `votechain-central-server/services/zk/proofCore.js` | Credential restore, commitment check, message/scope binding and proof generation. |
| New | `votechain-central-server/services/zk/proofService.js` | Chain membership + group + proof orchestration. |
| New | `votechain-central-server/services/zk/snarkArtifacts.js` | Optional paired local proving artifacts. |
| Changed | `votechain-central-server/utils/contract.js` | Active backend chain client now uses ZKLocalVoting ABI. |
| Changed | `votechain-central-server/__tests__/privacyProjection.test.js` | ZK enrollment privacy assertion. |
| New | `votechain-central-server/__tests__/zkAbiCompatibility.test.js` | ZK ABI/privacy boundary tests. |
| New | `votechain-central-server/__tests__/zkActivePath.test.js` | Active path no-voterHash/wallet separation assertions. |
| New | `votechain-central-server/__tests__/zkBiometricGate.test.js` | Success/failure biometric proof-gate behavior. |
| New | `votechain-central-server/__tests__/zkCredential.test.js` | Encryption/wrong-key/random-identity tests. |
| New | `votechain-central-server/__tests__/zkGroup.test.js` | Group reconstruction/stale-root/event-order tests. |
| New | `votechain-central-server/__tests__/zkProofCore.test.js` | Candidate/scope/chain-registration/credential mismatch tests. |
| New | `votechain-central-server/__tests__/zkSnarkArtifacts.test.js` | Proving artifact configuration tests. |
| New | `votechain-central-server/abi/ZKLocalVoting.json` | Bootstrap matching ZK interface copy pending real Foundry sync. |
| Changed | `votechain-frontend-ts/.env.example` | Active ZK contract configuration. |
| New | `votechain-frontend-ts/src/abi/ZKLocalVoting.json` | Bootstrap matching frontend ZK interface copy pending real Foundry sync. |
| Changed | `votechain-frontend-ts/src/components/Admin/RegisterVoter.tsx` | Commitment-only admin registration flow. |
| Changed | `votechain-frontend-ts/src/components/Biometric/VerificationModal.tsx` | Candidate-bound biometric proof request and generic ZK status. |
| Changed | `votechain-frontend-ts/src/components/Voter/VoteCasting.tsx` | Proof-based vote transaction using same infrastructure wallet. |
| Changed | `votechain-frontend-ts/src/config/contract.ts` | Active ZK ABI/config. |
| Changed | `votechain-frontend-ts/src/hooks/useContract.ts` | `registerVoterCommitment` and proof-based `castVote`. |
| Changed | `votechain-frontend-ts/src/services/api.ts` | ZK enrollment/reconciliation/proof API types. |
| New | `research/reports/VC-W03-verification-log.txt` | Consolidated command/result evidence. |
| New | `research/reports/VC-W03-command-logs/` | Raw command outputs for the verification attempts. |
| New | `research/reports/VC-W03_Final_Report.md` | This report. |

Historical VC-W01/VC-W02 evidence files remain in the package.

---

# N. Testing Report

## N.1 Frozen baseline hashes

**Command:**

```bash
sha256sum src/LocalVoting.sol test/LocalVotingTest.t.sol \
  script/LocalDeployVoting.s.sol research/gas/VC-W01-clean-baseline-gas.txt
```

**Result:** PASS.

**Relevant output:** hashes exactly match Section A.

## N.2 Backend tests

**Command:**

```bash
cd votechain-central-server
npm test -- --runInBand
```

**Result:** PASS.

**Relevant output:**

```text
1..31
# tests 31
# suites 0
# pass 31
# fail 0
# cancelled 0
# skipped 0
```

The tests cover retained VC-W02 behavior plus ZK ABI privacy, active-path removal of voterHash, credential encryption/decryption, wrong-key rejection, random identity creation, public-commitment-only enrollment, deterministic group reconstruction, stale/incomplete group rejection, Merkle-root mismatch rejection, on-chain event ordering, successful biometric proof gating, failed-biometric proof denial, candidate/election proof binding, chain-registration enforcement, encrypted credential/commitment mismatch, and proving-artifact configuration.

## N.3 Backend/research JavaScript syntax

**Command:**

```text
node --check <all non-node_modules backend/research ZK/script .js/.mjs files>
```

**Result:** PASS.

**Relevant output:**

```text
JS_SYNTAX_OK
```

## N.4 Supplemental frontend syntax pass

**Command:** global TypeScript 5.8.3 `transpileModule` over non-declaration `.ts/.tsx` files under `votechain-frontend-ts/src`.

**Result:** PASS as syntax-only evidence, not a substitute for the required build/lint.

**Relevant output:**

```text
FRONTEND_TS_TSX_SYNTAX_OK files=46
```

## N.5 Active ZK voterHash/salt scan

**Command:**

```bash
grep -RniE 'voterHash|encryptedSalt|VOTER_SALT_SECRET_KEY' \
  votechain-central-server/controllers/voteController.js \
  votechain-central-server/controllers/fingerprintController.js \
  votechain-central-server/services/zk \
  votechain-frontend-ts/src/components/Voter \
  votechain-frontend-ts/src/components/Biometric \
  votechain-frontend-ts/src/hooks/useContract.ts
```

**Result:** PASS.

**Relevant output:** no matches.

## N.6 Packaged ZK ABI consistency

**Command:**

```bash
sha256sum votechain-central-server/abi/ZKLocalVoting.json \
          votechain-frontend-ts/src/abi/ZKLocalVoting.json
cmp <backend ABI> <frontend ABI>
```

**Result:** PASS for copy identity only.

**Relevant output:**

```text
15847b22773f3a7d41aae2066e4eed22bde0603a447b484cc155e00fb1e42c1f  backend
15847b22773f3a7d41aae2066e4eed22bde0603a447b484cc155e00fb1e42c1f  frontend
ZK_ABI_COPIES_IDENTICAL
```

These are bootstrap interface copies. Because Forge could not run, they are **not** represented as generated-artifact verification.

## N.7 ZK dependency setup

**Command:**

```bash
npm run setup:zk
```

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

**Relevant output:** command started the exact install script but timed out (exit 124) because npm registry access did not complete.

## N.8 Standalone Semaphore PoC

**Command:**

```bash
npm run zk:poc
```

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

**Relevant output:**

```text
Error: Semaphore V4 runtime is not installed. Run "npm run setup:zk" first.
```

No proof-success claim is made.

## N.9 Foundry format/build/test

**Commands:**

```bash
forge fmt --check
forge build
forge test -vv
forge test --gas-report
forge build --sizes
```

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

**Relevant output for each:**

```text
forge: command not found
```

The worker also attempted to reach the official Foundry release URL from the shell; the runtime could not resolve `github.com`, so a local toolchain install could not be completed.

## N.10 Generated ZK ABI synchronization

**Command:**

```bash
node scripts/sync-zk-local-voting-abi.mjs
```

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

**Relevant output:**

```text
ENOENT: out/ZKLocalVoting.sol/ZKLocalVoting.json
```

because `forge build` could not run.

## N.11 Backend dependency install

**Command:**

```bash
cd votechain-central-server
npm ci --no-audit --no-fund
```

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

Registry access did not complete; the capped attempt exited 137. Partial `node_modules` was deleted.

The dependency-free backend test runner still executed the 31 source/unit tests listed above.

## N.12 Frontend dependency install

**Command:**

```bash
cd votechain-frontend-ts
npm ci --no-audit --no-fund
```

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

Registry access did not complete; the capped attempt exited 137. Partial `node_modules` was deleted.

## N.13 Frontend build

**Command:**

```bash
npm run build
```

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

**Relevant output:** TypeScript cannot resolve unavailable Vite/plugin/Node/react-router-dom packages/types because `npm ci` did not complete.

This report does not convert that environment failure into either a source-level PASS or a source-level FAIL.

## N.14 Frontend lint

**Command:**

```bash
npm run lint
```

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

**Relevant output:**

```text
eslint: not found
```

## N.15 Local end-to-end ZK flow

**Command:**

```bash
npm run zk:e2e
```

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

The runner is implemented to deploy the official Semaphore verifier/Semaphore/ZKLocalVoting artifacts, register candidates and three synthetic identities, compare JS/on-chain Merkle roots, submit voter A and voter B through the **same** vote wallet, reject voter A’s second same-scope proof, end the election, and reject a fresh post-election proof.

Actual execution cannot start here because backend ethers, Semaphore npm runtime, Foundry artifacts and Anvil are unavailable.

## N.16 Biometric hardware

**Result:** **NOT HARDWARE-TESTED.**

No biometric algorithm or ESP32 protocol was redesigned. The biometric-to-proof service boundary is unit-tested with controlled fixtures, including explicit failed-authentication denial.

---

# O. Gas / ZKP Benchmark Report

No raw performance value is fabricated.

| Required measurement | Result in this runtime |
|---|---|
| `ZKLocalVoting` deployment gas | **NOT MEASURED — Forge unavailable** |
| Contract runtime/initcode size | **NOT MEASURED — Forge unavailable** |
| Candidate registration gas | **NOT MEASURED — Forge unavailable** |
| Voter commitment/group registration gas | **NOT MEASURED — Forge unavailable** |
| `startElection` gas | **NOT MEASURED — Forge unavailable** |
| ZK `castVote` verification gas | **NOT MEASURED — Forge/Semaphore runtime unavailable** |
| `endElection` gas | **NOT MEASURED — Forge unavailable** |
| Proof generation time | **NOT MEASURED — Semaphore runtime unavailable** |
| Proof verification time | **NOT MEASURED — Semaphore runtime unavailable** |
| Proof/public-signal serialized size | **NOT MEASURED — Semaphore runtime unavailable** |

The commands/scripts that generate those measurements are included. Successful PoC/E2E runs write raw JSON to `research/zkp/logs/`; Foundry gas/size commands are documented under `research/zkp/README.md`.

The logs directory intentionally contains no fake result JSON.

---

# P. Backward Compatibility / Migration

## Historical contract baseline

The non-ZKP `LocalVoting.sol` and its tests/deployment/gas evidence remain untouched so the project retains the required three-version comparison:

```text
A. Published VoteChain
B. Cleaned non-ZKP VoteChain
C. VoteChain-ZK
```

## Candidate database

The frozen VC-W02 `candidateId` model/migration remains unchanged. Candidate NID/metadata stays off-chain.

## Existing voters

Legacy `voterHash`/`encryptedSalt` records are not silently transformed into Semaphore identities.

Recommended controlled migration:

```bash
cd votechain-central-server
MIGRATION_ALLOW_RUN=true MONGO_URI='<explicit intended database>' \
  node scripts/markLegacyVotersForZkMigration.js
```

This only marks legacy records. Each voter must then undergo fresh ZK enrollment, which generates a new random Semaphore identity.

## Configuration migration

Backend requires:

```text
CONTRACT_ADDRESS=<ZKLocalVoting address>
RPC_URL=<network RPC>
ZK_CREDENTIAL_SECRET_KEY=<dedicated exact 32-byte secret>
ZK_CONTRACT_DEPLOYMENT_BLOCK=<optional deployment block>
FINGERPRINT_SERIAL_PORT=<existing device port, default COM3>
```

Optional local/offline official Semaphore artifact paths:

```text
ZK_SNARK_WASM
ZK_SNARK_ZKEY
```

must be configured together.

Frontend requires:

```text
VITE_CONTRACT_ADDRESS=<ZKLocalVoting address>
VITE_RPC_URL=<network RPC>
VITE_API_BASE_URL=<backend>
```

`.env.example` contains placeholders only.

## Deployment order

Documented in `research/zkp/DEPLOYMENT.md`:

```text
install pinned Semaphore deps
 -> forge build
 -> start Anvil
 -> deploy SemaphoreVerifier
 -> deploy Semaphore
 -> deploy ZKLocalVoting (creates group)
 -> sync ABI from Foundry artifact
 -> configure backend/frontend
 -> register candidates/commitments
 -> start election
```

---

# Q. Out-of-Scope Findings

Intentionally not implemented:

- custom Circom voting circuit;
- another ZKP protocol or Semaphore major version;
- wallet allowlists / relayer allowlists;
- personal citizen wallets;
- wallet-to-voter identity;
- encrypted ballot / MACI / mixnet / commit-reveal;
- receipt-freeness or coercion resistance;
- new face/fingerprint algorithms;
- SourceAFIS/InsightFace redesign;
- ESP32 protocol redesign;
- multi-election product/database architecture beyond the cryptographic `electionId` scope;
- full new HTTP authentication/authorization architecture;
- large UI redesign;
- paper rewrite.

Environment-level inability to execute Forge/Semaphore/frontend dependency gates was also not hidden behind source substitutions or mocked “success” claims.

---

# R. Assumptions

1. The revised VC-W02 package/report is the frozen application baseline.
2. The four historical hashes in Section A identify the files that must remain unchanged.
3. `candidateId` values remain positive safe application integers and therefore practical Semaphore public messages.
4. `electionId` is nonzero and unique for the intended election scope.
5. The official Semaphore V4.14.3 contracts/runtime remain the protocol authority; VoteChain does not reimplement proof verification or nullifier logic.
6. The VoteChain ZK contract being the Semaphore group administrator is consistent with the frozen requirement that only the Election Commission path can register commitments and that the eligible group freezes after activation.
7. Public identity commitments/group roots are acceptable; the privacy target is member unlinkability in proof submission, not concealment of the eligible commitment set.
8. The backend is trusted to hold/decrypt encrypted ZK credentials after successful biometric authentication; authority-blind anonymity is not claimed.
9. Existing biometric matching outputs can still identify a voter by NID internally; the NID must not be returned to the voter-facing ZK API or chain.
10. A legacy voter must receive a fresh random Semaphore identity rather than a deterministic conversion from old voterHash/salt/civil data.
11. `ZK_CONTRACT_DEPLOYMENT_BLOCK` is a query optimization only; current chain events plus root/size are the membership authority.
12. The packaged ZK ABI copies are provisional interface copies until `forge build` + `npm run sync:zk-abi` succeeds in a Foundry-capable environment.
13. A successful source implementation is not equivalent to cryptographic acceptance; the blocked PoC/Foundry/E2E/frontend gates must still be executed before VC-W03 is frozen as fully accepted.

---

# S. Questions for VoteChain Architect

None.

---

# T. Deliverable

Complete source package:

```text
VoteChain_VC-W03_FinalZK.zip
```

Final report:

```text
VC-W03_Final_Report.md
```

The ZIP contains:

```text
frozen cleaned baseline
ZKLocalVoting.sol
Semaphore exact-version configuration
ZK deployment tooling
Foundry ZK test source
backend random identity / credential encryption / group / proof services
MongoDB ZK fields and guarded legacy migration helper
biometric-gated ZK proof flow
frontend ZK registration/voting flow
bootstrap matching ZK ABI copies + real artifact sync script
standalone PoC
local synthetic E2E runner
benchmark output locations
raw verification attempts
.env.example changes
reproducibility/preflight/deployment docs
this final report
```

It excludes installed `node_modules`, Foundry `out/cache`, frontend build output and secret `.env` files.

## Final VC-W03 freeze status

**Do not freeze VC-W03 yet as “all acceptance criteria passed.”**

The source implementation is ready for the remaining real-toolchain verification pass. The next execution in a network-enabled machine with Forge/Anvil and npm dependencies must run, in order:

```bash
npm run setup:zk
npm run zk:poc
forge fmt --check
forge build
forge test -vv
forge test --gas-report
forge build --sizes
npm run sync:zk-abi
cd votechain-central-server && npm ci && npm test -- --runInBand
cd ../votechain-frontend-ts && npm ci && npm run build && npm run lint
cd ..
# start Anvil
npm run zk:e2e
```

Only after those commands produce successful real Semaphore/Foundry/frontend/E2E evidence should the master architect mark all VC-W03 acceptance boxes complete.
