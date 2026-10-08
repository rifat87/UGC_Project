import fs from "node:fs"
import {
  isDeepStrictEqual,
} from "node:util"

const [
  ,
  ,
  browserPath,
  serverRequestPath,
  backendLogPath,
  onchainPath,
] = process.argv

const browser =
  JSON.parse(
    fs.readFileSync(
      browserPath,
      "utf8",
    ),
  )

const serverRequest =
  JSON.parse(
    fs.readFileSync(
      serverRequestPath,
      "utf8",
    ),
  )

const backendLog =
  fs.readFileSync(
    backendLogPath,
    "utf8",
  )

const onchain =
  JSON.parse(
    fs.readFileSync(
      onchainPath,
      "utf8",
    ),
  )

const outgoing =
  browser.network
    .authRequestBody

const incoming =
  serverRequest.body

if (
  !isDeepStrictEqual(
    outgoing,
    incoming,
  )
) {
  throw new Error(
    "Client/server authorization payload mismatch",
  )
}

const requestKeys =
  Object.keys(
    incoming,
  ).sort()

if (
  requestKeys.length !== 1 ||
  requestKeys[0] !==
    "credentialPublicKey"
) {
  throw new Error(
    "Authorization request contains unexpected fields",
  )
}

function forbiddenKey(
  value,
) {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return false
  }

  return Object.entries(
    value,
  ).some(
    (
      [
        key,
        child,
      ],
    ) =>
      /candidateId|candidateIndex|selectedCandidate|voteChoice|candidateChoice/i.test(
        key,
      ) ||
      forbiddenKey(
        child,
      ),
  )
}

if (
  forbiddenKey(
    outgoing,
  ) ||
  forbiddenKey(
    incoming,
  )
) {
  throw new Error(
    "Selected-candidate field present in authorization payload",
  )
}

if (
  /candidateId|candidateIndex|selectedCandidate|voteChoice|candidateChoice/i.test(
    backendLog,
  )
) {
  throw new Error(
    "Selected-candidate field name appears in backend runtime log",
  )
}

for (
  const group of Object.values(
    browser.authorizationShape,
  )
) {
  if (
    group.some(
      key =>
        /candidate/i.test(
          key,
        ),
    )
  ) {
    throw new Error(
      "Authorization response shape contains candidate field",
    )
  }
}

if (
  onchain.status !==
    "PASS" ||
  onchain.acceptedAfter !==
    "1" ||
  onchain.nullifierUsed !==
    true ||
  onchain.firstBallotTallyMatch !==
    true ||
  onchain.duplicateNullifierRejected !==
    true ||
  onchain.candidateNamedCastInputs !==
    0
) {
  throw new Error(
    "Integrated on-chain gate mismatch",
  )
}

console.log(
  "CLIENT_SERVER_AUTH_PAYLOAD_MATCH=PASS",
)

console.log(
  "AUTH_REQUEST_KEYS=credentialPublicKey",
)

console.log(
  "SELECTED_CANDIDATE_IN_AUTH_REQUEST=NO",
)

console.log(
  "SELECTED_CANDIDATE_IN_AUTH_RESPONSE_SHAPE=NO",
)

console.log(
  "SELECTED_CANDIDATE_FIELD_IN_BACKEND_RUNTIME_LOG=NO",
)

console.log(
  "PUBLIC_CANDIDATE_METADATA_EXCLUDED_FROM_PRIVATE_CHOICE_LEAK_TEST=YES",
)

console.log(
  "BACKEND_TO_BROWSER_TO_CONTRACT=PASS",
)
