import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises"

import {
  dirname,
  resolve,
} from "node:path"

import {
  fileURLToPath,
} from "node:url"

import {
  Contract,
  getAddress,
} from "ethers"

import Election
  from "../../models/Election.js"

import {
  getRuntimeElection,
} from "./electionRuntimeService.js"

import {
  getWp5ContractAbi,
  getWp5Provider,
} from "../../utils/wp5Contract.js"

import {
  context,
} from "../../../crypto/src/wp2-core-final.mjs"

import {
  canonicalSha256,
  verifyDkgTranscript,
  verifyFinalizationTranscript,
} from "../../../crypto/src/wp6-threshold.mjs"


const MAX_CANDIDATES =
  16

const HERE =
  dirname(
    fileURLToPath(
      import.meta.url,
    ),
  )

const CRYPTO_ROOT =
  resolve(
    HERE,
    "../../../crypto",
  )


function lifecycleError(
  code,
  message,
  httpStatus = 409,
) {
  const error =
    new Error(
      message,
    )

  error.code =
    code

  error.httpStatus =
    httpStatus

  return error
}


function normalizedHash(
  value,
  label,
) {
  const raw =
    String(
      value ??
      "",
    )
      .trim()
      .toLowerCase()
      .replace(
        /^0x/,
        "",
      )

  if (
    !/^[0-9a-f]{64}$/
      .test(
        raw,
      )
  ) {
    throw lifecycleError(
      "INVALID_HASH",
      `${label} is not a canonical SHA-256/bytes32 value`,
      400,
    )
  }

  return raw
}


function publicDirectory(
  electionId,
) {
  return resolve(
    CRYPTO_ROOT,
    ".local",
    "wp6-elections",
    String(
      electionId,
    ),
    "public",
  )
}


export function localAggregateFile(
  electionId,
) {
  return resolve(
    publicDirectory(
      electionId,
    ),
    "encrypted-aggregate.json",
  )
}


export function localFinalizationTranscriptFile(
  electionId,
) {
  return resolve(
    publicDirectory(
      electionId,
    ),
    "finalization-transcript.json",
  )
}


async function writePublicJson(
  file,
  value,
) {
  await mkdir(
    dirname(
      file,
    ),
    {
      recursive:
        true,
    },
  )

  await writeFile(
    file,
    JSON.stringify(
      value,
      null,
      2,
    ) + "\n",
    "utf8",
  )
}


export async function loadLocalFinalizationTranscript(
  electionId,
) {
  try {
    return JSON.parse(
      await readFile(
        localFinalizationTranscriptFile(
          electionId,
        ),
        "utf8",
      ),
    )
  } catch (error) {
    throw lifecycleError(
      "FINALIZATION_TRANSCRIPT_NOT_READY",
      "The public WP6 finalization transcript has not been prepared for this election",
      409,
    )
  }
}


async function currentElection(
  electionId,
) {
  const election =
    await getRuntimeElection({
      electionId,
    })


  if (!election) {
    throw lifecycleError(
      "ELECTION_NOT_FOUND",
      "The requested current election does not exist",
      404,
    )
  }


  return election
}


async function directContext(
  election,
) {
  if (
    !election
      .directContractAddress
      ?.trim()
  ) {
    throw lifecycleError(
      "DIRECT_CONTRACT_MISSING",
      "Current election has no VoteChainDirect deployment",
    )
  }

  if (
    !election
      .adminAddress
      ?.trim()
  ) {
    throw lifecycleError(
      "ELECTION_ADMIN_MISSING",
      "Current election has no administrator address",
    )
  }

  const provider =
    getWp5Provider()

  const network =
    await provider
      .getNetwork()

  if (
    election.chainId &&
    String(
      network.chainId,
    ) !==
      String(
        election.chainId,
      )
  ) {
    throw lifecycleError(
      "CHAIN_ID_MISMATCH",
      "Election chainId does not match the connected RPC network",
    )
  }

  const address =
    getAddress(
      election
        .directContractAddress,
    )

  const code =
    await provider
      .getCode(
        address,
      )

  if (
    !code ||
    code === "0x"
  ) {
    throw lifecycleError(
      "CHAIN_STATE_LOST",
      "VoteChainDirect has no bytecode on the connected chain",
    )
  }

  const abi =
    getWp5ContractAbi()

  const readOnly =
    new Contract(
      address,
      abi,
      provider,
    )

  const [
    contractElectionId,
    contractAdmin,
  ] =
    await Promise.all([
      readOnly
        .electionId(),

      readOnly
        .admin(),
    ])

  if (
    BigInt(
      contractElectionId,
    ) !==
      BigInt(
        election.electionId,
      )
  ) {
    throw lifecycleError(
      "CONTRACT_ELECTION_MISMATCH",
      "VoteChainDirect electionId does not match MongoDB",
    )
  }

  const expectedAdmin =
    getAddress(
      election.adminAddress,
    )

  if (
    getAddress(
      contractAdmin,
    ) !==
      expectedAdmin
  ) {
    throw lifecycleError(
      "DIRECT_ADMIN_MISMATCH",
      "VoteChainDirect admin does not match the election administrator",
    )
  }

  /*
   * Local prototype infrastructure signer.
   *
   * This is the same server-side signer model used by Start Election.
   * No private key is read, printed or passed through application code.
   */
  const signer =
    await provider
      .getSigner(
        0,
      )

  if (
    getAddress(
      await signer
        .getAddress(),
    ) !==
      expectedAdmin
  ) {
    throw lifecycleError(
      "DEPLOYER_ADMIN_MISMATCH",
      "RPC signer 0 is not the current election administrator",
    )
  }

  return {
    provider,

    direct:
      new Contract(
        address,
        abi,
        signer,
      ),
  }
}


async function verifyFrozenBindings(
  election,
  direct,
) {
  const [
    electionId,
    candidateCount,
    eligibleRoot,
    manifest,
    transcriptHash,
    Yx,
    Yy,
  ] =
    await Promise.all([
      direct.electionId(),
      direct.candidateCount(),
      direct.eligibleRoot(),
      direct.candidateManifestHash(),
      direct.trusteeTranscriptHash(),
      direct.Yx(),
      direct.Yy(),
    ])

  const checks = [
    [
      BigInt(
        electionId,
      ) ===
        BigInt(
          election.electionId,
        ),
      "electionId",
    ],

    [
      Number(
        candidateCount,
      ) ===
        Number(
          election.candidateCount,
        ),
      "candidateCount",
    ],

    [
      BigInt(
        eligibleRoot,
      ) ===
        BigInt(
          election.eligibleRoot,
        ),
      "eligibleRoot",
    ],

    [
      BigInt(
        manifest,
      ) ===
        BigInt(
          election.candidateManifestHash,
        ),
      "candidateManifestHash",
    ],

    [
      normalizedHash(
        transcriptHash,
        "on-chain trustee transcript hash",
      ) ===
        normalizedHash(
          election.trusteeTranscriptHash,
          "stored trustee transcript hash",
        ),
      "trusteeTranscriptHash",
    ],

    [
      BigInt(
        Yx,
      ) ===
        BigInt(
          election.Yx,
        ),
      "Yx",
    ],

    [
      BigInt(
        Yy,
      ) ===
        BigInt(
          election.Yy,
        ),
      "Yy",
    ],
  ]

  for (
    const [
      passed,
      label,
    ]
    of checks
  ) {
    if (!passed) {
      throw lifecycleError(
        "FINALIZATION_BINDING_MISMATCH",
        `Frozen election binding mismatch: ${label}`,
      )
    }
  }
}


async function readEncryptedAggregate(
  direct,
) {
  const ciphertexts =
    []

  for (
    let slot = 0;
    slot <
      MAX_CANDIDATES;
    slot += 1
  ) {
    const tally =
      await direct
        .getTally(
          slot,
        )

    ciphertexts.push({
      R: [
        tally[0]
          .toString(),

        tally[1]
          .toString(),
      ],

      S: [
        tally[2]
          .toString(),

        tally[3]
          .toString(),
      ],
    })
  }

  return ciphertexts
}


function sameCiphertext(
  a,
  b,
) {
  return (
    String(
      a?.R?.[0],
    ) ===
      String(
        b?.R?.[0],
      ) &&
    String(
      a?.R?.[1],
    ) ===
      String(
        b?.R?.[1],
      ) &&
    String(
      a?.S?.[0],
    ) ===
      String(
        b?.S?.[0],
      ) &&
    String(
      a?.S?.[1],
    ) ===
      String(
        b?.S?.[1],
      )
  )
}


function requireAggregateMatch(
  actual,
  expected,
) {
  if (
    !Array.isArray(
      expected,
    ) ||
    expected.length !==
      MAX_CANDIDATES
  ) {
    throw lifecycleError(
      "FINALIZATION_AGGREGATE_INVALID",
      "Finalization transcript does not contain the 16-slot encrypted aggregate",
      400,
    )
  }

  for (
    let slot = 0;
    slot <
      MAX_CANDIDATES;
    slot += 1
  ) {
    if (
      !sameCiphertext(
        actual[slot],
        expected[slot],
      )
    ) {
      throw lifecycleError(
        "FINALIZATION_AGGREGATE_MISMATCH",
        `Finalization transcript does not match the on-chain encrypted tally at slot ${slot}`,
      )
    }
  }
}


function resultProjection(
  election,
  finalResults,
) {
  const snapshot =
    [
      ...(
        election
          .candidateSnapshot ??
        []
      ),
    ]
      .sort(
        (
          a,
          b,
        ) =>
          Number(
            a.slot,
          ) -
          Number(
            b.slot,
          ),
      )

  return snapshot.map(
    candidate => ({
      slot:
        Number(
          candidate.slot,
        ),

      candidateId:
        Number(
          candidate.candidateId,
        ),

      name:
        candidate.name,

      party:
        candidate.party,

      location:
        candidate.location,

      votes:
        String(
          finalResults[
            Number(
              candidate.slot,
            )
          ] ??
          "0",
        ),
    }),
  )
}


export async function endElectionLifecycle({
  electionId,
}) {
  const election =
    await currentElection(
      electionId,
    )

  if (
    ![
      "active",
      "ended",
    ].includes(
      election.status,
    )
  ) {
    if (
      election.status ===
        "finalized"
    ) {
      throw lifecycleError(
        "ELECTION_ALREADY_FINALIZED",
        "A finalized election cannot be ended again",
      )
    }

    throw lifecycleError(
      "ELECTION_NOT_ACTIVE",
      `Election cannot end from status ${election.status}`,
    )
  }

  const {
    direct,
  } =
    await directContext(
      election,
    )

  await verifyFrozenBindings(
    election,
    direct,
  )

  let phase =
    Number(
      await direct
        .phase(),
    )

  let alreadyEnded =
    phase === 2

  if (
    phase === 1
  ) {
    const tx =
      await direct
        .endElection()

    const receipt =
      await tx.wait()

    if (
      receipt?.status ===
        0
    ) {
      throw lifecycleError(
        "END_TRANSACTION_FAILED",
        "VoteChainDirect endElection transaction failed",
      )
    }

    phase =
      Number(
        await direct
          .phase(),
      )

    alreadyEnded =
      false
  }

  if (
    phase !== 2
  ) {
    throw lifecycleError(
      "DIRECT_PHASE_INVALID",
      `VoteChainDirect must be Ended after endElection; current phase is ${phase}`,
    )
  }

  const [
    acceptedBallotCount,
    candidateCount,
    aggregateCiphertexts,
  ] =
    await Promise.all([
      direct
        .acceptedBallotCount(),

      direct
        .candidateCount(),

      readEncryptedAggregate(
        direct,
      ),
    ])

  if (
    Number(
      candidateCount,
    ) !==
      Number(
        election.candidateCount,
      )
  ) {
    throw lifecycleError(
      "FINALIZATION_BINDING_MISMATCH",
      "Candidate count changed before finalization",
    )
  }

  const accepted =
    BigInt(
      acceptedBallotCount,
    )

  if (
    accepted >
      BigInt(
        Number.MAX_SAFE_INTEGER,
      )
  ) {
    throw lifecycleError(
      "BALLOT_COUNT_UNSUPPORTED",
      "Accepted ballot count exceeds the local WP6 finalization tool's safe integer range",
    )
  }

  const aggregate = {
    electionId:
      String(
        election.electionId,
      ),

    candidateCount:
      Number(
        candidateCount,
      ),

    acceptedBallotCount:
      Number(
        accepted,
      ),

    dkgTranscriptHash:
      normalizedHash(
        election.trusteeTranscriptHash,
        "trustee transcript hash",
      ),

    aggregateCiphertexts,
  }

  /*
   * Public-only artifact.
   * No trustee custody/passphrase/share material is written here.
   */
  const aggregateFile =
    localAggregateFile(
      election.electionId,
    )

  await writePublicJson(
    aggregateFile,
    aggregate,
  )

  election.status =
    "ended"

  election.acceptedBallotCount =
    accepted.toString()

  election.aggregateCiphertexts =
    aggregateCiphertexts

  election.endedAt =
    election.endedAt ??
    new Date()

  await election.save()

  return {
    electionId:
      election.electionId,

    status:
      election.status,

    alreadyEnded,

    acceptedBallotCount:
      accepted.toString(),

    candidateCount:
      Number(
        candidateCount,
      ),

    aggregateFile:
      aggregateFile,

    aggregate,
  }
}


export async function finalizeElectionLifecycle({
  electionId,
  transcript,
}) {
  const election =
    await currentElection(
      electionId,
    )

  if (
    ![
      "ended",
      "finalized",
    ].includes(
      election.status,
    )
  ) {
    throw lifecycleError(
      "ELECTION_NOT_ENDED",
      `Election cannot finalize from status ${election.status}`,
    )
  }

  if (
    !transcript ||
    typeof transcript !==
      "object"
  ) {
    throw lifecycleError(
      "INVALID_FINALIZATION_TRANSCRIPT",
      "A WP6 finalization transcript is required",
      400,
    )
  }

  const {
    direct,
  } =
    await directContext(
      election,
    )

  await verifyFrozenBindings(
    election,
    direct,
  )

  let phase =
    Number(
      await direct
        .phase(),
    )

  if (
    phase !== 2 &&
    phase !== 3
  ) {
    throw lifecycleError(
      "DIRECT_PHASE_INVALID",
      `VoteChainDirect must be Ended or Finalized; current phase is ${phase}`,
    )
  }

  if (
    String(
      transcript.electionId,
    ) !==
      String(
        election.electionId,
      )
  ) {
    throw lifecycleError(
      "FINALIZATION_ELECTION_MISMATCH",
      "Finalization transcript electionId does not match the current election",
      400,
    )
  }

  if (
    Number(
      transcript.candidateCount,
    ) !==
      Number(
        election.candidateCount,
      )
  ) {
    throw lifecycleError(
      "FINALIZATION_CANDIDATE_COUNT_MISMATCH",
      "Finalization transcript candidate count does not match the frozen election",
      400,
    )
  }

  if (
    !election.trusteeTranscript
  ) {
    throw lifecycleError(
      "TRUSTEE_TRANSCRIPT_REQUIRED",
      "Stored WP6 DKG transcript is unavailable",
    )
  }

  const c =
    await context()

  const storedDkgHash =
    canonicalSha256(
      election.trusteeTranscript,
    )

  const pinnedDkgHash =
    normalizedHash(
      election.trusteeTranscriptHash,
      "stored trustee transcript hash",
    )

  if (
    normalizedHash(
      storedDkgHash,
      "stored DKG canonical hash",
    ) !==
      pinnedDkgHash
  ) {
    throw lifecycleError(
      "TRUSTEE_TRANSCRIPT_MISMATCH",
      "Stored DKG transcript does not match its pinned hash",
    )
  }

  const transcriptDkgHash =
    normalizedHash(
      transcript.dkgTranscriptHash,
      "finalization DKG transcript hash",
    )

  if (
    transcriptDkgHash !==
      pinnedDkgHash
  ) {
    throw lifecycleError(
      "FINALIZATION_DKG_MISMATCH",
      "Finalization transcript is bound to a different DKG ceremony",
      400,
    )
  }

  if (
    !transcript.dkgTranscript ||
    normalizedHash(
      canonicalSha256(
        transcript.dkgTranscript,
      ),
      "embedded DKG transcript hash",
    ) !==
      pinnedDkgHash
  ) {
    throw lifecycleError(
      "FINALIZATION_DKG_MISMATCH",
      "Embedded DKG transcript does not match the election's pinned ceremony",
      400,
    )
  }

  if (
    verifyDkgTranscript(
      c,
      transcript.dkgTranscript,
    ) === false
  ) {
    throw lifecycleError(
      "INVALID_DKG_TRANSCRIPT",
      "Embedded WP6 DKG transcript verification failed",
      400,
    )
  }

  const [
    chainAccepted,
    chainAggregate,
  ] =
    await Promise.all([
      direct
        .acceptedBallotCount(),

      readEncryptedAggregate(
        direct,
      ),
    ])

  if (
    BigInt(
      chainAccepted,
    ) !==
      BigInt(
        transcript
          .acceptedBallotCount,
      )
  ) {
    throw lifecycleError(
      "FINALIZATION_BALLOT_COUNT_MISMATCH",
      "Finalization transcript accepted-ballot count does not match VoteChainDirect",
      400,
    )
  }

  requireAggregateMatch(
    chainAggregate,
    transcript
      .aggregateCiphertexts,
  )

  let verified

  try {
    verified =
      await verifyFinalizationTranscript({
        c,
        transcript,
      })
  } catch (error) {
    throw lifecycleError(
      "INVALID_FINALIZATION_TRANSCRIPT",
      `WP6 finalization verification failed: ${error.message}`,
      400,
    )
  }

  const transcriptHash =
    normalizedHash(
      verified.transcriptHash,
      "verified finalization transcript hash",
    )

  const totals =
    verified
      .totals
      .map(
        value =>
          BigInt(
            value,
          ),
      )

  if (
    totals.length !==
      MAX_CANDIDATES
  ) {
    throw lifecycleError(
      "INVALID_FINALIZATION_TOTALS",
      "WP6 verifier did not return the required 16 tally slots",
      400,
    )
  }

  const candidateCount =
    Number(
      election.candidateCount,
    )

  let activeSum =
    0n

  for (
    let slot = 0;
    slot <
      MAX_CANDIDATES;
    slot += 1
  ) {
    if (
      totals[slot] < 0n
    ) {
      throw lifecycleError(
        "INVALID_FINALIZATION_TOTALS",
        `Negative tally at slot ${slot}`,
        400,
      )
    }

    if (
      slot <
        candidateCount
    ) {
      activeSum +=
        totals[slot]
    } else if (
      totals[slot] !==
        0n
    ) {
      throw lifecycleError(
        "INVALID_FINALIZATION_TOTALS",
        `Nonzero padded candidate slot ${slot}`,
        400,
      )
    }
  }

  if (
    activeSum !==
      BigInt(
        chainAccepted,
      )
  ) {
    throw lifecycleError(
      "FINALIZATION_RESULT_SUM_MISMATCH",
      "Verified candidate totals do not sum to acceptedBallotCount",
      400,
    )
  }

  let alreadyFinalized =
    phase === 3

  if (
    phase === 2
  ) {
    const tx =
      await direct
        .finalizeTally(
          totals,
          `0x${transcriptHash}`,
        )

    const receipt =
      await tx.wait()

    if (
      receipt?.status ===
        0
    ) {
      throw lifecycleError(
        "FINALIZATION_TRANSACTION_FAILED",
        "VoteChainDirect finalizeTally transaction failed",
      )
    }

    phase =
      Number(
        await direct
          .phase(),
      )

    alreadyFinalized =
      false
  }

  if (
    phase !== 3
  ) {
    throw lifecycleError(
      "DIRECT_PHASE_INVALID",
      `VoteChainDirect did not reach Finalized; current phase is ${phase}`,
    )
  }

  const storedHash =
    normalizedHash(
      await direct
        .finalizationTranscriptHash(),
      "on-chain finalization transcript hash",
    )

  if (
    storedHash !==
      transcriptHash
  ) {
    throw lifecycleError(
      "FINALIZATION_HASH_MISMATCH",
      "On-chain finalization transcript hash does not match the independently verified transcript",
    )
  }

  const finalResults =
    []

  for (
    let slot = 0;
    slot <
      candidateCount;
    slot += 1
  ) {
    const value =
      (
        await direct
          .getFinalResult(
            slot,
          )
      )
        .toString()

    if (
      BigInt(
        value,
      ) !==
        totals[slot]
    ) {
      throw lifecycleError(
        "FINALIZATION_RESULT_MISMATCH",
        `On-chain finalized result mismatch at slot ${slot}`,
      )
    }

    finalResults.push(
      value,
    )
  }

  election.status =
    "finalized"

  election.acceptedBallotCount =
    BigInt(
      chainAccepted,
    )
      .toString()

  election.aggregateCiphertexts =
    chainAggregate

  election.finalizationTranscriptHash =
    `0x${transcriptHash}`

  election.finalizationTranscript =
    transcript

  election.finalResults =
    finalResults

  election.endedAt =
    election.endedAt ??
    new Date()

  election.finalizedAt =
    election.finalizedAt ??
    new Date()

  await election.save()

  return {
    electionId:
      election.electionId,

    status:
      election.status,

    alreadyFinalized,

    acceptedBallotCount:
      election.acceptedBallotCount,

    finalizationTranscriptHash:
      election.finalizationTranscriptHash,

    rejectedBySlot:
      verified
        .rejectedBySlot,

    results:
      resultProjection(
        election,
        finalResults,
      ),
  }
}


export async function getFinalElectionResults(
  electionId,
) {
  const election =
    await Election
      .findOne({
        electionId:
          String(
            electionId,
          ),

        status:
          "finalized",
      })
      .lean()

  if (!election) {
    throw lifecycleError(
      "FINAL_RESULTS_NOT_AVAILABLE",
      "Finalized results are not available for this election",
      404,
    )
  }

  return {
    electionId:
      election.electionId,

    status:
      election.status,

    acceptedBallotCount:
      election.acceptedBallotCount,

    finalizationTranscriptHash:
      election.finalizationTranscriptHash,

    finalizedAt:
      election.finalizedAt,

    results:
      resultProjection(
        election,
        election.finalResults ??
          [],
      ),
  }
}
