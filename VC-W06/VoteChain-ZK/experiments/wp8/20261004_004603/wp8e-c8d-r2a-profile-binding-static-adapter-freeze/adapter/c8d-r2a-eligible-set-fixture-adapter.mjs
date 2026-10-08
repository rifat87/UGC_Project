import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

function fail(message) {
  throw new Error(message)
}

function parseArgs(argv) {
  const result = {}

  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i]
    const value = argv[i + 1]

    if (!key || !key.startsWith("--") || value === undefined) {
      fail("Arguments must be --name value pairs")
    }

    result[key.slice(2)] = value
  }

  return result
}

const args = parseArgs(process.argv)

for (const required of [
  "root",
  "reuse-contract",
  "base-input",
  "n",
  "out-input",
  "out-meta",
]) {
  if (!(required in args)) {
    fail(`Missing --${required}`)
  }
}

const root = path.resolve(args.root)
const reusePath = path.resolve(args["reuse-contract"])
const basePath = path.resolve(args["base-input"])
const outInput = path.resolve(args["out-input"])
const outMeta = path.resolve(args["out-meta"])

const n = Number(args.n)

if (
  !Number.isSafeInteger(n) ||
  ![10, 100, 1000, 10000].includes(n)
) {
  fail("N must be one of 10,100,1000,10000")
}

const reuse = JSON.parse(
  fs.readFileSync(
    reusePath,
    "utf8",
  ),
)

if (reuse.status !== "PASS") {
  fail("Reuse contract is not PASS")
}

if (
  reuse.decision !==
  "REUSE_ACTIVE_BACKEND_BUILDWP5MERKLESNAPSHOT"
) {
  fail("Unexpected reuse decision")
}

if (Number(reuse.configuredMerkleDepth) !== 17) {
  fail("Frozen depth != 17")
}

if (Number(reuse.configuredMerkleCapacity) !== 131072) {
  fail("Frozen capacity != 131072")
}

const servicePath =
  path.join(
    root,
    reuse.backendRelativePath,
  )

const backend =
  await import(
    pathToFileURL(
      servicePath,
    ).href
  )

if (
  typeof backend.wp5Hash !== "function" ||
  typeof backend.buildWp5MerkleSnapshot !== "function"
) {
  fail("Required active backend exports unavailable")
}

const identityDomain =
  BigInt(
    reuse.identityDomain,
  )

const base = JSON.parse(
  fs.readFileSync(
    basePath,
    "utf8",
  ),
)

if (Number(base.candidateCount) !== 16) {
  fail("Base candidateCount != 16")
}

if (
  !Array.isArray(base.siblings) ||
  base.siblings.length !== 17
) {
  fail("Base siblings length != 17")
}

if (
  !Array.isArray(base.pathBits) ||
  base.pathBits.length !== 17
) {
  fail("Base pathBits length != 17")
}

if (
  base.pathBits.some(
    value => BigInt(value) !== 0n,
  )
) {
  fail("Selected voter must remain leaf index 0")
}

const selectedSecret =
  BigInt(
    base.secret,
  )

const records = []

for (
  let index = 0;
  index < n;
  index += 1
) {
  const secret =
    selectedSecret +
    BigInt(index)

  const commitment =
    await backend.wp5Hash([
      identityDomain,
      secret,
    ])

  records.push({
    wp5GroupIndex:
      index,

    wp5IdentityCommitment:
      commitment.toString(),
  })
}

const snapshot =
  await backend.buildWp5MerkleSnapshot(
    records,
    0,
  )

if (Number(snapshot.size) !== n) {
  fail("Snapshot size mismatch")
}

if (Number(snapshot.depth) !== 17) {
  fail("Snapshot depth mismatch")
}

if (
  !Array.isArray(snapshot.siblings) ||
  snapshot.siblings.length !== 17
) {
  fail("Snapshot siblings length != 17")
}

if (
  !Array.isArray(snapshot.pathBits) ||
  snapshot.pathBits.length !== 17
) {
  fail("Snapshot pathBits length != 17")
}

if (
  snapshot.pathBits.some(
    value => BigInt(value) !== 0n,
  )
) {
  fail("Target leaf-0 pathBits are not all zero")
}

/*
 * Independent membership reconstruction using the backend hash primitive.
 */
let reconstructed =
  await backend.wp5Hash([
    identityDomain,
    selectedSecret,
  ])

for (
  let level = 0;
  level < 17;
  level += 1
) {
  const bit =
    BigInt(
      snapshot.pathBits[level],
    )

  const sibling =
    BigInt(
      snapshot.siblings[level],
    )

  reconstructed =
    bit === 0n
      ? await backend.wp5Hash([
          reconstructed,
          sibling,
        ])
      : await backend.wp5Hash([
          sibling,
          reconstructed,
        ])
}

if (
  reconstructed.toString() !==
  String(snapshot.root)
) {
  fail("Witness does not reconstruct snapshot root")
}

const controlled =
  JSON.parse(
    JSON.stringify(base),
  )

controlled.eligibleRoot =
  String(snapshot.root)

controlled.siblings =
  snapshot.siblings.map(String)

const allowed =
  new Set([
    "eligibleRoot",
    "siblings",
  ])

for (const key of Object.keys(base)) {
  if (allowed.has(key)) {
    continue
  }

  if (
    JSON.stringify(base[key]) !==
    JSON.stringify(controlled[key])
  ) {
    fail(
      `Unexpected controlled-input mutation: ${key}`,
    )
  }
}

const metadata = {
  status:
    "PASS",

  eligibleSetSize:
    n,

  configuredMerkleDepth:
    17,

  configuredCapacity:
    131072,

  selectedVoterIndex:
    0,

  selectedVoterSecret:
    selectedSecret.toString(),

  occupiedLeafStart:
    0,

  occupiedLeafEnd:
    n - 1,

  eligibleRoot:
    String(snapshot.root),

  siblings:
    snapshot.siblings.map(String),

  pathBits:
    snapshot.pathBits.map(String),

  changedCircuitInputFields: [
    "eligibleRoot",
    "siblings",
  ],

  backendBuilder:
    "buildWp5MerkleSnapshot",

  backendHashPrimitive:
    "wp5Hash",

  syntheticAdditionalSecretRecipe:
    "selectedVoterSecret + index",

  newMerkleAlgorithmImplemented:
    false,

  timingPerformed:
    false,

  proofGenerated:
    false,

  onchainExecutionPerformed:
    false,
}

fs.mkdirSync(
  path.dirname(outInput),
  {
    recursive:
      true,
  },
)

fs.mkdirSync(
  path.dirname(outMeta),
  {
    recursive:
      true,
  },
)

fs.writeFileSync(
  outInput,
  JSON.stringify(
    controlled,
    null,
    2,
  ) + "\n",
  "utf8",
)

fs.writeFileSync(
  outMeta,
  JSON.stringify(
    metadata,
    null,
    2,
  ) + "\n",
  "utf8",
)

console.log(
  `STATUS=PASS N=${n} DEPTH=17`
)
