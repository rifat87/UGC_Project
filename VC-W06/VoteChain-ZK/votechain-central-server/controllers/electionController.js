import Candidate from "../models/Candidate.js"
import Election from "../models/Election.js"

import {
  getContract,
} from "../utils/contract.js"

import {
  buildPublicElectionData,
} from "../services/electionDataService.js"

import {
  createElectionRecord,
  getCurrentElection,
} from "../services/elections/electionLifecycleService.js"

import {
  storeElectionTrusteeTranscript,
} from "../services/elections/electionTrusteeService.js"

import {
  startElectionLifecycle,
} from "../services/elections/electionStartService.js"

import {
  endElectionLifecycle,
  finalizeElectionLifecycle,
  getFinalElectionResults,
  loadLocalFinalizationTranscript,
} from "../services/elections/electionFinalizationService.js"

function lifecycleStatus(
  error,
) {
  if (
    Number.isInteger(
      error?.httpStatus,
    )
  ) {
    return error.httpStatus
  }

  if (
    error.code ===
      "ELECTION_NOT_FOUND"
  ) {
    return 404
  }

  if (
    [
      "INVALID_DKG_TRANSCRIPT",
      "DKG_CEREMONY_MISMATCH",
    ].includes(
      error.code,
    )
  ) {
    return 400
  }

  if (
    [
      "ELECTION_IN_PROGRESS",
      "ELECTION_NOT_IN_REGISTRATION",
      "ELECTION_ADMIN_MISMATCH",
      "ELECTION_CANNOT_START",
      "TRUSTEE_TRANSCRIPT_REQUIRED",
      "START_IN_PROGRESS",
      "CURRENT_ELECTION_MISMATCH",
      "SNAPSHOT_NOT_READY",
      "CHAIN_ID_MISMATCH",
      "DEPLOYER_ADMIN_MISMATCH",
      "DIRECT_ADMIN_MISMATCH",
      "DIRECT_VERIFIER_MISMATCH",
      "CONTRACT_CONFIG_MISMATCH",
      "TRUSTEE_TRANSCRIPT_MISMATCH",
      "DIRECT_PHASE_INVALID",
      "CHAIN_STATE_LOST",
    ].includes(
      error.code,
    )
  ) {
    return 409
  }

  return 500
}

const getElectionData =
  async (_req, res) => {
    try {
      let election =
        await getCurrentElection()

      if (!election) {
        election =
          await Election
            .findOne({
              status: {
                $in: [
                  "finalized",
                  "failed",
                ],
              },
            })
            .sort({
              finalizedAt:
                -1,

              createdAt:
                -1,
            })
      }

      let candidateRecords =
        []

      if (
        election?.status ===
          "registration"
      ) {
        candidateRecords =
          await Candidate
            .find({
              electionId:
                String(
                  election.electionId,
                ),

              candidateId: {
                $exists:
                  true,
              },
            })
            .sort({
              candidateId:
                1,
            })
            .lean()
      } else if (
        election &&
        Array.isArray(
          election.candidateSnapshot,
        )
      ) {
        candidateRecords =
          [
            ...election.candidateSnapshot,
          ]
            .sort(
              (left, right) =>
                Number(left.slot) -
                Number(right.slot),
            )
            .map(
              candidate => ({
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

                registrationStatus:
                  "registered",
              }),
            )
      }

      const data =
        await buildPublicElectionData({
          candidateRecords,
          contract:
            getContract(),
        })

      return res.json({
        success: true,
        data,
      })
    } catch (error) {
      console.error(
        "Error fetching public election data:",
        error.message,
      )

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch election data",
      })
    }
  }

const getCurrentElectionStatus =
  async (_req, res) => {
    try {
      let election =
        await getCurrentElection()

      /*
       * CURRENT_TERMINAL_DISPLAY_FALLBACK
       *
       * getCurrentElection() intentionally represents unfinished
       * lifecycle state. After finalization we still want the
       * dashboard to display the immutable terminal election.
       */
      if (!election) {
        election =
          await Election
            .findOne({
              status: {
                $in: [
                  "finalized",
                  "failed",
                ],
              },
            })
            .sort({
              finalizedAt:
                -1,

              createdAt:
                -1,
            })
      }

      if (!election) {
        return res.json({
          success: true,
          data: null,
        })
      }

      return res.json({
        success: true,

        data: {
          electionId:
            election.electionId,

          status:
            election.status,

          startStage:
            election.startStage ??
            null,

          chainId:
            election.chainId,

          eligibleVoterCount:
            election.eligibleVoterCount ??
            null,

          candidateCount:
            election.candidateCount ??
            null,

          eligibleRoot:
            election.eligibleRoot ??
            null,

          candidateManifestHash:
            election.candidateManifestHash ??
            null,

          trusteeTranscriptHash:
            election.trusteeTranscriptHash ??
            null,

          verifierAddress:
            election.verifierAddress ??
            null,

          directContractAddress:
            election.directContractAddress ??
            null,

          acceptedBallotCount:
            election.acceptedBallotCount ??
            "0",

          finalizationTranscriptHash:
            election.finalizationTranscriptHash ??
            null,

          finalResults:
            election.status === "finalized"
              ? (
                  election.finalResults ??
                  []
                )
              : [],

          startedAt:
            election.startedAt ??
            null,

          endedAt:
            election.endedAt ??
            null,

          finalizedAt:
            election.finalizedAt ??
            null,
        },
      })
    } catch (error) {
      console.error(
        "Current election lookup failed:",
        error.message,
      )

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch current election",
      })
    }
  }


const createElection =
  async (req, res) => {
    try {
      const election =
        await createElectionRecord({
          adminAddress:
            req.voteChainAdmin
              .address,
        })

      return res.status(201).json({
        success: true,
        message:
          "Election created; registration is open",
        data: {
          electionId:
            election.electionId,
          status:
            election.status,
          chainId:
            election.chainId,
          createdAt:
            election.createdAt,
        },
      })
    } catch (error) {
      if (
        error.code ===
          "ELECTION_IN_PROGRESS"
      ) {
        return res.status(409).json({
          success: false,
          message:
            error.message,
        })
      }

      console.error(
        "Election creation failed:",
        error.message,
      )

      return res.status(500).json({
        success: false,
        message:
          "Failed to create election",
      })
    }
  }

const setTrusteeTranscript =
  async (req, res) => {
    try {
      const transcript =
        req.body
          ?.transcript

      const result =
        await storeElectionTrusteeTranscript({
          electionId:
            req.params
              .electionId,

          transcript,

          adminAddress:
            req.voteChainAdmin
              .address,
        })

      return res.json({
        success: true,
        message:
          "WP6 public trustee transcript verified and stored",
        data: {
          electionId:
            result
              .election
              .electionId,

          trusteeTranscriptHash:
            result
              .transcriptHash,

          Yx:
            result.Yx,

          Yy:
            result.Yy,
        },
      })
    } catch (error) {
      const status =
        lifecycleStatus(
          error,
        )

      console.error(
        "Trustee transcript failed:",
        error.message,
      )

      return res.status(
        status,
      ).json({
        success: false,
        message:
          status === 500
            ? "Failed to store trustee transcript"
            : error.message,
      })
    }
  }

const startElection =
  async (req, res) => {
    try {
      const data =
        await startElectionLifecycle({
          electionId:
            req.params
              .electionId,
        })

      return res.json({
        success: true,
        message:
          data.alreadyActive
            ? "Election is already active"
            : "Election snapshot, deployment, configuration and activation completed",
        data,
      })
    } catch (error) {
      const status =
        lifecycleStatus(
          error,
        )

      console.error(
        "Election start failed:",
        error.message,
      )

      return res.status(
        status,
      ).json({
        success: false,
        message:
          status === 500
            ? "Failed to start election"
            : error.message,
      })
    }
  }


const endElection =
  async (req, res) => {
    try {
      const data =
        await endElectionLifecycle({
          electionId:
            req.params
              .electionId,
        })

      return res.json({
        success: true,
        message:
          data.alreadyEnded
            ? "Election was already ended; encrypted aggregate was re-verified"
            : "Election ended and encrypted aggregate frozen",
        data,
      })
    } catch (error) {
      const status =
        lifecycleStatus(
          error,
        )

      console.error(
        "Election end failed:",
        error.message,
      )

      return res.status(
        status,
      ).json({
        success: false,
        message:
          status === 500
            ? "Failed to end election"
            : error.message,
      })
    }
  }


const finalizeElection =
  async (req, res) => {
    try {
      /*
       * Normal deployment path:
       * trustees create the PUBLIC finalization transcript locally.
       *
       * The request body may optionally contain a transcript for
       * integration/testing, but an empty admin request loads the
       * election-scoped public transcript from the server host.
       */
      const transcript =
        req.body
          ?.transcript ??
        await loadLocalFinalizationTranscript(
          req.params
            .electionId,
        )

      const data =
        await finalizeElectionLifecycle({
          electionId:
            req.params
              .electionId,

          transcript,
        })

      return res.json({
        success: true,
        message:
          data.alreadyFinalized
            ? "Election finalization was already recorded and re-verified"
            : "WP6 threshold tally verified and finalized on-chain",
        data,
      })
    } catch (error) {
      const status =
        lifecycleStatus(
          error,
        )

      console.error(
        "Election finalization failed:",
        error.message,
      )

      return res.status(
        status,
      ).json({
        success: false,
        message:
          status === 500
            ? "Failed to finalize election"
            : error.message,
      })
    }
  }


const getElectionResults =
  async (req, res) => {
    try {
      const data =
        await getFinalElectionResults(
          req.params
            .electionId,
        )

      return res.json({
        success: true,
        data,
      })
    } catch (error) {
      const status =
        lifecycleStatus(
          error,
        )

      return res.status(
        status,
      ).json({
        success: false,
        message:
          status === 500
            ? "Failed to load finalized election results"
            : error.message,
      })
    }
  }




const getLatestElectionResults =
  async (_req, res) => {
    try {
      const latest =
        await Election
          .findOne({
            status:
              "finalized",
          })
          .sort({
            finalizedAt:
              -1,

            createdAt:
              -1,
          })
          .select({
            electionId:
              1,
          })
          .lean()

      if (!latest) {
        return res.status(
          404,
        ).json({
          success:
            false,

          message:
            "No finalized election results are available",
        })
      }

      const data =
        await getFinalElectionResults(
          latest.electionId,
        )

      return res.json({
        success:
          true,

        data,
      })
    } catch (error) {
      const status =
        lifecycleStatus(
          error,
        )

      return res.status(
        status,
      ).json({
        success:
          false,

        message:
          status === 500
            ? "Failed to load latest finalized election results"
            : error.message,
      })
    }
  }


export default {
  getElectionData,
  getCurrentElectionStatus,
  createElection,
  setTrusteeTranscript,
  startElection,
  endElection,
  finalizeElection,
  getElectionResults,
  getLatestElectionResults,
}
