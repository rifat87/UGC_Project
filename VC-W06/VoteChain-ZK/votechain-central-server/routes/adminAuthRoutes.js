
import express
  from "express"

import {
  getAdminAuthorityContext,
  issueAdminChallenge,
} from "../services/admin/adminChallengeService.js"

const router =
  express.Router()

router.get(
  "/context",
  async (
    _req,
    res,
  ) => {
    try {
      const authority =
        await getAdminAuthorityContext()

      return res.json({
        success:
          true,

        data: {
          admin:
            authority.admin,

          chainId:
            authority.chainId,

          source:
            authority.source,
        },
      })
    } catch (error) {
      return res
        .status(503)
        .json({
          success:
            false,

          message:
            error.message ||
            "Administrator authority is unavailable",
        })
    }
  },
)

router.post(
  "/challenge",
  async (
    req,
    res,
  ) => {
    try {
      const data =
        await issueAdminChallenge({
          address:
            req.body?.address,

          method:
            req.body?.method,

          path:
            req.body?.path,

          bodyHash:
            req.body?.bodyHash,
        })

      return res.json({
        success:
          true,
        data,
      })
    } catch (error) {
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
            "Failed to issue administrator challenge",
        })
    }
  },
)

export default router
