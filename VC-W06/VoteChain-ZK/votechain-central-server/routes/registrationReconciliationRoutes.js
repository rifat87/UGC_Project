import express
  from "express"

import {
  requireElectionRegistrationOpen,
} from "../middleware/electionRegistration.js"

import {
  reconcileCandidateRegistration,
  reconcileVoterRegistration,
} from "../services/registration/registrationReceiptService.js"

const router =
  express.Router()

/*
 * These endpoints deliberately do not require a second wallet signature.
 *
 * They cannot create registration state on-chain.
 *
 * The submitted transaction hash is only accepted after the backend
 * independently verifies:
 *   - current election and chainId,
 *   - current benchmark-frozen ZKLocalVoting address,
 *   - successful transaction receipt,
 *   - Election Commission sender,
 *   - expected registration event,
 *   - expected candidate/commitment value,
 *   - final contract state.
 *
 * Therefore an arbitrary caller cannot promote an unregistered record.
 */

router.post(
  "/candidate",
  requireElectionRegistrationOpen,
  async (
    req,
    res,
  ) => {
    try {
      const data =
        await reconcileCandidateRegistration({
          candidateId:
            req.body?.candidateId,

          transactionHash:
            req.body?.transactionHash,
        })

      return res.json({
        success:
          true,

        message:
          "Candidate blockchain registration verified",

        data,
      })
    } catch (error) {
      console.error(
        "Candidate receipt reconciliation failed:",
        error.message,
      )

      return res
        .status(
          Number(
            error?.status,
          ) || 500,
        )
        .json({
          success:
            false,

          message:
            error.message ||
            "Failed to verify candidate blockchain registration",
        })
    }
  },
)

router.post(
  "/voter",
  requireElectionRegistrationOpen,
  async (
    req,
    res,
  ) => {
    try {
      const data =
        await reconcileVoterRegistration({
          identityCommitment:
            req.body?.identityCommitment,

          transactionHash:
            req.body?.transactionHash,
        })

      return res.json({
        success:
          true,

        message:
          "Voter blockchain registration verified",

        data,
      })
    } catch (error) {
      console.error(
        "Voter receipt reconciliation failed:",
        error.message,
      )

      return res
        .status(
          Number(
            error?.status,
          ) || 500,
        )
        .json({
          success:
            false,

          message:
            error.message ||
            "Failed to verify voter blockchain registration",
        })
    }
  },
)

export default router
