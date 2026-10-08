import {
  getRegistrationState,
} from "../services/elections/electionLifecycleService.js"

export async function requireElectionRegistrationOpen(
  _req,
  res,
  next,
) {
  try {
    const {
      open,
      election,
    } =
      await getRegistrationState()

    if (!open) {
      return res.status(409).json({
        success: false,
        message:
          `Registration is closed while election is ${election?.status || "locked"}`,
      })
    }

    return next()
  } catch (error) {
    console.error(
      "Election registration gate failed:",
      error.message,
    )

    return res.status(503).json({
      success: false,
      message:
        "Election registration state is temporarily unavailable",
    })
  }
}


export async function requireCandidateElectionRegistrationOpen(
  req,
  res,
  next,
) {
  try {
    const {
      open,
      election,
    } =
      await getRegistrationState()

    if (
      !open ||
      !election ||
      election.status !==
        "registration"
    ) {
      return res.status(409).json({
        success: false,
        message:
          election
            ? `Candidate registration is closed while election is ${election.status}`
            : "Candidate registration requires a current election in Registration state",
      })
    }

    req.voteChainCandidateElection =
      election

    return next()
  } catch (error) {
    console.error(
      "Candidate election registration gate failed:",
      error.message,
    )

    return res.status(503).json({
      success: false,
      message:
        "Candidate election registration state is temporarily unavailable",
    })
  }
}
