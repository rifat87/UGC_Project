import express from 'express'
import { verifyFace } from '../controllers/voteController.js'

const router = express.Router()

// Successful face verification gates backend-only Semaphore credential use and proof generation.
router.post('/verify-face', verifyFace)

router.get('/', (_req, res) => {
  res.json({ message: 'VoteChain-ZK vote routes working' })
})

export default router
