import {
  randomBytes,
} from "node:crypto"

import {
  access,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises"

import {
  join,
  resolve,
} from "node:path"

import {
  context,
} from "../../crypto/src/wp2-core-final.mjs"

import {
  WP6,
  buildDkgTranscript,
  canonicalSha256,
  createDkgContribution,
  createTrusteeTransportIdentity,
  deriveTrusteeShare,
  verifyDkgTranscript,
} from "../../crypto/src/wp6-threshold.mjs"


const API_BASE =
  (
    process.env
      .VOTECHAIN_API_BASE_URL ||
    "http://127.0.0.1:5000"
  )
    .replace(
      /\/$/,
      "",
    )


async function exists(
  path,
) {
  try {
    await access(path)

    return true
  } catch {
    return false
  }
}


async function writeJson(
  path,
  value,
) {
  await writeFile(
    path,
    JSON.stringify(
      value,
      null,
      2,
    ) + "\n",
    {
      encoding: "utf8",
    },
  )
}


async function currentElection() {
  const response =
    await fetch(
      `${API_BASE}/api/elections/current`,
    )

  if (!response.ok) {
    throw new Error(
      `Current-election API returned HTTP ${response.status}`,
    )
  }

  const payload =
    await response.json()

  return payload?.data ??
    null
}


const election =
  await currentElection()

if (!election) {
  console.log(
    "NO_CURRENT_ELECTION=YES",
  )

  console.log(
    "Create the election first; DKG was not generated.",
  )

  process.exit(2)
}


if (
  election.status !==
    "registration"
) {
  console.log(
    `CURRENT_ELECTION_STATUS=${election.status}`,
  )

  console.log(
    "DKG generation is only performed for a Registration-stage election.",
  )

  process.exit(2)
}


const electionId =
  String(
    election.electionId,
  )

const ceremonyId =
  electionId

const threshold =
  Number(
    WP6.threshold,
  )

const trusteeCount =
  Number(
    WP6.trusteeCount,
  )


if (
  threshold !== 3 ||
  trusteeCount !== 5
) {
  throw new Error(
    `Expected frozen local prototype 3-of-5, got ${threshold}-of-${trusteeCount}`,
  )
}


const root =
  resolve(
    import.meta.dirname,
    "..",
    "..",
    "crypto",
    ".local",
    "wp6-elections",
    electionId,
  )

const publicDir =
  join(
    root,
    "public",
  )

const custodyDir =
  join(
    root,
    "custody",
  )

const contributionDir =
  join(
    root,
    "ceremony",
    "contributions",
  )

const transcriptFile =
  join(
    publicDir,
    "dkg-public-transcript.json",
  )

const requestFile =
  join(
    publicDir,
    "trustee-transcript-request.json",
  )

const summaryFile =
  join(
    publicDir,
    "dkg-summary.json",
  )


if (
  await exists(
    transcriptFile,
  )
) {
  const transcript =
    JSON.parse(
      await readFile(
        transcriptFile,
        "utf8",
      ),
    )

  const c =
    await context()

  verifyDkgTranscript(
    c,
    transcript,
  )

  const transcriptHash =
    canonicalSha256(
      transcript,
    )

  console.log(
    "DKG_ALREADY_EXISTS=YES",
  )

  console.log(
    `ELECTION_ID=${electionId}`,
  )

  console.log(
    `TRANSCRIPT_HASH=0x${transcriptHash}`,
  )

  console.log(
    `PUBLIC_TRANSCRIPT=${transcriptFile}`,
  )

  console.log(
    "EXISTING_TRANSCRIPT_VERIFY=PASS",
  )

  process.exit(0)
}


if (
  await exists(
    root,
  )
) {
  throw new Error(
    `Refusing to overwrite incomplete DKG directory: ${root}`,
  )
}


await mkdir(
  publicDir,
  {
    recursive: true,
  },
)

await mkdir(
  custodyDir,
  {
    recursive: true,
  },
)

await mkdir(
  contributionDir,
  {
    recursive: true,
  },
)


const c =
  await context()


const identities = []
const passphrases = []


for (
  let trusteeId = 1;
  trusteeId <=
    trusteeCount;
  trusteeId += 1
) {
  const passphrase =
    randomBytes(
      32,
    )
      .toString(
        "hex",
      )

  const identity =
    createTrusteeTransportIdentity({
      trusteeId,
      passphrase,
      ceremonyId,
    })

  identities.push(
    identity,
  )

  passphrases.push(
    passphrase,
  )

  await writeFile(
    join(
      custodyDir,
      `trustee-${trusteeId}.passphrase`,
    ),
    passphrase + "\n",
    {
      encoding:
        "utf8",

      mode:
        0o600,
    },
  )

  await writeJson(
    join(
      custodyDir,
      `trustee-${trusteeId}-identity.json`,
    ),
    identity,
  )
}


const roster =
  identities.map(
    item =>
      item.publicIdentity,
  )


await writeJson(
  join(
    publicDir,
    "roster.json",
  ),
  roster,
)


const contributionBundles = []


for (
  let trusteeId = 1;
  trusteeId <=
    trusteeCount;
  trusteeId += 1
) {
  const bundle =
    createDkgContribution({
      c,
      trusteeId,
      threshold,
      trusteeCount,
      roster,
      ceremonyId,
    })

  contributionBundles.push(
    bundle,
  )

  await writeJson(
    join(
      contributionDir,
      `trustee-${trusteeId}.json`,
    ),
    bundle,
  )
}


const derivedShares = []


for (
  let trusteeId = 1;
  trusteeId <=
    trusteeCount;
  trusteeId += 1
) {
  const derived =
    deriveTrusteeShare({
      c,
      trusteeId,
      threshold,
      trusteeCount,
      ceremonyId,

      identity:
        identities[
          trusteeId - 1
        ],

      passphrase:
        passphrases[
          trusteeId - 1
        ],

      contributionBundles,
    })

  derivedShares.push(
    derived,
  )

  await writeJson(
    join(
      custodyDir,
      `trustee-${trusteeId}-share.json`,
    ),
    derived,
  )
}


const {
  transcript,
  transcriptHash,
} =
  buildDkgTranscript({
    c,
    ceremonyId,
    threshold,
    trusteeCount,
    roster,
    contributionBundles,
    derivedShares,
  })


verifyDkgTranscript(
  c,
  transcript,
)


const recomputedHash =
  canonicalSha256(
    transcript,
  )


if (
  recomputedHash !==
    transcriptHash
) {
  throw new Error(
    "DKG transcript hash mismatch",
  )
}


await writeJson(
  transcriptFile,
  transcript,
)


await writeJson(
  requestFile,
  {
    transcript,
  },
)


await writeJson(
  summaryFile,
  {
    electionId,
    ceremonyId,
    threshold,
    trusteeCount,

    transcriptHash:
      "0x" +
      transcriptHash,

    publicKey:
      transcript.publicKey,

    publicTranscript:
      transcriptFile,

    trusteeTranscriptRequest:
      requestFile,

    custodyDirectory:
      custodyDir,
  },
)


console.log(
  "DKG_GENERATION=PASS",
)

console.log(
  `ELECTION_ID=${electionId}`,
)

console.log(
  `THRESHOLD=${threshold}`,
)

console.log(
  `TRUSTEE_COUNT=${trusteeCount}`,
)

console.log(
  `TRANSCRIPT_HASH=0x${transcriptHash}`,
)

console.log(
  `PUBLIC_KEY_X=${transcript.publicKey[0]}`,
)

console.log(
  `PUBLIC_KEY_Y=${transcript.publicKey[1]}`,
)

console.log(
  `PUBLIC_TRANSCRIPT=${transcriptFile}`,
)

console.log(
  `TRANSCRIPT_REQUEST_BODY=${requestFile}`,
)

console.log(
  `CUSTODY_DIRECTORY=${custodyDir}`,
)

console.log(
  "TRUSTEE_SECRETS_PRINTED=NO",
)
