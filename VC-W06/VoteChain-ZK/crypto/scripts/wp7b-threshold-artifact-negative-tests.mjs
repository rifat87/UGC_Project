import assert from "node:assert/strict"

import {
  readFile,
} from "node:fs/promises"

import {
  context,
} from "../src/wp2-core-final.mjs"

import {
  canonicalSha256,
  verifyDkgTranscript,
  verifyFinalizationTranscript,
} from "../src/wp6-threshold.mjs"

const [
  ,
  ,
  dkgFile,
  finalizationFile,
] = process.argv

if (
  !dkgFile ||
  !finalizationFile
) {
  throw new Error(
    "Usage: node wp7b-threshold-artifact-negative-tests.mjs <dkg-bundle> <finalization-transcript>",
  )
}

const dkgBundle =
  JSON.parse(
    await readFile(
      dkgFile,
      "utf8",
    ),
  )

const finalization =
  JSON.parse(
    await readFile(
      finalizationFile,
      "utf8",
    ),
  )

const c =
  await context()

function pass(
  name,
) {
  console.log(
    `[PASS] ${name}`,
  )
}

function clone(
  value,
) {
  return structuredClone(
    value,
  )
}

assert.equal(
  canonicalSha256(
    dkgBundle
      .transcript,
  ),
  dkgBundle
    .transcriptHash,
)

assert.equal(
  verifyDkgTranscript(
    c,
    dkgBundle
      .transcript,
  ),
  true,
)

pass(
  "accepted DKG transcript remains valid after WP7 hardening",
)

const baseline =
  await verifyFinalizationTranscript({
    c,
    transcript:
      finalization,
  })

assert.equal(
  baseline
    .transcriptHash
    .length,
  64,
)

pass(
  "accepted WP6B finalization transcript remains valid",
)

/*
 * DKG structural negatives.
 */
{
  const bad =
    clone(
      dkgBundle
        .transcript,
    )

  bad
    .participantCommitments[1]
    .trusteeId =
      bad
        .participantCommitments[0]
        .trusteeId

  assert.throws(
    () =>
      verifyDkgTranscript(
        c,
        bad,
      ),
  )

  pass(
    "duplicate DKG participant id rejected",
  )
}

{
  const bad =
    clone(
      dkgBundle
        .transcript,
    )

  bad
    .participantCommitments[0]
    .commitments
    .pop()

  assert.throws(
    () =>
      verifyDkgTranscript(
        c,
        bad,
      ),
  )

  pass(
    "wrong DKG polynomial commitment count rejected",
  )
}

{
  const bad =
    clone(
      dkgBundle
        .transcript,
    )

  bad.deliveryHashes =
    bad
      .deliveryHashes
      .slice(
        0,
        -1,
      )

  assert.throws(
    () =>
      verifyDkgTranscript(
        c,
        bad,
      ),
  )

  pass(
    "incomplete DKG delivery-hash matrix rejected",
  )
}

{
  const bad =
    clone(
      dkgBundle
        .transcript,
    )

  bad
    .deliveryHashes[1]
    .senderId =
      bad
        .deliveryHashes[0]
        .senderId

  bad
    .deliveryHashes[1]
    .recipientId =
      bad
        .deliveryHashes[0]
        .recipientId

  assert.throws(
    () =>
      verifyDkgTranscript(
        c,
        bad,
      ),
  )

  pass(
    "duplicate DKG delivery-hash pair rejected",
  )
}

{
  const bad =
    clone(
      dkgBundle
        .transcript,
    )

  bad
    .deliveryHashes[0]
    .sha256 =
      "not-a-sha256"

  assert.throws(
    () =>
      verifyDkgTranscript(
        c,
        bad,
      ),
  )

  pass(
    "malformed DKG delivery hash rejected",
  )
}

/*
 * Finalization transcript / DLEQ negatives.
 */
{
  const bad =
    clone(
      finalization,
    )

  bad.dkgTranscriptHash =
    "00".repeat(
      32,
    )

  await assert.rejects(
    () =>
      verifyFinalizationTranscript({
        c,
        transcript:
          bad,
      }),
  )

  pass(
    "mismatched embedded DKG transcript hash rejected",
  )
}

{
  const bad =
    clone(
      finalization,
    )

  bad.partialsBySlot =
    bad
      .partialsBySlot
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
  )

  pass(
    "fewer-than-threshold finalization rejected",
  )
}

{
  const bad =
    clone(
      finalization,
    )

  bad
    .partialsBySlot[0][0]
    .proof
    .response =
      (
        BigInt(
          bad
            .partialsBySlot[0][0]
            .proof
            .response,
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
  )

  pass(
    "tampered DLEQ response rejected",
  )
}

{
  const bad =
    clone(
      finalization,
    )

  bad.electionId =
    (
      BigInt(
        bad.electionId,
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
  )

  pass(
    "cross-election share replay rejected",
  )
}

{
  const bad =
    clone(
      finalization,
    )

  bad.partialsBySlot[0] = [
    clone(
      bad
        .partialsBySlot[0][0],
    ),

    clone(
      bad
        .partialsBySlot[0][0],
    ),

    clone(
      bad
        .partialsBySlot[0][1],
    ),
  ]

  await assert.rejects(
    () =>
      verifyFinalizationTranscript({
        c,
        transcript:
          bad,
      }),
  )

  pass(
    "duplicate trustee partial rejected",
  )
}

{
  const bad =
    clone(
      finalization,
    )

  bad
    .aggregateCiphertexts[0]
    .R =
      clone(
        bad
          .aggregateCiphertexts[1]
          .R,
      )

  await assert.rejects(
    () =>
      verifyFinalizationTranscript({
        c,
        transcript:
          bad,
      }),
  )

  pass(
    "aggregate-R substitution rejected by DLEQ binding",
  )
}

{
  const bad =
    clone(
      finalization,
    )

  bad.acceptedBallotCount =
    0

  await assert.rejects(
    () =>
      verifyFinalizationTranscript({
        c,
        transcript:
          bad,
      }),
  )

  pass(
    "tally outside accepted-ballot bound rejected",
  )
}

{
  const bad =
    clone(
      finalization,
    )

  bad.reportedTotals =
    Array.from(
      {
        length: 16,
      },
      () => 0,
    )

  await assert.rejects(
    () =>
      verifyFinalizationTranscript({
        c,
        transcript:
          bad,
      }),
  )

  pass(
    "reported plaintext tally mismatch rejected",
  )
}

console.log()
console.log(
  "STATUS=PASS_WP7B_THRESHOLD_ARTIFACT_NEGATIVE_MATRIX",
)
