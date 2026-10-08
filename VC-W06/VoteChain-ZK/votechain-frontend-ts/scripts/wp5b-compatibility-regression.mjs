import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import * as circomlibPkg from "circomlibjs"
import * as snarkPkg from "snarkjs"

const buildPoseidon =
  circomlibPkg.buildPoseidon ??
  circomlibPkg.default?.buildPoseidon

const groth16 =
  snarkPkg.groth16 ??
  snarkPkg.default?.groth16

if (!buildPoseidon || !groth16) {
  throw new Error(
    "Required circomlibjs/snarkjs runtime unavailable",
  )
}

const [
  ,
  ,
  root,
  evidenceDir,
  profilePath,
  wasmPath,
  zkeyPath,
  vkeyPath,
  verifierPath,
] = process.argv

if (
  !root ||
  !evidenceDir ||
  !profilePath ||
  !wasmPath ||
  !zkeyPath ||
  !vkeyPath ||
  !verifierPath
) {
  throw new Error(
    "Missing compatibility-regression argument",
  )
}

function readJson(file) {
  return JSON.parse(
    fs.readFileSync(file, "utf8"),
  )
}

function sha256(file) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(file))
    .digest("hex")
}

function jsonWrite(file, value) {
  fs.mkdirSync(
    path.dirname(file),
    { recursive: true },
  )

  fs.writeFileSync(
    file,
    JSON.stringify(
      value,
      (_key, item) =>
        typeof item === "bigint"
          ? item.toString()
          : item,
      2,
    ) + "\n",
  )
}

const profile =
  readJson(profilePath)

const poseidon =
  await buildPoseidon()

const PF =
  poseidon.F

function H(values) {
  return BigInt(
    PF.toObject(
      poseidon(
        values.map(
          (value) => BigInt(value),
        ),
      ),
    ),
  )
}

const D_MANIFEST =
  BigInt(
    profile.domains.candidateManifest,
  )

const D_CTX =
  BigInt(
    profile.domains.electionContext,
  )

const candidateIds4 = [
  101n,
  102n,
  103n,
  104n,
]

const candidateIds16 =
  Array.from(
    { length: 16 },
    (_value, index) =>
      101n + BigInt(index),
  )

/*
 * First establish that the historical WP3/WP4
 * four-candidate vector really uses:
 *
 * Poseidon(
 *   D_MANIFEST,
 *   candidateId[0],
 *   ...
 * )
 */
const vectorRoot =
  path.join(
    root,
    "crypto",
    "vectors",
    "wp3",
  )

const vectorRuns =
  fs.readdirSync(vectorRoot)
    .filter((name) =>
      fs.existsSync(
        path.join(
          vectorRoot,
          name,
          "direct",
          "valid.json",
        ),
      ),
    )
    .sort()

if (vectorRuns.length === 0) {
  throw new Error(
    "No WP3 DIRECT valid vector found",
  )
}

const vectorRun =
  vectorRuns[vectorRuns.length - 1]

const baseVectorPath =
  path.join(
    vectorRoot,
    vectorRun,
    "direct",
    "valid.json",
  )

const base =
  readJson(baseVectorPath)

const historicalManifest4 =
  H([
    D_MANIFEST,
    ...candidateIds4,
  ])

if (
  historicalManifest4.toString() !==
  String(base.candidateManifestHash)
) {
  throw new Error(
    "WP3 known-answer manifest formula mismatch",
  )
}

console.log(
  "WP3_FOUR_CANDIDATE_MANIFEST_KAT=PASS",
)

/*
 * Test whether the same one-shot construction
 * is representable at the declared K=16.
 *
 * Domain + 16 candidate IDs = 17 inputs.
 */
let oneShotK16Supported = false
let oneShotK16Error = null
let oneShotK16Value = null

try {
  oneShotK16Value =
    H([
      D_MANIFEST,
      ...candidateIds16,
    ])

  oneShotK16Supported = true
} catch (error) {
  oneShotK16Error =
    error instanceof Error
      ? error.message
      : String(error)
}

console.log(
  `ONE_SHOT_K16_SUPPORTED=${
    oneShotK16Supported ? "YES" : "NO"
  }`,
)

/*
 * Freeze the closest compatible algorithm:
 *
 * A. If one-shot supports K=16, retain the exact
 *    WP3/WP4 construction.
 *
 * B. Otherwise use one indexed Poseidon chain:
 *
 *    state0 = Poseidon(D_MANIFEST, candidateCount)
 *    state(i+1) = Poseidon(state(i), i, candidateId[i])
 *
 * This remains an opaque public manifest hash to the
 * already-frozen circuit/verifier. No circuit constraints
 * or trusted setup change.
 */
const manifestAlgorithm =
  oneShotK16Supported
    ? "POSEIDON_DOMAIN_PLUS_IDS_V1"
    : "POSEIDON_INDEXED_CHAIN_V1"

async function canonicalManifest(candidateIds) {
  const ids =
    candidateIds.map(
      (value) => BigInt(value),
    )

  if (
    ids.length < 1 ||
    ids.length >
      Number(profile.maxCandidates)
  ) {
    throw new Error(
      "Candidate manifest length out of range",
    )
  }

  if (
    manifestAlgorithm ===
    "POSEIDON_DOMAIN_PLUS_IDS_V1"
  ) {
    return H([
      D_MANIFEST,
      ...ids,
    ])
  }

  let state =
    H([
      D_MANIFEST,
      BigInt(ids.length),
    ])

  for (
    let index = 0;
    index < ids.length;
    index += 1
  ) {
    state =
      H([
        state,
        BigInt(index),
        ids[index],
      ])
  }

  return state
}

const manifest16 =
  await canonicalManifest(
    candidateIds16,
  )

const input16 =
  structuredClone(base)

input16.candidateCount =
  "16"

input16.candidateManifestHash =
  manifest16.toString()

input16.electionContextHash =
  H([
    D_CTX,
    BigInt(input16.electionId),
    manifest16,
    16n,
    BigInt(input16.contractDomain),
    BigInt(input16.Yx),
    BigInt(input16.Yy),
  ]).toString()

const proofStart =
  performance.now()

const {
  proof,
  publicSignals,
} =
  await groth16.fullProve(
    input16,
    wasmPath,
    zkeyPath,
  )

const proofMs =
  performance.now() -
  proofStart

const vkey =
  readJson(vkeyPath)

const verified =
  await groth16.verify(
    vkey,
    publicSignals,
    proof,
  )

if (!verified) {
  throw new Error(
    "K16 WP5 compatibility proof did not verify",
  )
}

if (
  !Array.isArray(publicSignals) ||
  publicSignals.length !== 73
) {
  throw new Error(
    `Expected 73 DIRECT public signals, got ${
      publicSignals?.length
    }`,
  )
}

const expectedFixed = [
  input16.eligibleRoot,
  input16.electionId,
  input16.candidateManifestHash,
  input16.candidateCount,
  input16.contractDomain,
  input16.Yx,
  input16.Yy,
  input16.electionContextHash,
  input16.nullifier,
].map(String)

for (
  let index = 0;
  index < expectedFixed.length;
  index += 1
) {
  if (
    String(publicSignals[index]) !==
    expectedFixed[index]
  ) {
    throw new Error(
      `DIRECT public signal mismatch at ${index}`,
    )
  }
}

console.log(
  "WP5_K16_DIRECT_REAL_GROTH16=PASS",
)

console.log(
  "WP5_K16_DIRECT_PUBLIC_SIGNALS=73",
)

const artifactHashes = {
  wasm: sha256(wasmPath),
  zkey: sha256(zkeyPath),
  vkey: sha256(vkeyPath),
  verifier: sha256(verifierPath),
}

const appProfile = {
  profile:
    "VoteChain-ZK-WP5-Application-v1",

  inheritedWp3Profile:
    profile.profile,

  maxCandidates:
    Number(profile.maxCandidates),

  merkleDepth:
    Number(profile.merkleDepth),

  eligibleCapacity:
    Number(profile.eligibleCapacity),

  fieldModulus:
    String(profile.fieldModulus),

  domains:
    profile.domains,

  babyjub:
    profile.babyjub,

  candidateManifest: {
    algorithm:
      manifestAlgorithm,

    historicalWp3Wp4SyntheticAlgorithm:
      "POSEIDON_DOMAIN_PLUS_IDS_V1",

    oneShotK16Supported,

    oneShotK16Error,

    indexBase:
      manifestAlgorithm ===
      "POSEIDON_INDEXED_CHAIN_V1"
        ? 0
        : null,

    lengthBound:
      manifestAlgorithm ===
      "POSEIDON_INDEXED_CHAIN_V1"
        ? "Poseidon(D_MANIFEST,candidateCount)"
        : "Implicit in Poseidon input vector",

    candidateIds16:
      candidateIds16.map(String),

    manifest16:
      manifest16.toString(),
  },

  directArtifacts: {
    wp3Run:
      "20260930_170614",

    trustedSetup:
      "DEV_ONLY",

    wasmUrl:
      "/zk/wp5/direct/VoteChainVoteDirect.wasm",

    zkeyUrl:
      "/zk/wp5/direct/VoteChainVoteDirect_final.zkey",

    verificationKeyUrl:
      "/zk/wp5/direct/verification_key.json",

    sha256:
      artifactHashes,
  },
}

const appProfilePath =
  path.join(
    root,
    "crypto",
    "config",
    "wp5-application-profile.json",
  )

jsonWrite(
  appProfilePath,
  appProfile,
)

jsonWrite(
  path.join(
    evidenceDir,
    "wp5b-k16-input.json",
  ),
  input16,
)

jsonWrite(
  path.join(
    evidenceDir,
    "wp5b-k16-proof.json",
  ),
  proof,
)

jsonWrite(
  path.join(
    evidenceDir,
    "wp5b-k16-public.json",
  ),
  publicSignals,
)

const report = {
  status:
    "PASS",

  vectorRun,

  baseVectorPath,

  wp3FourCandidateManifestKat:
    true,

  oneShotK16Supported,

  oneShotK16Error,

  oneShotK16Value,

  manifestAlgorithm,

  canonicalManifest16:
    manifest16,

  k16Groth16Verify:
    verified,

  k16PublicSignalCount:
    publicSignals.length,

  k16ProofMs:
    proofMs,

  artifactHashes,

  trustedSetup:
    "DEV_ONLY",
}

jsonWrite(
  path.join(
    evidenceDir,
    "wp5b-compatibility-report.json",
  ),
  report,
)

console.log(
  `WP5_MANIFEST_ALGORITHM=${manifestAlgorithm}`,
)

console.log(
  `WP5_COMPATIBILITY_REPORT=${
    path.join(
      evidenceDir,
      "wp5b-compatibility-report.json",
    )
  }`,
)
