#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import {
  pathToFileURL,
} from "node:url"
import {
  spawnSync,
} from "node:child_process"


const repoRoot =
  path.resolve(
    import.meta.dirname,
    "..",
    "..",
  )

const apiBase =
  (
    process.env
      .VOTECHAIN_API_BASE_URL ||
    "http://127.0.0.1:5000"
  )
    .replace(
      /\/$/,
      "",
    )


function fail(
  message,
) {
  throw new Error(
    message,
  )
}


function exists(
  file,
) {
  return fs.existsSync(
    file,
  )
}


function readJson(
  file,
) {
  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8",
    ),
  )
}


function writeJson(
  file,
  value,
) {
  fs.writeFileSync(
    file,
    JSON.stringify(
      value,
      null,
      2,
    ) + "\n",
    "utf8",
  )
}


function runCli(
  cli,
  args,
  label,
) {
  const result =
    spawnSync(
      process.execPath,
      [
        cli,
        ...args,
      ],
      {
        cwd:
          repoRoot,

        encoding:
          "utf8",

        stdio: [
          "ignore",
          "pipe",
          "pipe",
        ],
      },
    )

  if (
    result.status !==
      0
  ) {
    console.error(
      label +
        "=FAIL",
    )

    fail(
      label +
        "_FAILED",
    )
  }
}


const response =
  await fetch(
    apiBase +
      "/api/elections/current",
  )


if (
  !response.ok
) {
  fail(
    "CURRENT_ELECTION_LOOKUP_FAILED_HTTP_" +
      response.status,
  )
}


const payload =
  await response.json()

const election =
  payload?.data


if (
  !election?.electionId
) {
  fail(
    "CURRENT_ELECTION_NOT_FOUND",
  )
}


if (
  election.status !==
    "ended"
) {
  fail(
    "CURRENT_ELECTION_NOT_ENDED_STATUS_" +
      String(
        election.status,
      ),
  )
}


const electionId =
  String(
    election.electionId,
  )


const electionRoot =
  path.join(
    repoRoot,
    "crypto",
    ".local",
    "wp6-elections",
    electionId,
  )

const publicDir =
  path.join(
    electionRoot,
    "public",
  )

const custodyDir =
  path.join(
    electionRoot,
    "custody",
  )

const transcriptFile =
  path.join(
    publicDir,
    "dkg-public-transcript.json",
  )

const aggregateFile =
  path.join(
    publicDir,
    "encrypted-aggregate.json",
  )

const dkgInputFile =
  path.join(
    publicDir,
    "dkg-finalization-input.json",
  )

const partialDir =
  path.join(
    publicDir,
    "finalization-partials",
  )

const finalizationFile =
  path.join(
    publicDir,
    "finalization-transcript.json",
  )

const verifiedFile =
  path.join(
    publicDir,
    "finalization-verified.json",
  )

const cli =
  path.join(
    repoRoot,
    "crypto",
    "scripts",
    "wp6-trustee-cli.mjs",
  )


for (
  const requiredPath
  of [
    transcriptFile,
    aggregateFile,
    custodyDir,
    cli,
  ]
) {
  if (
    !exists(
      requiredPath,
    )
  ) {
    fail(
      "REQUIRED_PATH_MISSING=" +
        requiredPath,
    )
  }
}


const wp6Module =
  await import(
    pathToFileURL(
      path.join(
        repoRoot,
        "crypto",
        "src",
        "wp6-threshold.mjs",
      ),
    ).href,
  )


const coreModule =
  await import(
    pathToFileURL(
      path.join(
        repoRoot,
        "crypto",
        "src",
        "wp2-core-final.mjs",
      ),
    ).href,
  )


const {
  WP6,
  canonicalSha256,
  verifyDkgTranscript,
} =
  wp6Module


const c =
  await coreModule.context()

const transcript =
  readJson(
    transcriptFile,
  )

const aggregate =
  readJson(
    aggregateFile,
  )


verifyDkgTranscript(
  c,
  transcript,
)


const dkgHash =
  canonicalSha256(
    transcript,
  )


if (
  !/^[0-9a-f]{64}$/
    .test(
      dkgHash,
    )
) {
  fail(
    "CANONICAL_DKG_HASH_FORMAT_INVALID",
  )
}


if (
  String(
    aggregate.electionId,
  ) !==
    electionId
) {
  fail(
    "AGGREGATE_ELECTION_ID_MISMATCH",
  )
}


if (
  transcript.ceremonyId !==
    undefined &&
  String(
    transcript.ceremonyId,
  ) !==
    electionId
) {
  fail(
    "DKG_CEREMONY_ID_MISMATCH",
  )
}


const threshold =
  Number(
    WP6.threshold,
  )


if (
  !Number.isInteger(
    threshold,
  ) ||
  threshold <
    1
) {
  fail(
    "INVALID_WP6_THRESHOLD",
  )
}


const trusteeIds =
  Array.from(
    new Set(
      (
        transcript.trustees ||
        []
      )
        .map(
          trustee =>
            Number(
              trustee.trusteeId,
            ),
        )
        .filter(
          Number.isInteger,
        ),
    ),
  )
    .sort(
      (
        left,
        right,
      ) =>
        left -
        right,
    )


const completeTrustees =
  trusteeIds
    .filter(
      trusteeId => {
        const shareFile =
          path.join(
            custodyDir,
            "trustee-" +
              trusteeId +
              "-share.json",
          )

        const passphraseFile =
          path.join(
            custodyDir,
            "trustee-" +
              trusteeId +
              ".passphrase",
          )

        return (
          exists(
            shareFile,
          ) &&
          exists(
            passphraseFile,
          )
        )
      },
    )


if (
  completeTrustees.length <
    threshold
) {
  fail(
    "INSUFFICIENT_COMPLETE_TRUSTEE_CUSTODY_SETS",
  )
}


const selectedTrustees =
  completeTrustees
    .slice(
      0,
      threshold,
    )


fs.mkdirSync(
  partialDir,
  {
    recursive:
      true,
  },
)


writeJson(
  dkgInputFile,
  {
    transcript,

    /*
     * The WP6 finalization verifier expects
     * canonical raw 64-hex without a 0x prefix.
     */
    transcriptHash:
      dkgHash,
  },
)


let generatedPartials =
  0

let existingPartials =
  0


for (
  const trusteeId
  of selectedTrustees
) {
  const shareFile =
    path.join(
      custodyDir,
      "trustee-" +
        trusteeId +
        "-share.json",
    )

  const passphraseFile =
    path.join(
      custodyDir,
      "trustee-" +
        trusteeId +
        ".passphrase",
    )

  const outFile =
    path.join(
      partialDir,
      "trustee-" +
        trusteeId +
        ".json",
    )


  if (
    exists(
      outFile,
    )
  ) {
    existingPartials++
    continue
  }


  runCli(
    cli,
    [
      "partials",

      "--trustee-id",
      String(
        trusteeId,
      ),

      "--dkg",
      dkgInputFile,

      "--share-file",
      shareFile,

      "--aggregate",
      aggregateFile,

      "--passphrase-file",
      passphraseFile,

      "--ceremony-id",
      electionId,

      "--out",
      outFile,
    ],
    "TRUSTEE_" +
      trusteeId +
      "_PARTIALS",
  )


  generatedPartials++
}


runCli(
  cli,
  [
    "build-finalization",

    "--dkg",
    dkgInputFile,

    "--aggregate",
    aggregateFile,

    "--trustee-ids",
    selectedTrustees
      .join(
        ",",
      ),

    "--partials-dir",
    partialDir,

    "--out",
    finalizationFile,
  ],
  "FINALIZATION_BUILD",
)


runCli(
  cli,
  [
    "verify-finalization",

    "--input",
    finalizationFile,

    "--out",
    verifiedFile,
  ],
  "FINALIZATION_VERIFY",
)


const finalization =
  readJson(
    finalizationFile,
  )


if (
  String(
    finalization.electionId,
  ) !==
    electionId
) {
  fail(
    "FINALIZATION_ELECTION_ID_MISMATCH",
  )
}


if (
  finalization.dkgTranscriptHash !==
    dkgHash
) {
  fail(
    "FINALIZATION_DKG_HASH_MISMATCH",
  )
}


const verified =
  readJson(
    verifiedFile,
  )


console.log(
  "CURRENT_ELECTION=FOUND",
)

console.log(
  "ELECTION_STATUS=" +
    election.status,
)

console.log(
  "DKG_VERIFY=PASS",
)

console.log(
  "DKG_HASH_BINDING=PASS",
)

console.log(
  "AGGREGATE_BINDING=PASS",
)

console.log(
  "THRESHOLD=" +
    threshold,
)

console.log(
  "AVAILABLE_COMPLETE_TRUSTEES=" +
    completeTrustees.length,
)

console.log(
  "SELECTED_TRUSTEE_IDS=" +
    selectedTrustees
      .join(
        ",",
      ),
)

console.log(
  "EXISTING_PARTIALS_FOUND=" +
    existingPartials,
)

console.log(
  "TRUSTEE_PARTIALS_GENERATED=" +
    generatedPartials,
)

console.log(
  "FINALIZATION_TRANSCRIPT_BUILD=PASS",
)

console.log(
  "FINALIZATION_DKG_HASH_FORMAT=PASS",
)

console.log(
  "FINALIZATION_DKG_HASH_HAS_0X_PREFIX=NO",
)

console.log(
  "FINALIZATION_TRANSCRIPT_VERIFY=PASS",
)

console.log(
  "FINALIZATION_TRANSCRIPT_HASH=" +
    String(
      verified.transcriptHash,
    ),
)

console.log(
  "PLAINTEXT_TOTALS_PRINTED=NO",
)

console.log(
  "TRUSTEE_PASSPHRASES_PRINTED=NO",
)

console.log(
  "TRUSTEE_SECRET_SHARES_PRINTED=NO",
)

console.log(
  "DATABASE_WRITES=NO",
)

console.log(
  "BLOCKCHAIN_FINALIZATION_PERFORMED=NO",
)
