import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { spawnSync } from "node:child_process"
import { pathToFileURL } from "node:url"

const EXPECTED = {
  baseInputSha:
    "4c22f77bdd5e7d001d25b904bd01501166516d124c9c209214eaa0830be65e43",

  r1csSha:
    "11b1340614c539a9cafb42dd6a10d2b8cf3a19b0680002c8f81952007c885ae0",

  wasmSha:
    "02af9e5b38f104cbb39f5a56a444de509091953b1e002722cf0ccb4ddccebf6a",

  zkeySha:
    "867837bbcb2eb6f01fa9bc86610228b71109c2bb5f9c9838397e58ce7aa15e50",

  vkeySha:
    "90b48f1c8c2f0c1f4ed5a54635fda4107a7a4c053ba375e9952b530d3a93c0f1",

  snarkjsSha:
    "092c70dbf8bef02b666456db7429127aa51c5dbfce91cef038638d7da3bfdcea",
}

const ALLOWED_N = new Set([
  10,
  100,
  1000,
  10000,
])

const ALLOWED_PHASES = new Set([
  "PILOT_EXCLUDED",
  "WARMUP",
  "MEASURED",
])

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

function sha256File(filePath) {
  return crypto
    .createHash("sha256")
    .update(
      fs.readFileSync(filePath),
    )
    .digest("hex")
}

function sha256Text(text) {
  return crypto
    .createHash("sha256")
    .update(
      Buffer.from(
        text,
        "utf8",
      ),
    )
    .digest("hex")
}

function assertHash(filePath, expected, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} missing: ${filePath}`)
  }

  const actual = sha256File(filePath)

  if (actual !== expected) {
    fail(
      `${label} hash mismatch: expected ${expected}, got ${actual}`,
    )
  }

  return actual
}

function elapsedMs(start) {
  return (
    Number(
      process.hrtime.bigint() - start,
    )
    /
    1_000_000
  )
}

function parsePlan(planText) {
  const lines = planText
    .split(/\r?\n/)
    .filter(
      line => line.trim() !== "",
    )

  if (lines.length < 2) {
    fail("Plan has no observations")
  }

  const header =
    lines[0].split("\t")

  const expectedHeader = [
    "observation_id",
    "phase",
    "N",
    "order_position",
  ]

  if (
    JSON.stringify(header)
    !==
    JSON.stringify(expectedHeader)
  ) {
    fail(
      "Unexpected plan header",
    )
  }

  const ids = new Set()

  return lines
    .slice(1)
    .map(
      (line, zeroIndex) => {
        const parts =
          line.split("\t")

        if (parts.length !== 4) {
          fail(
            `Malformed plan row ${zeroIndex + 2}`,
          )
        }

        const observationId =
          parts[0]

        const phase =
          parts[1]

        const n =
          Number(parts[2])

        const orderPosition =
          Number(parts[3])

        if (!observationId) {
          fail("Blank observation ID")
        }

        if (ids.has(observationId)) {
          fail(
            `Duplicate observation ID: ${observationId}`,
          )
        }

        ids.add(observationId)

        if (!ALLOWED_PHASES.has(phase)) {
          fail(
            `Unsupported phase: ${phase}`,
          )
        }

        if (!ALLOWED_N.has(n)) {
          fail(
            `Unsupported N: ${n}`,
          )
        }

        if (
          !Number.isSafeInteger(orderPosition)
          ||
          orderPosition < 1
        ) {
          fail(
            `Invalid order_position for ${observationId}`,
          )
        }

        return {
          observationId,
          phase,
          N:
            n,
          orderPosition,
        }
      },
    )
}

function parseFixtureIndex(indexText) {
  const lines = indexText
    .split(/\r?\n/)
    .filter(
      line => line.trim() !== "",
    )

  const header =
    lines[0].split("\t")

  if (
    header[0] !== "N"
    ||
    header[1] !== "input_sha256"
  ) {
    fail(
      "Unexpected fixture-index header",
    )
  }

  const map = new Map()

  for (
    const line of lines.slice(1)
  ) {
    const parts =
      line.split("\t")

    const n =
      Number(parts[0])

    map.set(
      n,
      {
        inputSha:
          parts[1],

        eligibleRoot:
          parts[3],
      },
    )
  }

  for (
    const n of ALLOWED_N
  ) {
    if (!map.has(n)) {
      fail(
        `Fixture index missing N=${n}`,
      )
    }
  }

  return map
}

function sanitizeVerifyText(text) {
  return text
    .replace(
      /\x1b\[[0-?]*[ -/]*[@-~]/g,
      "",
    )
    .replace(
      /\r/g,
      "",
    )
}

function semanticVerifyOk(text) {
  const clean =
    sanitizeVerifyText(text)

  return (
    /snarkJS:\s*OK!/i.test(
      clean,
    )
  )
}

function runSnarkjs(
  snarkjsCli,
  args,
) {
  return spawnSync(
    process.execPath,
    [
      snarkjsCli,
      ...args,
    ],
    {
      encoding:
        "utf8",

      windowsHide:
        true,

      maxBuffer:
        32 * 1024 * 1024,
    },
  )
}

function signalScalar(value) {
  return String(
    BigInt(value),
  )
}

function assertPublicBinding(
  input,
  publicSignals,
) {
  if (
    !Array.isArray(publicSignals)
    ||
    publicSignals.length !== 73
  ) {
    fail(
      `Public signal count ${
        Array.isArray(publicSignals)
          ? publicSignals.length
          : "NON_ARRAY"
      } != 73`,
    )
  }

  const expected = [
    signalScalar(
      input.eligibleRoot,
    ),

    signalScalar(
      input.electionId,
    ),

    signalScalar(
      input.candidateManifestHash,
    ),

    signalScalar(
      input.candidateCount,
    ),

    signalScalar(
      input.contractDomain,
    ),

    signalScalar(
      input.Yx,
    ),

    signalScalar(
      input.Yy,
    ),

    signalScalar(
      input.electionContextHash,
    ),

    signalScalar(
      input.nullifier,
    ),
  ]

  for (
    const name of [
      "Rx",
      "Ry",
      "Sx",
      "Sy",
    ]
  ) {
    if (
      !Array.isArray(
        input[name],
      )
      ||
      input[name].length !== 16
    ) {
      fail(
        `${name} length != 16`,
      )
    }

    expected.push(
      ...input[name].map(
        signalScalar,
      ),
    )
  }

  if (expected.length !== 73) {
    fail(
      "Internal public-layout error",
    )
  }

  const actual =
    publicSignals.map(
      signalScalar,
    )

  const mismatches = []

  for (
    let i = 0;
    i < 73;
    i += 1
  ) {
    if (
      expected[i]
      !==
      actual[i]
    ) {
      mismatches.push(i)
    }
  }

  if (mismatches.length) {
    fail(
      `Public-signal mismatches: ${mismatches.join(",")}`,
    )
  }
}

function deepEqualJson(a, b) {
  return (
    JSON.stringify(a)
    ===
    JSON.stringify(b)
  )
}

function writeJson(filePath, value) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      value,
      null,
      2,
    )
    + "\n",
    "utf8",
  )
}

const args = parseArgs(
  process.argv,
)

for (
  const required of [
    "root",
    "reuse-contract",
    "base-input",
    "expected-input-dir",
    "fixture-index",
    "r1cs",
    "wasm",
    "zkey",
    "vkey",
    "snarkjs-cli",
    "plan",
    "output-dir",
  ]
) {
  if (!(required in args)) {
    fail(
      `Missing --${required}`,
    )
  }
}

const root =
  path.resolve(
    args.root,
  )

const reuseContractPath =
  path.resolve(
    args["reuse-contract"],
  )

const baseInputPath =
  path.resolve(
    args["base-input"],
  )

const expectedInputDir =
  path.resolve(
    args["expected-input-dir"],
  )

const fixtureIndexPath =
  path.resolve(
    args["fixture-index"],
  )

const r1csPath =
  path.resolve(
    args.r1cs,
  )

const wasmPath =
  path.resolve(
    args.wasm,
  )

const zkeyPath =
  path.resolve(
    args.zkey,
  )

const vkeyPath =
  path.resolve(
    args.vkey,
  )

const snarkjsCli =
  path.resolve(
    args["snarkjs-cli"],
  )

const planPath =
  path.resolve(
    args.plan,
  )

const outputDir =
  path.resolve(
    args["output-dir"],
  )

if (
  fs.existsSync(outputDir)
) {
  fail(
    `Output directory already exists: ${outputDir}`,
  )
}

fs.mkdirSync(
  outputDir,
  {
    recursive:
      false,
  },
)

const resultsDir =
  path.join(
    outputDir,
    "results",
  )

const workRoot =
  path.join(
    outputDir,
    "work",
  )

fs.mkdirSync(resultsDir)
fs.mkdirSync(workRoot)

assertHash(
  baseInputPath,
  EXPECTED.baseInputSha,
  "base input",
)

assertHash(
  r1csPath,
  EXPECTED.r1csSha,
  "R1CS",
)

assertHash(
  wasmPath,
  EXPECTED.wasmSha,
  "WASM",
)

assertHash(
  zkeyPath,
  EXPECTED.zkeySha,
  "zkey",
)

assertHash(
  vkeyPath,
  EXPECTED.vkeySha,
  "vkey",
)

assertHash(
  snarkjsCli,
  EXPECTED.snarkjsSha,
  "snarkjs CLI",
)

const reuse =
  JSON.parse(
    fs.readFileSync(
      reuseContractPath,
      "utf8",
    ),
  )

if (
  reuse.status !== "PASS"
  ||
  reuse.decision !==
    "REUSE_ACTIVE_BACKEND_BUILDWP5MERKLESNAPSHOT"
) {
  fail(
    "Frozen reuse contract is invalid",
  )
}

if (
  Number(
    reuse.configuredMerkleDepth,
  ) !== 17
  ||
  Number(
    reuse.configuredMerkleCapacity,
  ) !== 131072
) {
  fail(
    "Frozen Merkle configuration mismatch",
  )
}

const servicePath =
  path.join(
    root,
    reuse.backendRelativePath,
  )

assertHash(
  servicePath,
  reuse.backendSha256,
  "active backend",
)

const backend =
  await import(
    pathToFileURL(
      servicePath,
    ).href
  )

if (
  typeof backend.wp5Hash
    !== "function"
  ||
  typeof backend.buildWp5MerkleSnapshot
    !== "function"
) {
  fail(
    "Required backend exports unavailable",
  )
}

const identityDomain =
  BigInt(
    reuse.identityDomain,
  )

const baseInput =
  JSON.parse(
    fs.readFileSync(
      baseInputPath,
      "utf8",
    ),
  )

if (
  Number(
    baseInput.candidateCount,
  ) !== 16
) {
  fail(
    "Base candidateCount != 16",
  )
}

if (
  !Array.isArray(
    baseInput.pathBits,
  )
  ||
  baseInput.pathBits.length
    !== 17
  ||
  baseInput.pathBits.some(
    value =>
      BigInt(value) !== 0n,
  )
) {
  fail(
    "Controlled target pathBits are not frozen leaf-index-0 depth-17",
  )
}

const selectedSecret =
  BigInt(
    baseInput.secret,
  )

const planText =
  fs.readFileSync(
    planPath,
    "utf8",
  )

const plan =
  parsePlan(
    planText,
  )

const fixtureIndex =
  parseFixtureIndex(
    fs.readFileSync(
      fixtureIndexPath,
      "utf8",
    ),
  )

const frozenPlanCopy =
  path.join(
    outputDir,
    "FROZEN_PLAN.tsv",
  )

fs.writeFileSync(
  frozenPlanCopy,
  planText,
  "utf8",
)

const observationsTsv =
  path.join(
    outputDir,
    "OBSERVATIONS.tsv",
  )

fs.writeFileSync(
  observationsTsv,
  [
    "observation_id",
    "phase",
    "N",
    "order_position",
    "m1_leaf_materialization_ms",
    "m2_snapshot_root_path_ms",
    "m3_witness_generation_ms",
    "m4_groth16_prove_ms",
    "m5_groth16_verify_ms",
    "wtns_check_rc",
    "verify_rc",
    "semantic_verify_ok",
    "eligible_root",
    "witness_sha256",
    "proof_sha256",
    "public_sha256",
    "status",
  ].join("\t")
  + "\n",
  "utf8",
)

const campaignMeta = {
  status:
    "STARTED",

  classification:
    "ELIGIBLE_SET_SCALING_OFFCHAIN_CRYPTO_CAMPAIGN",

  planSha256:
    sha256Text(
      planText,
    ),

  observationCount:
    plan.length,

  configuredMerkleDepth:
    17,

  configuredMerkleCapacity:
    131072,

  candidateCount:
    16,

  selectedVoterIndex:
    0,

  activeBackendSha256:
    reuse.backendSha256,

  artifactHashes: {
    r1cs:
      EXPECTED.r1csSha,

    wasm:
      EXPECTED.wasmSha,

    zkey:
      EXPECTED.zkeySha,

    vkey:
      EXPECTED.vkeySha,

    snarkjsCli:
      EXPECTED.snarkjsSha,
  },

  automaticRetry:
    false,

  onchainExecution:
    false,
}

writeJson(
  path.join(
    outputDir,
    "CAMPAIGN_META.json",
  ),
  campaignMeta,
)

/*
 * Untimed campaign-process prewarm.
 *
 * This excludes one-time Poseidon/backend initialization
 * from M1 and M2.
 */
const prewarmCommitment =
  await backend.wp5Hash([
    identityDomain,
    selectedSecret,
  ])

await backend.buildWp5MerkleSnapshot(
  [
    {
      wp5GroupIndex:
        0,

      wp5IdentityCommitment:
        prewarmCommitment.toString(),
    },
  ],
  0,
)

writeJson(
  path.join(
    outputDir,
    "PREWARM.json",
  ),
  {
    status:
      "PASS",

    timed:
      false,

    recipe:
      "one wp5Hash plus one 1-leaf buildWp5MerkleSnapshot",

    selectedVoterIndex:
      0,
  },
)

let completed = 0

for (
  const observation of plan
) {
  const {
    observationId,
    phase,
    N,
    orderPosition,
  } = observation

  const workDir =
    path.join(
      workRoot,
      observationId,
    )

  if (
    fs.existsSync(workDir)
  ) {
    fail(
      `Observation work directory already exists: ${workDir}`,
    )
  }

  fs.mkdirSync(workDir)

  const inputPath =
    path.join(
      workDir,
      "input.json",
    )

  const witnessPath =
    path.join(
      workDir,
      "witness.wtns",
    )

  const proofPath =
    path.join(
      workDir,
      "proof.json",
    )

  const publicPath =
    path.join(
      workDir,
      "public.json",
    )

  const verifyLogPath =
    path.join(
      workDir,
      "verify.log",
    )

  const resultPath =
    path.join(
      resultsDir,
      `${observationId}.json`,
    )

  const result = {
    status:
      "STARTED",

    observationId,
    phase,
    N,
    orderPosition,

    configuredMerkleDepth:
      17,

    selectedVoterIndex:
      0,

    metricsMs:
      {},

    automaticRetry:
      false,
  }

  try {
    /*
     * M1 — eligible identity leaf materialization.
     */
    const m1Start =
      process.hrtime.bigint()

    const records = []

    for (
      let index = 0;
      index < N;
      index += 1
    ) {
      const secret =
        selectedSecret
        +
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

    result.metricsMs.M1 =
      elapsedMs(
        m1Start,
      )

    /*
     * M2 — integrated active root + target path build.
     */
    const m2Start =
      process.hrtime.bigint()

    const snapshot =
      await backend.buildWp5MerkleSnapshot(
        records,
        0,
      )

    result.metricsMs.M2 =
      elapsedMs(
        m2Start,
      )

    if (
      Number(
        snapshot.size,
      ) !== N
      ||
      Number(
        snapshot.depth,
      ) !== 17
    ) {
      fail(
        `${observationId}: snapshot size/depth mismatch`,
      )
    }

    if (
      !Array.isArray(
        snapshot.siblings,
      )
      ||
      snapshot.siblings.length
        !== 17
      ||
      !Array.isArray(
        snapshot.pathBits,
      )
      ||
      snapshot.pathBits.length
        !== 17
      ||
      snapshot.pathBits.some(
        value =>
          BigInt(value) !== 0n,
      )
    ) {
      fail(
        `${observationId}: invalid target path`,
      )
    }

    const controlled =
      JSON.parse(
        JSON.stringify(
          baseInput,
        ),
      )

    controlled.eligibleRoot =
      String(
        snapshot.root,
      )

    controlled.siblings =
      snapshot.siblings.map(
        String,
      )

    const expectedFixture =
      fixtureIndex.get(N)

    if (
      String(
        snapshot.root,
      )
      !==
      String(
        expectedFixture.eligibleRoot,
      )
    ) {
      fail(
        `${observationId}: root differs from frozen R3B root`,
      )
    }

    const frozenInputPath =
      path.join(
        expectedInputDir,
        `eligible-set-n${N}-input.json`,
      )

    assertHash(
      frozenInputPath,
      expectedFixture.inputSha,
      `frozen N${N} input`,
    )

    const frozenInput =
      JSON.parse(
        fs.readFileSync(
          frozenInputPath,
          "utf8",
        ),
      )

    if (
      !deepEqualJson(
        controlled,
        frozenInput,
      )
    ) {
      fail(
        `${observationId}: regenerated controlled input differs from frozen R3B input`,
      )
    }

    writeJson(
      inputPath,
      controlled,
    )

    /*
     * M3 — command-level witness generation.
     */
    const m3Start =
      process.hrtime.bigint()

    const wtns =
      runSnarkjs(
        snarkjsCli,
        [
          "wtns",
          "calculate",
          wasmPath,
          inputPath,
          witnessPath,
        ],
      )

    result.metricsMs.M3 =
      elapsedMs(
        m3Start,
      )

    result.wtnsCalculateRc =
      wtns.status

    if (
      wtns.status !== 0
    ) {
      result.wtnsStdout =
        wtns.stdout

      result.wtnsStderr =
        wtns.stderr

      fail(
        `${observationId}: wtns calculate RC=${wtns.status}`,
      )
    }

    const witnessSha =
      sha256File(
        witnessPath,
      )

    result.witnessSha256 =
      witnessSha

    /*
     * Untimed witness correctness check.
     */
    const wtnsCheck =
      runSnarkjs(
        snarkjsCli,
        [
          "wtns",
          "check",
          r1csPath,
          witnessPath,
        ],
      )

    result.wtnsCheckRc =
      wtnsCheck.status

    if (
      wtnsCheck.status !== 0
    ) {
      result.wtnsCheckStdout =
        wtnsCheck.stdout

      result.wtnsCheckStderr =
        wtnsCheck.stderr

      fail(
        `${observationId}: wtns check RC=${wtnsCheck.status}`,
      )
    }

    /*
     * M4 — command-level Groth16 proof generation.
     */
    const m4Start =
      process.hrtime.bigint()

    const prove =
      runSnarkjs(
        snarkjsCli,
        [
          "groth16",
          "prove",
          zkeyPath,
          witnessPath,
          proofPath,
          publicPath,
        ],
      )

    result.metricsMs.M4 =
      elapsedMs(
        m4Start,
      )

    result.proveRc =
      prove.status

    if (
      prove.status !== 0
    ) {
      result.proveStdout =
        prove.stdout

      result.proveStderr =
        prove.stderr

      fail(
        `${observationId}: groth16 prove RC=${prove.status}`,
      )
    }

    const proofSha =
      sha256File(
        proofPath,
      )

    const publicSha =
      sha256File(
        publicPath,
      )

    result.proofSha256 =
      proofSha

    result.publicSha256 =
      publicSha

    /*
     * M5 — command-level Groth16 verification.
     */
    const m5Start =
      process.hrtime.bigint()

    const verify =
      runSnarkjs(
        snarkjsCli,
        [
          "groth16",
          "verify",
          vkeyPath,
          publicPath,
          proofPath,
        ],
      )

    result.metricsMs.M5 =
      elapsedMs(
        m5Start,
      )

    result.verifyRc =
      verify.status

    fs.writeFileSync(
      verifyLogPath,
      (
        verify.stdout
        ?? ""
      )
      +
      (
        verify.stderr
        ?? ""
      ),
      "utf8",
    )

    if (
      verify.status !== 0
    ) {
      fail(
        `${observationId}: groth16 verify RC=${verify.status}`,
      )
    }

    const verifyText =
      fs.readFileSync(
        verifyLogPath,
        "utf8",
      )

    result.semanticVerifyOk =
      semanticVerifyOk(
        verifyText,
      )

    if (
      !result.semanticVerifyOk
    ) {
      fail(
        `${observationId}: semantic verify text missing`,
      )
    }

    /*
     * Untimed 73-signal binding validation.
     */
    const publicSignals =
      JSON.parse(
        fs.readFileSync(
          publicPath,
          "utf8",
        ),
      )

    assertPublicBinding(
      controlled,
      publicSignals,
    )

    result.publicSignalCount =
      73

    result.publicSignalBinding =
      "PASS"

    result.eligibleRoot =
      String(
        controlled.eligibleRoot,
      )

    /*
     * Successful witness retention policy:
     * hash first, then delete only the .wtns file.
     */
    fs.unlinkSync(
      witnessPath,
    )

    if (
      fs.existsSync(
        witnessPath,
      )
    ) {
      fail(
        `${observationId}: successful witness cleanup failed`,
      )
    }

    result.witnessRemoved =
      true

    result.status =
      "PASS"

    writeJson(
      resultPath,
      result,
    )

    fs.appendFileSync(
      observationsTsv,
      [
        observationId,
        phase,
        N,
        orderPosition,
        result.metricsMs.M1.toFixed(6),
        result.metricsMs.M2.toFixed(6),
        result.metricsMs.M3.toFixed(6),
        result.metricsMs.M4.toFixed(6),
        result.metricsMs.M5.toFixed(6),
        result.wtnsCheckRc,
        result.verifyRc,
        result.semanticVerifyOk
          ? "YES"
          : "NO",
        result.eligibleRoot,
        result.witnessSha256,
        result.proofSha256,
        result.publicSha256,
        result.status,
      ].join("\t")
      + "\n",
      "utf8",
    )

    completed += 1

    console.log(
      [
        "OBSERVATION_PASS",
        observationId,
        `N=${N}`,
        `M1=${result.metricsMs.M1.toFixed(3)}`,
        `M2=${result.metricsMs.M2.toFixed(3)}`,
        `M3=${result.metricsMs.M3.toFixed(3)}`,
        `M4=${result.metricsMs.M4.toFixed(3)}`,
        `M5=${result.metricsMs.M5.toFixed(3)}`,
      ].join(" "),
    )
  }
  catch (error) {
    result.status =
      "FAIL"

    result.error =
      (
        error
        instanceof Error
      )
        ? error.message
        : String(error)

    writeJson(
      resultPath,
      result,
    )

    writeJson(
      path.join(
        outputDir,
        "CAMPAIGN_FINAL.json",
      ),
      {
        status:
          "FAIL",

        completedObservations:
          completed,

        failedObservation:
          observationId,

        automaticRetry:
          false,

        failurePreserved:
          true,
      },
    )

    console.error(
      `OBSERVATION_FAIL ${observationId}: ${result.error}`,
    )

    process.exit(1)
  }
}

writeJson(
  path.join(
    outputDir,
    "CAMPAIGN_FINAL.json",
  ),
  {
    status:
      "PASS",

    completedObservations:
      completed,

    plannedObservations:
      plan.length,

    automaticRetry:
      false,

    onchainExecution:
      false,
  },
)

console.log(
  `CAMPAIGN_PASS observations=${completed}`
)
