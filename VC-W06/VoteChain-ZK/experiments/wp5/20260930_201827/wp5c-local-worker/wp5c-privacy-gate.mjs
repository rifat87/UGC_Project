import fs from "node:fs"

const [
  modalPath,
  apiPath,
  hookPath,
  votePath,
  voteRoutesPath,
  biometricRoutesPath,
  workerPath,
] = process.argv.slice(2)

const modal =
  fs.readFileSync(
    modalPath,
    "utf8",
  )

if (
  /candidateId|pendingCandidate|selectedCandidate/.test(
    modal,
  )
) {
  throw new Error(
    "Candidate plaintext reached VerificationModal",
  )
}

const api =
  fs.readFileSync(
    apiPath,
    "utf8",
  )

const authStart =
  api.indexOf(
    "export async function authorizeWp5",
  )

if (authStart < 0) {
  throw new Error(
    "authorizeWp5 missing",
  )
}

const authBlock =
  api.slice(authStart)

if (
  /candidateId|selectedCandidate|candidateIndex/.test(
    authBlock,
  )
) {
  throw new Error(
    "Candidate plaintext appears in WP5 authorization API",
  )
}

const hook =
  fs.readFileSync(
    hookPath,
    "utf8",
  )

const castStart =
  hook.indexOf(
    "const castEncryptedVote",
  )

const castEnd =
  hook.indexOf(
    "const startElection",
    castStart,
  )

if (
  castStart < 0 ||
  castEnd < 0
) {
  throw new Error(
    "castEncryptedVote block missing",
  )
}

const castBlock =
  hook.slice(
    castStart,
    castEnd,
  )

if (
  /candidateId|candidateIndex|selectedCandidate/.test(
    castBlock,
  )
) {
  throw new Error(
    "Candidate plaintext appears in blockchain submission path",
  )
}

const vote =
  fs.readFileSync(
    votePath,
    "utf8",
  )

if (
  /<VerificationModal[\s\S]*candidateId=/.test(
    vote,
  )
) {
  throw new Error(
    "VoteCasting passes candidate into biometric modal",
  )
}

if (
  !vote.includes(
    "prepareWp5EncryptedBallot",
  )
) {
  throw new Error(
    "Local privacy worker is not connected",
  )
}

const routes =
  fs.readFileSync(
    voteRoutesPath,
    "utf8",
  )

if (
  routes.includes(
    "verifyFace",
  )
) {
  throw new Error(
    "Legacy candidate-aware face controller remains active",
  )
}

const biometricRoutes =
  fs.readFileSync(
    biometricRoutesPath,
    "utf8",
  )

if (
  biometricRoutes.includes(
    "fingerprintController.detectFingerprint);",
  )
) {
  throw new Error(
    "Legacy candidate-aware fingerprint controller remains active",
  )
}

const worker =
  fs.readFileSync(
    workerPath,
    "utf8",
  )

if (
  !worker.includes(
    "PREPARE_BALLOT",
  ) ||
  !worker.includes(
    "candidateIndex",
  ) ||
  !worker.includes(
    "groth16.fullProve",
  ) ||
  !worker.includes(
    "randomScalar",
  )
) {
  throw new Error(
    "Expected local privacy-worker functionality is incomplete",
  )
}

console.log(
  "BIOMETRIC_MODAL_CANDIDATE_BLIND=PASS",
)

console.log(
  "WP5_AUTH_REQUEST_CANDIDATE_BLIND=PASS",
)

console.log(
  "CONTRACT_SUBMISSION_CANDIDATE_BLIND=PASS",
)

console.log(
  "LOCAL_CANDIDATE_SELECTION_IN_WORKER=PASS",
)

console.log(
  "LOCAL_BABYJUB_RANDOMNESS=PASS",
)

console.log(
  "LOCAL_DIRECT_GROTH16_PATH=PASS",
)

console.log(
  "LOCAL_PRIVACY_WORKER_CONNECTED=PASS",
)

console.log(
  "LEGACY_CANDIDATE_AWARE_VOTE_ROUTES_DISABLED=PASS",
)
