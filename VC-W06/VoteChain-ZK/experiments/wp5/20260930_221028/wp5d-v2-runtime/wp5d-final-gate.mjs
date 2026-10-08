import fs from "node:fs"

const [
  ,
  ,
  browserResultPath,
  onchainResultPath,
] = process.argv

const browser =
  JSON.parse(
    fs.readFileSync(
      browserResultPath,
      "utf8",
    ),
  )

const chain =
  JSON.parse(
    fs.readFileSync(
      onchainResultPath,
      "utf8",
    ),
  )

if (
  browser.status !==
    "PASS" ||
  chain.status !==
    "PASS"
) {
  throw new Error(
    "WP5D runtime result not PASS",
  )
}

if (
  browser
    .candidatePlaintextInBallotObject !==
  false
) {
  throw new Error(
    "Candidate plaintext field found in encrypted ballot object",
  )
}

if (
  chain
    .candidateNamedCastInputs !==
  0
) {
  throw new Error(
    "Candidate-named input found in DIRECT cast ABI",
  )
}

if (
  chain.acceptedAfter !==
  "1"
) {
  throw new Error(
    "Onchain ballot acceptance mismatch",
  )
}

if (
  chain.nullifierUsed !==
  true
) {
  throw new Error(
    "Nullifier state mismatch",
  )
}

if (
  chain
    .firstBallotTallyMatch !==
  true
) {
  throw new Error(
    "Encrypted tally mismatch",
  )
}

if (
  chain
    .duplicateNullifierRejected !==
  true
) {
  throw new Error(
    "Duplicate-nullifier negative case failed",
  )
}

console.log(
  "SYNTHETIC_SELECTED_CANDIDATE_LOCAL_ONLY=PASS",
)

console.log(
  "SUBMISSION_OBJECT_CANDIDATE_PLAINTEXT=NO",
)

console.log(
  "DIRECT_CALLDATA_CANDIDATE_ARGUMENT=NO",
)

console.log(
  "BROWSER_TO_CONTRACT_ENCRYPTED_PATH=PASS",
)
