import assert from "node:assert/strict"
import {
  mkdir,
  writeFile,
} from "node:fs/promises"
import {
  resolve,
} from "node:path"
import {
  performance,
} from "node:perf_hooks"
import {
  randomBytes,
} from "node:crypto"

import {
  addEncryptedBallot,
  context,
  encryptBit,
  mul,
  zeroTally,
} from "../src/wp2-core-final.mjs"

import {
  WP6,
  boundedDecodeBsgs,
  buildDkgTranscript,
  canonicalSha256,
  createDkgContribution,
  createPartialRecord,
  createTrusteeTransportIdentity,
  deriveTrusteeShare,
  openTrusteeShare,
  randomScalar,
  serializeCiphertext,
  verifyDkgTranscript,
  verifyFinalizationTranscript,
} from "../src/wp6-threshold.mjs"

const [
  ,
  ,
  evidenceArg,
  runId,
] = process.argv

if (
  !evidenceArg ||
  !runId
) {
  throw new Error(
    "Usage: node wp6a-threshold-functional-run.mjs <evidence-dir> <run-id>",
  )
}

const evidence =
  resolve(
    evidenceArg,
  )

await mkdir(
  evidence,
  {
    recursive: true,
  },
)

const c =
  await context()

const ceremonyId =
  `VoteChain-ZK/WP6/${runId}`

const electionId =
  "202610010006"

const threshold =
  WP6.threshold

const trusteeCount =
  WP6.trusteeCount

const candidateCount =
  4

const maxCandidates =
  WP6.maxCandidates

const expectedTotals = [
  3,
  2,
  2,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]

const selectedSlots = [
  0,
  1,
  2,
  0,
  3,
  2,
  0,
  1,
]

const acceptedBallotCount =
  selectedSlots.length

const testResults = []

async function check(
  name,
  fn,
) {
  try {
    await fn()

    testResults.push({
      test: name,
      status: "PASS",
    })

    console.log(
      `[PASS] ${name}`,
    )
  } catch (error) {
    testResults.push({
      test: name,
      status: "FAIL",
      error:
        error instanceof Error
          ? error.message
          : String(error),
    })

    throw error
  }
}

const passphrases =
  Array.from(
    {
      length:
        trusteeCount,
    },
    () =>
      randomBytes(32)
        .toString(
          "base64url",
        ),
  )

const identities =
  []

for (
  let trusteeId = 1;
  trusteeId <=
    trusteeCount;
  trusteeId += 1
) {
  identities.push(
    createTrusteeTransportIdentity({
      trusteeId,

      passphrase:
        passphrases[
          trusteeId - 1
        ],

      ceremonyId,
    }),
  )
}

const roster =
  identities.map(
    identity =>
      identity
        .publicIdentity,
  )

const dkgStart =
  performance.now()

const contributions =
  []

for (
  let trusteeId = 1;
  trusteeId <=
    trusteeCount;
  trusteeId += 1
) {
  contributions.push(
    createDkgContribution({
      c,
      trusteeId,
      threshold,
      trusteeCount,
      roster,
      ceremonyId,
    }),
  )
}

const derivedShares =
  []

for (
  let trusteeId = 1;
  trusteeId <=
    trusteeCount;
  trusteeId += 1
) {
  derivedShares.push(
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

      contributionBundles:
        contributions,
    }),
  )
}

const {
  transcript:
    dkgTranscript,

  transcriptHash:
    dkgTranscriptHash,
} =
  buildDkgTranscript({
    c,
    ceremonyId,
    threshold,
    trusteeCount,
    roster,
    contributionBundles:
      contributions,
    derivedShares,
  })

const dkgMs =
  performance.now() -
  dkgStart

await check(
  "public DKG transcript verifies",
  async () => {
    assert.equal(
      verifyDkgTranscript(
        c,
        dkgTranscript,
      ),
      true,
    )
  },
)

await check(
  "public DKG transcript hash deterministic",
  async () => {
    assert.equal(
      canonicalSha256(
        dkgTranscript,
      ),
      dkgTranscriptHash,
    )

    assert.equal(
      canonicalSha256(
        dkgTranscript,
      ),
      canonicalSha256(
        dkgTranscript,
      ),
    )
  },
)

await check(
  "combined private election key not present in transcript",
  async () => {
    const forbiddenExactKeys =
      new Set([
        "secret",
        "privateKey",
        "share",
        "coefficients",
        "polynomial",
      ])

    function scan(
      value,
    ) {
      if (
        !value ||
        typeof value !==
          "object"
      ) {
        return
      }

      if (
        Array.isArray(value)
      ) {
        value.forEach(
          scan,
        )

        return
      }

      for (
        const [
          key,
          child,
        ] of Object.entries(
          value,
        )
      ) {
        assert.equal(
          forbiddenExactKeys.has(
            key,
          ),
          false,
          `forbidden private key material field: ${key}`,
        )

        scan(
          child,
        )
      }
    }

    scan(
      dkgTranscript,
    )
  },
)

await mkdir(
  resolve(
    evidence,
    "trustee-custody",
  ),
  {
    recursive: true,
  },
)

for (
  let trusteeId = 1;
  trusteeId <=
    trusteeCount;
  trusteeId += 1
) {
  const custodyArtifact = {
    version:
      "VoteChain-ZK-WP6-Trustee-Custody-v1",

    trusteeId,

    transportPrivateKeyCustody:
      identities[
        trusteeId - 1
      ].privateCustody,

    decryptionShareCustody:
      derivedShares[
        trusteeId - 1
      ].encryptedShareCustody,

    publicShare:
      derivedShares[
        trusteeId - 1
      ].publicShare,
  }

  await writeFile(
    resolve(
      evidence,
      "trustee-custody",
      `trustee-${trusteeId}.json`,
    ),
    JSON.stringify(
      custodyArtifact,
      null,
      2,
    ) + "\n",
    {
      mode: 0o600,
    },
  )
}

await writeFile(
  resolve(
    evidence,
    "encrypted-dkg-deliveries.json",
  ),
  JSON.stringify(
    contributions.map(
      bundle => ({
        publicContribution:
          bundle.publicContribution,

        deliveries:
          bundle.deliveries,
      }),
    ),
    null,
    2,
  ) + "\n",
)

await writeFile(
  resolve(
    evidence,
    "dkg-public-transcript.json",
  ),
  JSON.stringify(
    dkgTranscript,
    null,
    2,
  ) + "\n",
)

const tally =
  zeroTally(
    c,
    maxCandidates,
  )

let aggregate =
  tally

for (
  const selected
  of selectedSlots
) {
  const ballot =
    []

  for (
    let slot = 0;
    slot <
      maxCandidates;
    slot += 1
  ) {
    ballot.push(
      encryptBit(
        c,
        [
          c.F.e(
            BigInt(
              dkgTranscript
                .publicKey[0],
            ),
          ),
          c.F.e(
            BigInt(
              dkgTranscript
                .publicKey[1],
            ),
          ),
        ],
        slot ===
          selected
          ? 1
          : 0,
        randomScalar(
          c.q,
        ),
      ),
    )
  }

  aggregate =
    addEncryptedBallot(
      c,
      aggregate,
      ballot,
    )
}

const aggregateCiphertexts =
  aggregate.map(
    ciphertext =>
      serializeCiphertext(
        c,
        ciphertext,
      ),
  )

const activeTrustees = [
  1,
  3,
  5,
]

const partialStart =
  performance.now()

const partialsBySlot =
  Array.from(
    {
      length:
        maxCandidates,
    },
    () => [],
  )

for (
  const trusteeId
  of activeTrustees
) {
  const share =
    openTrusteeShare({
      custody:
        derivedShares[
          trusteeId - 1
        ].encryptedShareCustody,

      trusteeId,

      passphrase:
        passphrases[
          trusteeId - 1
        ],

      ceremonyId,
    })

  for (
    let slot = 0;
    slot <
      maxCandidates;
    slot += 1
  ) {
    const record =
      await createPartialRecord({
        c,
        electionId,
        trusteeId,
        slot,
        share,

        publicShare:
          derivedShares[
            trusteeId - 1
          ].publicShare,

        aggregateR:
          aggregateCiphertexts[
            slot
          ].R,
      })

    partialsBySlot[
      slot
    ].push(
      record,
    )
  }
}

const partialGenerationMs =
  performance.now() -
  partialStart

const finalizationTranscript = {
  version:
    WP6.finalizationVersion,

  electionId,

  candidateCount,

  acceptedBallotCount,

  dkgTranscript,

  dkgTranscriptHash,

  aggregateCiphertexts,

  partialsBySlot,

  reportedTotals:
    expectedTotals,
}

const verifyStart =
  performance.now()

const verified =
  await verifyFinalizationTranscript({
    c,
    transcript:
      finalizationTranscript,
  })

const finalizationVerifyMs =
  performance.now() -
  verifyStart

await check(
  "3-of-5 valid trustee finalization",
  async () => {
    assert.deepEqual(
      verified.totals,
      expectedTotals,
    )
  },
)

await check(
  "two unavailable trustees tolerated",
  async () => {
    assert.deepEqual(
      activeTrustees,
      [
        1,
        3,
        5,
      ],
    )

    assert.equal(
      verified
        .rejectedBySlot
        .every(
          rejected =>
            rejected.length ===
              0,
        ),
      true,
    )
  },
)

await check(
  "fewer than threshold rejected",
  async () => {
    const bad =
      structuredClone(
        finalizationTranscript,
      )

    bad.partialsBySlot =
      bad.partialsBySlot
        .map(
          records =>
            records.slice(
              0,
              2,
            ),
        )

    await assert.rejects(
      () =>
        verifyFinalizationTranscript({
          c,
          transcript:
            bad,
        }),
      /at least 3 valid shares/,
    )
  },
)

await check(
  "tampered DLEQ proof rejected",
  async () => {
    const bad =
      structuredClone(
        finalizationTranscript,
      )

    bad
      .partialsBySlot[0][0]
      .proof
      .response =
        (
          (
            BigInt(
              bad
                .partialsBySlot[0][0]
                .proof
                .response,
            ) +
            1n
          ) %
          c.q
        ).toString()

    await assert.rejects(
      () =>
        verifyFinalizationTranscript({
          c,
          transcript:
            bad,
        }),
      /at least 3 valid shares/,
    )
  },
)

await check(
  "wrong election context rejected",
  async () => {
    const bad =
      structuredClone(
        finalizationTranscript,
      )

    bad.electionId =
      (
        BigInt(
          electionId,
        ) +
        1n
      ).toString()

    await assert.rejects(
      () =>
        verifyFinalizationTranscript({
          c,
          transcript:
            bad,
        }),
      /at least 3 valid shares/,
    )
  },
)

await check(
  "duplicate trustee record rejected",
  async () => {
    const bad =
      structuredClone(
        finalizationTranscript,
      )

    bad
      .partialsBySlot[0]
      .push(
        structuredClone(
          bad
            .partialsBySlot[0][0],
        ),
      )

    await assert.rejects(
      () =>
        verifyFinalizationTranscript({
          c,
          transcript:
            bad,
        }),
      /duplicate trustee/,
    )
  },
)

await check(
  "bounded BSGS rejects outside accepted ballot bound",
  async () => {
    assert.throws(
      () =>
        boundedDecodeBsgs(
          c,
          mul(
            c,
            c.G,
            BigInt(
              acceptedBallotCount +
              1,
            ),
          ),
          acceptedBallotCount,
        ),
      /outside tally bound/,
    )
  },
)

await check(
  "padded candidate slots decode to zero",
  async () => {
    assert.equal(
      verified
        .totals
        .slice(
          candidateCount,
        )
        .every(
          value =>
            value === 0,
        ),
      true,
    )
  },
)

await check(
  "verified totals sum to accepted ballot count",
  async () => {
    const sum =
      verified
        .totals
        .slice(
          0,
          candidateCount,
        )
        .reduce(
          (
            acc,
            value,
          ) =>
            acc +
            value,
          0,
        )

    assert.equal(
      sum,
      acceptedBallotCount,
    )
  },
)

await check(
  "finalization transcript hash changes on mutation",
  async () => {
    const original =
      canonicalSha256(
        finalizationTranscript,
      )

    const mutated =
      structuredClone(
        finalizationTranscript,
      )

    mutated.auditMutation =
      "test"

    assert.notEqual(
      canonicalSha256(
        mutated,
      ),
      original,
    )
  },
)

await writeFile(
  resolve(
    evidence,
    "finalization-transcript.json",
  ),
  JSON.stringify(
    finalizationTranscript,
    null,
    2,
  ) + "\n",
)

await writeFile(
  resolve(
    evidence,
    "security-tests.json",
  ),
  JSON.stringify(
    testResults,
    null,
    2,
  ) + "\n",
)

const result = {
  status:
    "PASS_WP6A_THRESHOLD_CORE_CUSTODY",

  runId,

  classification:
    "FUNCTIONAL_SMOKE_ONLY_NOT_FINAL_BENCHMARK",

  threshold,
  trusteeCount,

  activeTrustees,

  unavailableTrustees: [
    2,
    4,
  ],

  candidateCount,

  maxCandidates,

  acceptedBallotCount,

  expectedTotals,

  verifiedTotals:
    verified.totals,

  dkgTranscriptHash,

  finalizationTranscriptHash:
    verified
      .transcriptHash,

  publicKey:
    dkgTranscript
      .publicKey,

  metrics: {
    samples: 1,
    dkgMs,
    partialGenerationMs,
    finalizationVerifyMs,
  },

  architecture: {
    combinedPrivateKeyMaterialized:
      false,

    plaintextTrusteeSharePersisted:
      false,

    encryptedCustody:
      "scrypt + AES-256-GCM",

    encryptedShareTransport:
      "ECDH-P256 + HKDF-SHA256 + AES-256-GCM",

    shareProof:
      "context-bound DLEQ/Chaum-Pedersen",

    decode:
      "bounded baby-step/giant-step",
  },

  testResults,

  next:
    "WP6B_TRUSTEE_CLI_AND_CONTRACT_FINALIZATION",
}

await writeFile(
  resolve(
    evidence,
    "wp6a-result.json",
  ),
  JSON.stringify(
    result,
    null,
    2,
  ) + "\n",
)

console.log()
console.log(
  "WP6A_MULTI_PARTY_DKG_CORE=PASS",
)

console.log(
  "WP6A_PUBLIC_DKG_TRANSCRIPT=PASS",
)

console.log(
  "WP6A_ENCRYPTED_SHARE_TRANSPORT=PASS",
)

console.log(
  "WP6A_ENCRYPTED_TRUSTEE_CUSTODY=PASS",
)

console.log(
  "WP6A_COMBINED_PRIVATE_KEY_MATERIALIZED=NO",
)

console.log(
  "WP6A_CONTEXT_BOUND_DLEQ=PASS",
)

console.log(
  "WP6A_VALID_3_OF_5_FINALIZATION=PASS",
)

console.log(
  "WP6A_TWO_TRUSTEE_OUTAGE_TOLERATED=PASS",
)

console.log(
  "WP6A_INSUFFICIENT_2_OF_5_REJECTED=PASS",
)

console.log(
  "WP6A_TAMPERED_SHARE_PROOF_REJECTED=PASS",
)

console.log(
  "WP6A_BOUNDED_BSGS=PASS",
)

console.log(
  "WP6A_TOTALS_MATCH_SYNTHETIC_TRUTH=PASS",
)

console.log(
  `WP6A_DKG_MS=${dkgMs}`,
)

console.log(
  `WP6A_PARTIAL_GENERATION_MS=${partialGenerationMs}`,
)

console.log(
  `WP6A_FINALIZATION_VERIFY_MS=${finalizationVerifyMs}`,
)

console.log(
  "STATUS=PASS_WP6A_THRESHOLD_CORE_CUSTODY",
)
