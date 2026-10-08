import express from 'express'

const router = express.Router()

/*
 * The inherited candidate-aware Semaphore vote-preparation endpoint
 * is retained only as source/reference and is no longer an active API.
 *
 * Active private voting uses:
 *   POST /api/wp5/authorize/face
 */
router.post('/verify-face', (_req, res) => {
  return res.status(410).json({
    success: false,
    message:
      'Legacy candidate-aware vote preparation is disabled. Use the VoteChain-ZK WP5 authorization path.',
  })
})

router.get('/', (_req, res) => {
  res.json({
    message:
      'VoteChain-ZK vote routes working',
  })
})

export default router
