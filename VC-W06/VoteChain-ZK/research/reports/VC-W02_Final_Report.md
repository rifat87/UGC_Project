# VoteChain VC-W02 Final Report — Revised After Master Review

## Phase 1B — Application Contract Integration & `candidateId` Migration

**Task ID:** VC-W02  
**Revision:** Master-review correction pass, 18 August 2026  
**Original VC-W02 package revised:** `VoteChain_VC-W02_AppIntegration.zip` SHA-256 `e1f87635b0f0d54483378767f972c13d9888a484ae3eb3f4092d878ed8793b8a`  
**Original accepted VC-W01 baseline:** `VoteChain_VC-W01_CleanContract.zip` SHA-256 `80e4ae6a427cc7c9c0ead98a9c8ab0aa98f86055f0838010db17572b1a91fccf`  
**Implementation status:** Source corrections complete  
**Verification status:** Backend and static revision tests pass; user-supplied Foundry regression evidence passes; real Foundry-artifact ABI sync, frontend dependency-based build/lint, and local MongoDB/Anvil smoke remain environment-blocked and are explicitly reported as **NOT TESTED**.

This revision addresses exactly the two source defects found by master review: unsafe legacy `candidateId` unique-index rollout and unauthenticated raw Candidate/Voter document reads. It does not redesign the architecture, modify the accepted VC-W01 contract, change wallet semantics, remove the temporary Phase-1 `voterHash` mechanism, redesign biometrics, or introduce ZKP.

---

# A. Input Baseline Confirmed

The revision started from the previously returned VC-W02 application-integration package rather than restarting from the original project. That VC-W02 package itself was built from the accepted/frozen VC-W01 clean-contract baseline.

The frozen VC-W01 files were hashed after this correction pass and remain unchanged:

| Frozen file | SHA-256 after revision |
|---|---|
| `src/LocalVoting.sol` | `b5718b72b0ef3762c84c611234bc376d49b76bd09c139a9886fd91e1dd19133a` |
| `test/LocalVotingTest.t.sol` | `a74ebea5402b6fcdc07a5a0a79fe8c3a7add6199cf17c472cc36d1c24c97ee90` |
| `script/LocalDeployVoting.s.sol` | `e28c54d0ce1627f4ea317298db6717af8f6f73a338be98c917a7f66b42f423db` |
| `research/gas/VC-W01-clean-baseline-gas.txt` | `293d244052efb22060f6133a8821a6356de89eea2a1e5c89198b0a44beb72bdc` |

Therefore, **`LocalVoting.sol` remained unchanged** in the original VC-W02 implementation and in this master-review revision.

The application still consumes the accepted VC-W01 interface:

```text
registerCandidate(uint256 candidateId)
registerVoter(bytes32 voterHash)
startElection()
castVote(uint256 candidateId, bytes32 voterHash)
endElection()
getVoteCount(uint256 candidateId)
getElectionState()
```

The wallet model also remains frozen:

```text
connected address == electionCommission -> admin role
connected non-admin address              -> vote-submission role
human voter uniqueness                   -> voterHash, not msg.sender
```

No wallet allowlist, relayer authorization list, wallet-to-voter mapping, `hasVoted[msg.sender]`, or personal-citizen-wallet requirement was introduced.

---

# B. Current Application Problems Confirmed

The first VC-W02 pass correctly migrated the main application to `candidateId`, the VC-W01 lifecycle, generated ABI consumption, MongoDB candidate enumeration, and blockchain-authoritative tally/state. Master review then identified two remaining source-level defects.

## B.1 Unsafe legacy candidateId index rollout

The Candidate schema declared `candidateId` as a normal single-field unique index before legacy candidate documents missing `candidateId` were migrated. In MongoDB, this is unsafe when multiple legacy documents lack or contain null for the indexed field, because a normal unique single-field index can fail to build or conflict with legacy missing/null records.

The prior migration script also did not explicitly repair a pre-existing unsafe `candidateId` index before assigning IDs.

## B.2 Raw Candidate/Voter document exposure

The backend still contained unauthenticated raw document reads:

```text
GET /api/candidates
GET /api/candidates/:id
GET /api/voters
GET /api/voters/voter?id=...
```

Those routes returned Mongoose Candidate/Voter documents directly and therefore could disclose data that must not be part of a public/read API, including candidate NID and voter identity material such as NID, `voterHash`, `encryptedSalt`, and DOB.

Directly touched biometric/training paths also contained logging/echo behavior capable of exposing raw NID or raw tool/device output.

These defects were application-layer issues only. They did not require a contract, wallet, biometric architecture, or ZKP redesign.

---

# C. Change Summary

This revision makes the following focused corrections.

## C.1 Safe candidateId index and migration rollout

The Candidate schema now keeps `candidateId`:

- backend-generated;
- positive;
- integer/safe-integer validated;
- immutable;
- unique for valid allocated values;
- independent from NID.

The schema no longer declares a normal field-level `unique: true, index: true`. Instead it declares a partial unique index:

```javascript
candidateSchema.index(
  { candidateId: 1 },
  {
    name: 'candidateId_unique_valid',
    unique: true,
    partialFilterExpression: {
      candidateId: { $type: 'number', $gte: 1 }
    }
  },
)
```

This allows multiple legacy documents with missing/null `candidateId` to coexist before migration while still enforcing uniqueness for valid allocated numeric IDs.

A migration service now:

1. inspects existing non-null `candidateId` values;
2. refuses to proceed if an existing ID is invalid or duplicated;
3. identifies candidateId-only indexes;
4. preserves an already-safe partial unique index when present;
5. otherwise drops only candidateId-only legacy indexes and creates the safe partial unique index;
6. floors the atomic counter to the highest existing candidate ID;
7. allocates new IDs atomically for only records where `candidateId` is missing/null;
8. updates with a conditional filter so an ID assigned concurrently is not overwritten;
9. leaves migrated records `pending`, not falsely `registered`;
10. logs only Mongo record ID and allocated candidateId, never candidate NID.

## C.2 Public/raw data exposure closed

Unused raw read routes for Candidate and Voter documents were removed.

Candidate create/update responses now use a privacy-safe projection and do not echo candidate NID.

Voter update responses use a privacy-safe projection and do not expose voter NID, DOB, `voterHash`, or `encryptedSalt`.

Directly touched face/fingerprint/training paths were tightened so they no longer echo or log raw NID/device/Python output unnecessarily.

### Frozen Phase-1 voterHash exception

VC-W02 is explicitly required to retain the temporary non-ZKP `voterHash` transaction mechanism. Therefore `voterHash` still appears only in the two active internal workflow responses that require it:

```text
admin voter creation -> frontend receives voterHash -> admin wallet registerVoter(voterHash)
biometric verification -> frontend receives voterHash -> castVote(candidateId, voterHash)
```

This revision does **not** expose `voterHash` through raw/public document-read routes or public dashboards. Removing it from the registration/biometric workflow would violate the frozen Phase-1 voterHash mechanism and is therefore intentionally not done in VC-W02.

---

# D. File-by-File Change List

The following files changed specifically in this master-review revision.

| File | Revision change |
|---|---|
| `votechain-central-server/models/Candidate.js` | Replaced unsafe normal candidateId unique index with named partial unique index covering valid positive numeric IDs; retained immutable/positive/safe-integer field validation. |
| `votechain-central-server/services/candidateMigration.js` | **New.** Central safe migration/index-rollout logic; validates existing IDs, repairs candidateId-only indexes, floors counter, conditionally migrates missing/null IDs. |
| `votechain-central-server/scripts/migrateCandidateIds.js` | Reworked to use the safe migration service and existing atomic Counter model; still protected by `MIGRATION_ALLOW_RUN=true`. |
| `votechain-central-server/__tests__/migrationSafety.test.js` | Replaced source-only assertions with behavioral tests covering multiple legacy records, existing allocated IDs, stale counter flooring, safe index replacement, pending status, non-sensitive logs, and duplicate-ID stop condition. |
| `votechain-central-server/__tests__/candidateService.test.js` | Updated schema assertion to require immutable candidateId plus the partial unique valid-ID index. |
| `votechain-central-server/services/privacyProjection.js` | **New.** Privacy-safe Candidate and Voter response projections. |
| `votechain-central-server/__tests__/privacyProjection.test.js` | **New.** Tests that projections omit NID/hash/salt/DOB and that unused raw Candidate/Voter GET routes are absent. |
| `votechain-central-server/routes/candidateRoutes.js` | Removed raw candidate GET routes; candidate creation/update responses now use safe projection; candidate NID is not echoed; directly touched face-training output is sanitized. |
| `votechain-central-server/routes/voterRoutes.js` | Removed raw voter GET routes. |
| `votechain-central-server/controllers/voterController.js` | Removed raw voter read handlers; creation/update returns safe voter projection; raw NID/tool-output logging removed. Frozen voterHash registration return remains. |
| `votechain-central-server/controllers/fingerprintController.js` | Stops logging raw command/device payloads; fingerprint enrollment no longer echoes NID; detection still returns only the temporary voterHash required for voting. |
| `votechain-central-server/controllers/voteController.js` | Stops returning raw face-recognition stdout/stderr details that can contain matched identity information; successful verification still returns only voterHash. |
| `votechain-central-server/routes/biometricRoutes.js` | Stops returning/logging raw Python capture output. |
| `votechain-frontend-ts/src/components/Biometric/fingerprint/FingerprintCapture.tsx` | Uses the already-known submitted NID internally after successful enrollment rather than depending on backend NID echo; removes response debug logging. |
| `votechain-frontend-ts/src/services/api.ts` | Candidate creation response type no longer contains candidate NID. |
| `research/reports/VC-W02-revision-verification-log.txt` | **New.** Revision-specific verification evidence and explicit NOT TESTED gates. |
| `research/reports/VC-W02_Final_Report.md` | Revised final report. |

No VC-W01 Solidity, Solidity tests, deployment script, or VC-W01 gas evidence file changed.

---

# E. candidateId Architecture

## E.1 Allocation

Candidate IDs remain allocated by the backend using an atomic MongoDB counter:

```text
Counter _id = "candidateId"
$inc seq by 1 using findOneAndUpdate(..., { upsert: true, new: true })
```

The browser cannot choose or override the authoritative candidate ID. `sanitizeCandidateMetadata()` discards client `candidateId` input and the server allocates it.

IDs remain:

```text
positive
sequential in the current single-election prototype
unique
backend-generated
MongoDB-stored
immutable
independent of NID
safe for Solidity uint256 conversion
```

## E.2 MongoDB storage and index safety

The model stores `candidateId` with validation and immutability, but uniqueness is enforced by the partial index:

```text
candidateId >= 1 and BSON type number -> included in unique index
candidateId missing/null             -> excluded from unique index during legacy rollout
```

This prevents multiple legacy records with no ID from colliding before migration.

## E.3 Registration sequence

```text
Admin submits candidate metadata
        |
        v
Backend validates metadata and duplicate NID
        |
        v
Atomic counter allocates candidateId
        |
        v
MongoDB stores metadata + candidateId + pending
        |
        v
Frontend receives candidateId
        |
        v
Connected electionCommission wallet calls registerCandidate(candidateId)
        |
        +---- chain failure -> status failed/pending, never public-valid by DB alone
        |
        v
chain success -> status registered
```

Blockchain existence remains the final election-integrity authority.

## E.4 Legacy migration

The one-time migration is guarded by:

```text
MIGRATION_ALLOW_RUN=true
MONGO_URI=<explicit intended database>
```

The script does not run automatically against production.

Before assigning IDs, it validates every existing non-null candidateId. If an invalid or duplicate existing ID is discovered, migration stops before changing candidateId indexes.

It then repairs the candidateId-only index to the safe partial unique definition, advances the counter to at least the highest existing ID, and allocates IDs for only missing/null records.

Example now covered by test:

```text
existing candidate IDs: 2 and 5
legacy records: one missing candidateId, one candidateId=null
counter before migration: 3

counter is first raised to 5
legacy IDs become 6 and 7
existing IDs 2 and 5 are preserved
migrated status -> pending
```

The update filter rechecks that candidateId is still missing/null, so the migration does not silently overwrite an ID that was assigned concurrently.

The migration was **NOT RUN AGAINST PRODUCTION DATABASE**.

---

# F. Contract Interface Integration

The application remains integrated with VC-W01 as follows:

| Legacy application behavior | VC-W02 behavior |
|---|---|
| `registerCandidate(name, candidateNID, location, age, party)` | `registerCandidate(candidateId)` |
| `registerVoter(name, voterHash, location, birthDate)` | `registerVoter(voterHash)` |
| `castVote(candidateNID, voterHash)` | `castVote(candidateId, voterHash)` |
| `getCandidates()` | MongoDB enumeration + `candidates(candidateId)` chain existence/tally |
| `getCandidate()` | Candidate metadata from backend; chain state by candidateId |
| `getVoter()` | Removed from contract/app read dependency |
| `electionEnded()` | `getElectionState()` / `state` mapping |

Candidate NID is never passed to Solidity.

Voter civil PII is never passed to Solidity.

The backend remains read-only for blockchain queries and contains no Election Commission private key.

---

# G. Election Lifecycle Integration

The application still uses one lifecycle mapping:

```text
0 -> Registration
1 -> Active
2 -> Ended
```

## Registration

Admin UI allows:

```text
Register Candidate
Register Voter
Start Election
```

Voting is unavailable.

## Active

Admin UI allows:

```text
End Election
View candidates/results
```

Registration controls are disabled/hidden. Voter vote-casting is available.

## Ended

Only result viewing remains available. Candidate registration, voter registration, start, end, and vote actions are unavailable.

The contract remains the final enforcement authority; frontend restrictions are usability/defense-in-depth only.

---

# H. ABI / Configuration Report

The reproducible ABI synchronization script remains:

```text
forge build
node scripts/sync-local-voting-abi.mjs
```

It reads:

```text
out/LocalVoting.sol/LocalVoting.json
```

and writes the ABI array to:

```text
votechain-frontend-ts/src/abi/LocalVoting.json
votechain-central-server/abi/LocalVoting.json
```

The two packaged generated ABI files are byte-identical and have SHA-256:

```text
8b43cbe4ce81cd89b5f565225af4d755ab55955dc4c190a4ac8753735d0184af
```

Backend ABI tests confirm the VC-W01 function signatures and absence of the removed legacy APIs.

### Real-artifact synchronization status

The worker runtime does not contain Forge and the packaged source intentionally does not include `out/`. Running:

```text
node scripts/sync-local-voting-abi.mjs
```

therefore produced `ENOENT` for:

```text
out/LocalVoting.sol/LocalVoting.json
```

Accordingly, **real Foundry-output ABI synchronization is NOT TESTED in this worker runtime**. No success is fabricated. The user supplied successful `forge build` evidence from their MINGW64 environment, but did not supply the subsequent ABI-sync command output.

Configuration remains centralized through:

Frontend:

```text
VITE_API_BASE_URL
VITE_CONTRACT_ADDRESS
VITE_RPC_URL
```

Backend:

```text
CONTRACT_ADDRESS
RPC_URL
MONGO_URI
```

`.env.example` files contain placeholders only.

---

# I. Public Data / Privacy Report

## I.1 Public election endpoint

The public election endpoint returns only:

```text
electionState
candidateCount
candidateId
candidate name
party
location
blockchain-authoritative voteCount
```

It does not return candidate NID, voter NID, `voterHash`, `encryptedSalt`, DOB, biometric data, or salts.

## I.2 Raw Candidate/Voter read routes

The following raw unauthenticated reads were removed:

```text
GET /api/candidates
GET /api/candidates/:id
GET /api/voters
GET /api/voters/voter
```

Therefore there is no longer an unauthenticated generic route that enumerates or returns raw Candidate/Voter MongoDB documents.

## I.3 Candidate workflow responses

Candidate creation and update responses now use `toCandidateWorkflowResponse()` and omit candidate NID.

The stored candidate NID remains in MongoDB/admin input because the off-chain storage model is frozen.

## I.4 Voter workflow responses

Raw Voter documents are not returned from the removed read routes or update route.

The safe voter projection contains only:

```text
id
name
location
```

The temporary `voterHash` remains intentionally returned only by the two frozen Phase-1 flows that require it to submit on-chain transactions:

- admin voter registration;
- successful biometric vote verification.

It is not rendered as ordinary voter/public UI text and is not available from generic public document-read routes.

## I.5 Logging cleanup

Directly touched biometric/training code no longer logs:

- the submitted raw NID;
- full serial JSON enrollment payload containing NID;
- raw serial response containing NID;
- raw Python stdout/stderr containing matched identity/path information.

---

# J. Testing Report

## J.1 Foundry regression — user-supplied external environment

The user ran the required Foundry commands in their MINGW64 environment. Because this revision did not modify any frozen Solidity/test/deployment/gas file, the evidence remains applicable to the exact frozen VC-W01 contract files whose hashes are reproduced in Section A.

### Command

```text
forge fmt --check
```

**Result:** PASS — user-run external evidence.

**Relevant output:** no formatting errors/output.

### Command

```text
forge build
```

**Result:** PASS — user-run external evidence.

**Relevant output:**

```text
Compiling 22 files with Solc 0.8.17
Solc 0.8.17 finished in 1.48s
Compiler run successful with warnings
```

Warnings were the same non-fatal VC-W01 warnings/notes: unused deployment-script local variable, two test mutability notes, plain-import lint notes, and modifier-wrapping notes.

### Command

```text
forge test -vv
```

**Result:** PASS — user-run external evidence.

**Relevant output:**

```text
Ran 33 tests for test/LocalVotingTest.t.sol:LocalVotingTest
Suite result: ok. 33 passed; 0 failed; 0 skipped
33 tests passed, 0 failed, 0 skipped
```

The critical frozen wallet test passed:

```text
test_OneNonAdminWalletCanSubmitVotesForMultipleVoterHashes()
```

## J.2 Backend dependency installation

### Command

```text
npm ci
```

from `votechain-central-server`.

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

**Relevant output:** package installation timed out in the worker environment. A partial dependency directory was not packaged.

## J.3 Backend tests

### Command

```text
npm test -- --runInBand
```

from `votechain-central-server`.

**Result:** PASS.

**Relevant output:**

```text
1..12
# tests 12
# pass 12
# fail 0
# skipped 0
```

The 12 tests cover:

1. accepted VC-W01 ABI signatures;
2. removed legacy ABI absence;
3. positive/unique/sequential candidate allocation;
4. client candidateId override resistance;
5. duplicate candidate NID protection;
6. immutable candidateId + safe partial unique index declaration;
7. public election composition using Mongo metadata + chain existence/tally/state;
8. multiple legacy candidates missing/null candidateId with existing allocated IDs and stale counter;
9. stop-before-index-change on duplicate existing candidateId;
10. candidate privacy projection;
11. voter privacy projection;
12. removal of raw Candidate/Voter GET routes.

## J.4 Backend JavaScript syntax

### Command

```text
node --check <all non-node_modules backend .js/.mjs files>
```

**Result:** PASS.

**Relevant output:**

```text
JS_SYNTAX_OK
```

## J.5 ABI copy verification

### Command

```text
sha256sum votechain-central-server/abi/LocalVoting.json \
          votechain-frontend-ts/src/abi/LocalVoting.json
cmp <frontend ABI> <backend ABI>
```

**Result:** PASS.

**Relevant output:** both copies are byte-identical and SHA-256 is:

```text
8b43cbe4ce81cd89b5f565225af4d755ab55955dc4c190a4ac8753735d0184af
```

## J.6 Real Foundry-output ABI synchronization

### Command

```text
node scripts/sync-local-voting-abi.mjs
```

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

**Relevant output:** `ENOENT` because `out/LocalVoting.sol/LocalVoting.json` does not exist in the worker runtime and Forge is not installed there.

## J.7 Frontend dependency installation

### Command

```text
npm ci
```

from `votechain-frontend-ts`.

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

**Relevant output:** repeated dependency installation attempts timed out.

## J.8 Frontend build

### Command

```text
npm run build
```

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

The command could not produce a meaningful application build result because the preceding `npm ci` did not complete. The partial dependency tree caused TypeScript to report missing declaration packages such as React/Node/Babel-related type definitions. This is not claimed as an application-source failure or a successful build.

## J.9 Frontend lint

### Command

```text
npm run lint
```

**Result:** NOT TESTED / ENVIRONMENT BLOCKED.

**Relevant output:**

```text
eslint: not found
```

because dependency installation did not complete.

## J.10 Local MongoDB/Anvil end-to-end smoke flow

**Result:** NOT TESTED.

The worker runtime has no `mongod`, `anvil`, or `forge` executable and no safe local MongoDB instance was available. Therefore candidate creation -> chain registration -> voter creation -> chain registration -> start -> vote -> end was not claimed.

The candidate migration was **NOT RUN AGAINST PRODUCTION DATABASE**.

Biometric hardware was **NOT HARDWARE-TESTED**.

---

# K. Security Impact

## K.1 candidateId boundary

Candidate civil NID remains off-chain. Only the backend-generated `candidateId` links MongoDB metadata to on-chain candidate state.

The partial unique index fixes the legacy rollout without weakening candidateId uniqueness for valid IDs.

## K.2 Migration safety

The migration now fails closed for invalid/duplicate existing IDs and does not silently overwrite existing candidateId values.

The counter is advanced above the maximum existing ID before assigning legacy records, preventing reuse of previously allocated IDs.

## K.3 Blockchain authority

MongoDB remains metadata storage only. Candidate existence and vote count are still determined by VC-W01 chain state. The off-chain `registrationStatus` is not an election-integrity authority.

## K.4 Public metadata exposure

Raw Candidate/Voter enumeration was removed. Public candidate results are privacy-projected. Candidate NID and voter civil/secret fields are not returned by generic public reads.

## K.5 Wallet semantics

No backend signer/private admin key was introduced. Privileged transactions still require the connected Election Commission wallet. The vote wallet remains transaction infrastructure, not voter identity.

## K.6 Temporary voterHash

`voterHash` is still public/pseudonymous on-chain in this cleaned non-ZKP baseline and remains reconstructible by the authority from protected off-chain data. It is not described as anonymous.

The revision reduces unnecessary API/log exposure but does not change the frozen Phase-1 voterHash mechanism.

## K.7 Partial registration failure

Database-only candidates remain `pending`/`failed` and are not treated as blockchain-valid candidates. The public election endpoint includes only candidates whose on-chain `exists` flag is true.

---

# L. Backward Compatibility / Data Migration

Existing Candidate documents that already contain valid candidateId values remain untouched.

Legacy documents with missing/null candidateId require the one-time migration.

Recommended rollout order for an existing database is:

```text
1. Back up / target the intended safe database.
2. Deploy the revised code containing the partial candidateId index definition.
3. Set MIGRATION_ALLOW_RUN=true only for the intended migration execution.
4. Run scripts/migrateCandidateIds.js before normal application use if an unsafe old candidateId index may exist.
5. Verify migration output and candidate IDs.
6. Return MIGRATION_ALLOW_RUN=false.
7. Start normal application services.
```

If a pre-existing candidateId-only unsafe index is present, the migration service removes only that candidateId-only index and creates the partial unique valid-ID index after first verifying that existing candidate IDs are valid and non-duplicated.

No candidate ID is inferred from NID.

No migrated record is automatically marked `registered` on chain.

No multi-election database architecture is introduced.

---

# M. Out-of-Scope Findings

The following remain intentionally unchanged:

- Semaphore;
- Circom/Groth16;
- Merkle groups;
- ZK identity commitments;
- nullifiers;
- proof generation/verification;
- electionId ZK scope;
- encrypted ballots/MACI/mixnets;
- receipt-freeness/coercion resistance;
- `voterHash`/`encryptedSalt` removal;
- face-recognition architecture;
- fingerprint matching architecture;
- SourceAFIS/InsightFace design;
- ESP32 serial protocol architecture;
- wallet allowlists/relayer restrictions;
- personal voter wallets;
- VC-W01 Solidity warning cleanup;
- full authentication/authorization architecture for administrative HTTP endpoints;
- large UI redesign.

The revision intentionally fixes data minimization at the existing API boundary without inventing a new authentication system.

---

# N. Assumptions

1. The accepted VC-W01 hashes listed in Section A identify the frozen contract baseline that must not be changed.
2. Master-review revision instructions take precedence over cosmetic/refactoring opportunities.
3. A partial unique index on valid positive numeric `candidateId` values is the intended safe rollout mechanism for multiple missing/null legacy records.
4. Existing non-null candidateId values must already satisfy the frozen positive safe-integer rule; the migration stops rather than rewriting invalid IDs.
5. Existing duplicate non-null candidateId values represent an unsafe database state requiring manual architect review; the migration stops before index changes.
6. Candidate creation and migration may run in a controlled deployment window; the conditional update and unique index still protect against accidental overwrite/duplication.
7. Candidate NID remains necessary in protected off-chain administrative storage but is not needed in candidate API responses after creation.
8. The temporary `voterHash` must remain in the active Phase-1 registration/voting workflow because VC-W02 explicitly freezes that mechanism.
9. Therefore the requirement to close raw public-data exposure is interpreted as removing generic/raw document reads and unnecessary echoes/logging, not removing the explicitly required transaction-workflow `voterHash` return.
10. The user-supplied Foundry output is valid evidence for the frozen Solidity files; this revision did not alter those files.
11. The worker runtime's failed/incomplete npm dependency installation is an environment limitation and is not converted into a false PASS or false application failure claim.
12. Production/Atlas migration must not be run without an explicitly selected safe database.

---

# O. Questions for VoteChain Architect

None.

---

# P. Deliverable

Updated package:

```text
VoteChain_VC-W02_AppIntegration.zip
```

Revised report:

```text
VC-W02_Final_Report_Revised.md
```

The ZIP contains the full project required for the next worker, including the frozen VC-W01 research evidence, generated ABI files, safe candidateId migration tooling, backend tests, and this revised report. It excludes `node_modules`, transient TypeScript build artifacts, Foundry caches/out artifacts, and local secret `.env` files.

The revision specifically closes the two master-review source findings without changing the frozen architecture.
