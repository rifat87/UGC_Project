
import {
  verifyAdminChallengeRequest,
} from "../services/admin/adminChallengeService.js"

export async function
requireWp5AdminRequest(
  req,
  res,
  next,
) {
  try {
    req.voteChainAdmin =
      await verifyAdminChallengeRequest(
        req,
      )

    return next()
  } catch (error) {
    return res
      .status(
        Number(
          error?.status,
        ) || 401,
      )
      .json({
        success:
          false,

        message:
          error?.message ||
          "Administrator authorization failed",
      })
  }
}

export function
requireWp5AdminMutation(
  req,
  res,
  next,
) {
  if (
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS"
  ) {
    return next()
  }

  return requireWp5AdminRequest(
    req,
    res,
    next,
  )
}
