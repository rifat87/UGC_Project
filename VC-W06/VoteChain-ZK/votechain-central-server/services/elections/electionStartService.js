import Election from "../../models/Election.js"

import {
  getRuntimeElection,
} from "./electionRuntimeService.js"

import {
  prepareElectionSnapshot,
} from "./electionSnapshotService.js"

import {
  activateElectionOnChain,
} from "./electionChainService.js"

function lifecycleError(
  code,
  message,
) {
  const error =
    new Error(
      message,
    )

  error.code =
    code

  return error
}

export async function startElectionLifecycle({
  electionId,
}) {
  let election =
    await getRuntimeElection({
      electionId,
    })

  if (!election) {
    throw lifecycleError(
      "ELECTION_NOT_FOUND",
      "Current election was not found",
    )
  }

  if (
    election.status ===
      "active"
  ) {
    return {
      electionId:
        election.electionId,

      status:
        election.status,

      startStage:
        election.startStage,

      verifierAddress:
        election.verifierAddress,

      directContractAddress:
        election
          .directContractAddress,

      eligibleRoot:
        election.eligibleRoot,

      eligibleVoterCount:
        election
          .eligibleVoterCount,

      candidateManifestHash:
        election
          .candidateManifestHash,

      candidateCount:
        election.candidateCount,

      trusteeTranscriptHash:
        election
          .trusteeTranscriptHash,

      contractDomain:
        election.contractDomain,

      Yx:
        election.Yx,

      Yy:
        election.Yy,

      electionContextHash:
        election
          .electionContextHash,

      alreadyActive:
        true,
    }
  }

  if (
    ![
      "registration",
      "starting",
    ].includes(
      election.status,
    )
  ) {
    throw lifecycleError(
      "ELECTION_CANNOT_START",
      `Election cannot start from status ${election.status}`,
    )
  }

  if (
    !election.trusteeTranscript ||
    !election.trusteeTranscriptHash ||
    !election.Yx ||
    !election.Yy
  ) {
    throw lifecycleError(
      "TRUSTEE_TRANSCRIPT_REQUIRED",
      "Upload and verify the public WP6 trustee transcript before starting the election",
    )
  }

  const snapshot =
    await prepareElectionSnapshot()

  if (
    String(
      snapshot
        .election
        .electionId,
    ) !==
      String(
        electionId,
      )
  ) {
    throw lifecycleError(
      "CURRENT_ELECTION_MISMATCH",
      "The current election changed while Start Election was running",
    )
  }

  election =
    await Election
      .findById(
        snapshot
          .election
          ._id,
      )

  return activateElectionOnChain(
    election,
  )
}
