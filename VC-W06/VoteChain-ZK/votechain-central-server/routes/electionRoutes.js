import express from "express"

import electionController from "../controllers/electionController.js"

import {
  requireWp5AdminMutation,
} from "../middleware/adminRequestSecurity.js"

const router =
  express.Router()

router.get(
  "/",
  (_req, res) => {
    res.json({
      message:
        "Election routes working",
    })
  },
)

router.get(
  "/current",
  electionController.getCurrentElectionStatus,
)

router.post(
  "/",
  requireWp5AdminMutation,
  electionController.createElection,
)

router.post(
  "/:electionId/trustee-transcript",
  requireWp5AdminMutation,
  electionController.setTrusteeTranscript,
)

router.post(
  "/:electionId/start",
  requireWp5AdminMutation,
  electionController.startElection,
)

router.post(
  "/:electionId/end",
  requireWp5AdminMutation,
  electionController.endElection,
)

router.post(
  "/:electionId/finalize",
  requireWp5AdminMutation,
  electionController.finalizeElection,
)

router.get(
  "/latest/results",
  electionController.getLatestElectionResults,
)

router.get(
  "/:electionId/results",
  electionController.getElectionResults,
)

router.get(
  "/public/election-data",
  electionController.getElectionData,
)

export default router
