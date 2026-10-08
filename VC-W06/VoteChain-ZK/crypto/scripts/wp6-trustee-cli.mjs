#!/usr/bin/env node

import {
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises"

import {
  dirname,
  join,
  resolve,
} from "node:path"

import {
  addEncryptedBallot,
  context,
  encryptBit,
  zeroTally,
} from "../src/wp2-core-final.mjs"

import {
  WP6,
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

function parseArgs(
  argv,
) {
  const out = {}

  for (
    let i = 0;
    i < argv.length;
    i++
  ) {
    const key =
      argv[i]

    if (
      !key.startsWith(
        "--",
      )
    ) {
      throw new Error(
        `Unexpected argument: ${key}`,
      )
    }

    const name =
      key.slice(2)

    const value =
      argv[
        i + 1
      ]

    if (
      value === undefined ||
      value.startsWith(
        "--",
      )
    ) {
      throw new Error(
        `Missing value for --${name}`,
      )
    }

    out[name] =
      value

    i++
  }

  return out
}

function required(
  args,
  name,
) {
  const value =
    args[name]

  if (
    value === undefined ||
    value === ""
  ) {
    throw new Error(
      `Missing --${name}`,
    )
  }

  return value
}

async function readJson(
  file,
) {
  return JSON.parse(
    await readFile(
      resolve(file),
      "utf8",
    ),
  )
}

async function writeJson(
  file,
  value,
) {
  const target =
    resolve(file)

  await mkdir(
    dirname(
      target,
    ),
    {
      recursive: true,
    },
  )

  await writeFile(
    target,
    JSON.stringify(
      value,
      null,
      2,
    ) + "\n",
    "utf8",
  )
}

async function passphrase(
  file,
) {
  const value =
    (
      await readFile(
        resolve(file),
        "utf8",
      )
    ).trim()

  if (
    value.length < 16
  ) {
    throw new Error(
      "passphrase file too short",
    )
  }

  return value
}

async function orderedJsonFiles(
  directory,
) {
  const root =
    resolve(
      directory,
    )

  const files =
    (
      await readdir(
        root,
      )
    )
      .filter(
        name =>
          name.endsWith(
            ".json",
          ),
      )
      .sort(
        (
          a,
          b,
        ) =>
          a.localeCompare(
            b,
            undefined,
            {
              numeric: true,
            },
          ),
      )

  return Promise.all(
    files.map(
      file =>
        readJson(
          join(
            root,
            file,
          ),
        ),
    ),
  )
}

function publicKeyPoint(
  c,
  serialized,
) {
  return [
    c.F.e(
      BigInt(
        serialized[0],
      ),
    ),

    c.F.e(
      BigInt(
        serialized[1],
      ),
    ),
  ]
}

const command =
  process.argv[2]

const args =
  parseArgs(
    process.argv.slice(
      3,
    ),
  )

const c =
  await context()

switch (
  command
) {
  case "init": {
    const trusteeId =
      Number(
        required(
          args,
          "trustee-id",
        ),
      )

    const ceremonyId =
      required(
        args,
        "ceremony-id",
      )

    const secret =
      await passphrase(
        required(
          args,
          "passphrase-file",
        ),
      )

    const identity =
      createTrusteeTransportIdentity({
        trusteeId,
        passphrase:
          secret,
        ceremonyId,
      })

    await writeJson(
      required(
        args,
        "out",
      ),
      identity,
    )

    console.log(
      `TRUSTEE_INIT_${trusteeId}=PASS`,
    )

    break
  }

  case "build-roster": {
    const identities =
      await orderedJsonFiles(
        required(
          args,
          "identities-dir",
        ),
      )

    const roster =
      identities.map(
        item =>
          item.publicIdentity,
      )

    await writeJson(
      required(
        args,
        "out",
      ),
      roster,
    )

    console.log(
      `TRUSTEE_ROSTER_COUNT=${roster.length}`,
    )

    break
  }

  case "contribute": {
    const trusteeId =
      Number(
        required(
          args,
          "trustee-id",
        ),
      )

    const threshold =
      Number(
        args.threshold ??
        WP6.threshold,
      )

    const trusteeCount =
      Number(
        args.trustees ??
        WP6.trusteeCount,
      )

    const roster =
      await readJson(
        required(
          args,
          "roster",
        ),
      )

    const bundle =
      createDkgContribution({
        c,
        trusteeId,
        threshold,
        trusteeCount,
        roster,

        ceremonyId:
          required(
            args,
            "ceremony-id",
          ),
      })

    await writeJson(
      required(
        args,
        "out",
      ),
      bundle,
    )

    console.log(
      `TRUSTEE_DKG_CONTRIBUTION_${trusteeId}=PASS`,
    )

    break
  }

  case "derive-share": {
    const trusteeId =
      Number(
        required(
          args,
          "trustee-id",
        ),
      )

    const identity =
      await readJson(
        required(
          args,
          "identity",
        ),
      )

    const contributions =
      await orderedJsonFiles(
        required(
          args,
          "contributions-dir",
        ),
      )

    const derived =
      deriveTrusteeShare({
        c,
        trusteeId,

        threshold:
          Number(
            args.threshold ??
            WP6.threshold,
          ),

        trusteeCount:
          Number(
            args.trustees ??
            WP6.trusteeCount,
          ),

        ceremonyId:
          required(
            args,
            "ceremony-id",
          ),

        identity,

        passphrase:
          await passphrase(
            required(
              args,
              "passphrase-file",
            ),
          ),

        contributionBundles:
          contributions,
      })

    await writeJson(
      required(
        args,
        "out",
      ),
      derived,
    )

    console.log(
      `TRUSTEE_DERIVE_SHARE_${trusteeId}=PASS`,
    )

    break
  }

  case "build-transcript": {
    const roster =
      await readJson(
        required(
          args,
          "roster",
        ),
      )

    const contributions =
      await orderedJsonFiles(
        required(
          args,
          "contributions-dir",
        ),
      )

    const shares =
      await orderedJsonFiles(
        required(
          args,
          "shares-dir",
        ),
      )

    const built =
      buildDkgTranscript({
        c,

        ceremonyId:
          required(
            args,
            "ceremony-id",
          ),

        threshold:
          Number(
            args.threshold ??
            WP6.threshold,
          ),

        trusteeCount:
          Number(
            args.trustees ??
            WP6.trusteeCount,
          ),

        roster,

        contributionBundles:
          contributions,

        derivedShares:
          shares,
      })

    await writeJson(
      required(
        args,
        "out",
      ),
      built,
    )

    console.log(
      "DKG_TRANSCRIPT_BUILD=PASS",
    )

    console.log(
      `DKG_TRANSCRIPT_HASH=${built.transcriptHash}`,
    )

    break
  }

  case "verify-dkg": {
    const bundle =
      await readJson(
        required(
          args,
          "input",
        ),
      )

    if (
      canonicalSha256(
        bundle.transcript,
      ) !==
        bundle.transcriptHash
    ) {
      throw new Error(
        "DKG transcript hash mismatch",
      )
    }

    if (
      !verifyDkgTranscript(
        c,
        bundle.transcript,
      )
    ) {
      throw new Error(
        "DKG transcript verification failed",
      )
    }

    console.log(
      "DKG_TRANSCRIPT_VERIFY=PASS",
    )

    break
  }

  case "make-ballots": {
    const bundle =
      await readJson(
        required(
          args,
          "dkg",
        ),
      )

    verifyDkgTranscript(
      c,
      bundle.transcript,
    )

    const candidateCount =
      Number(
        required(
          args,
          "candidate-count",
        ),
      )

    const selections =
      required(
        args,
        "selections",
      )
        .split(",")
        .map(
          value =>
            Number(
              value.trim(),
            ),
        )

    if (
      candidateCount < 1 ||
      candidateCount >
        WP6.maxCandidates
    ) {
      throw new Error(
        "invalid candidate count",
      )
    }

    for (
      const selected
      of selections
    ) {
      if (
        !Number.isInteger(
          selected,
        ) ||
        selected < 0 ||
        selected >=
          candidateCount
      ) {
        throw new Error(
          `invalid selected slot: ${selected}`,
        )
      }
    }

    const Y =
      publicKeyPoint(
        c,
        bundle
          .transcript
          .publicKey,
      )

    let tally =
      zeroTally(
        c,
        WP6.maxCandidates,
      )

    const ballots = []

    const expectedTotals =
      Array.from(
        {
          length:
            WP6.maxCandidates,
        },
        () => 0,
      )

    for (
      const selected
      of selections
    ) {
      const encrypted = []

      for (
        let slot = 0;
        slot <
          WP6.maxCandidates;
        slot++
      ) {
        encrypted.push(
          encryptBit(
            c,
            Y,
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

      expectedTotals[
        selected
      ]++

      tally =
        addEncryptedBallot(
          c,
          tally,
          encrypted,
        )

      const serialized =
        encrypted.map(
          item =>
            serializeCiphertext(
              c,
              item,
            ),
        )

      ballots.push({
        rx:
          serialized.map(
            item =>
              item.R[0],
          ),

        ry:
          serialized.map(
            item =>
              item.R[1],
          ),

        sx:
          serialized.map(
            item =>
              item.S[0],
          ),

        sy:
          serialized.map(
            item =>
              item.S[1],
          ),
      })
    }

    await writeJson(
      required(
        args,
        "out",
      ),
      {
        candidateCount,
        selections,
        expectedTotals,
        ballots,

        expectedAggregateCiphertexts:
          tally.map(
            item =>
              serializeCiphertext(
                c,
                item,
              ),
          ),
      },
    )

    console.log(
      "SYNTHETIC_ENCRYPTED_BALLOTS_BUILD=PASS",
    )

    break
  }

  case "partials": {
    const trusteeId =
      Number(
        required(
          args,
          "trustee-id",
        ),
      )

    const dkg =
      await readJson(
        required(
          args,
          "dkg",
        ),
      )

    verifyDkgTranscript(
      c,
      dkg.transcript,
    )

    const shareFile =
      await readJson(
        required(
          args,
          "share-file",
        ),
      )

    const aggregate =
      await readJson(
        required(
          args,
          "aggregate",
        ),
      )

    const trustee =
      dkg
        .transcript
        .trustees
        .find(
          item =>
            Number(
              item.trusteeId,
            ) ===
              trusteeId,
        )

    if (!trustee) {
      throw new Error(
        "trustee absent from DKG transcript",
      )
    }

    const share =
      openTrusteeShare({
        custody:
          shareFile
            .encryptedShareCustody,

        trusteeId,

        passphrase:
          await passphrase(
            required(
              args,
              "passphrase-file",
            ),
          ),

        ceremonyId:
          required(
            args,
            "ceremony-id",
          ),
      })

    const records = []

    for (
      let slot = 0;
      slot <
        aggregate
          .aggregateCiphertexts
          .length;
      slot++
    ) {
      records.push(
        await createPartialRecord({
          c,

          electionId:
            aggregate
              .electionId,

          trusteeId,
          slot,
          share,

          publicShare:
            trustee
              .publicShare,

          aggregateR:
            aggregate
              .aggregateCiphertexts[
                slot
              ].R,
        }),
      )
    }

    await writeJson(
      required(
        args,
        "out",
      ),
      {
        trusteeId,
        records,
      },
    )

    console.log(
      `TRUSTEE_PARTIALS_${trusteeId}=PASS`,
    )

    break
  }

  case "build-finalization": {
    const dkg =
      await readJson(
        required(
          args,
          "dkg",
        ),
      )

    const aggregate =
      await readJson(
        required(
          args,
          "aggregate",
        ),
      )

    const trusteeIds =
      required(
        args,
        "trustee-ids",
      )
        .split(",")
        .map(
          value =>
            Number(
              value.trim(),
            ),
        )

    const partialDir =
      resolve(
        required(
          args,
          "partials-dir",
        ),
      )

    const partialFiles =
      await Promise.all(
        trusteeIds.map(
          id =>
            readJson(
              join(
                partialDir,
                `trustee-${id}.json`,
              ),
            ),
        ),
      )

    const partialsBySlot =
      Array.from(
        {
          length:
            WP6.maxCandidates,
        },
        () => [],
      )

    for (
      const file
      of partialFiles
    ) {
      for (
        const record
        of file.records
      ) {
        partialsBySlot[
          Number(
            record.slot,
          )
        ].push(
          record,
        )
      }
    }

    const transcript = {
      version:
        WP6.finalizationVersion,

      electionId:
        String(
          aggregate
            .electionId,
        ),

      candidateCount:
        Number(
          aggregate
            .candidateCount,
        ),

      acceptedBallotCount:
        Number(
          aggregate
            .acceptedBallotCount,
        ),

      dkgTranscript:
        dkg.transcript,

      dkgTranscriptHash:
        dkg.transcriptHash,

      aggregateCiphertexts:
        aggregate
          .aggregateCiphertexts,

      partialsBySlot,
    }

    await writeJson(
      required(
        args,
        "out",
      ),
      transcript,
    )

    console.log(
      "FINALIZATION_TRANSCRIPT_BUILD=PASS",
    )

    break
  }

  case "verify-finalization": {
    const transcript =
      await readJson(
        required(
          args,
          "input",
        ),
      )

    const verified =
      await verifyFinalizationTranscript({
        c,
        transcript,
      })

    const result = {
      status:
        "PASS_WP6_FINALIZATION_TRANSCRIPT_VERIFY",

      totals:
        verified.totals,

      rejectedBySlot:
        verified
          .rejectedBySlot,

      transcriptHash:
        verified
          .transcriptHash,
    }

    await writeJson(
      required(
        args,
        "out",
      ),
      result,
    )

    console.log(
      "FINALIZATION_TRANSCRIPT_VERIFY=PASS",
    )

    console.log(
      `FINALIZATION_TRANSCRIPT_HASH=${result.transcriptHash}`,
    )

    console.log(
      `VERIFIED_TOTALS=${result.totals.join(",")}`,
    )

    break
  }

  default:
    throw new Error(
      `Unknown WP6 trustee command: ${command}`,
    )
}
