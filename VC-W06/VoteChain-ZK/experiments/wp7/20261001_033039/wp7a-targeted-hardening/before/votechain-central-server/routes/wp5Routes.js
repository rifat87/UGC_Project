import express from 'express'
import {
  authorizeFace,
  getConfig,
} from '../controllers/wp5Controller.js'
import fingerprintController from '../controllers/fingerprintController.js'

const router = express.Router()

router.get('/config', getConfig)

/*
 * Candidate plaintext is forbidden on both authorization endpoints.
 * The request contains only an ephemeral public key used to envelope
 * the custom voter credential after biometric success.
 */
router.post('/authorize/face', authorizeFace)
router.post(
  '/authorize/fingerprint',
  fingerprintController.detectWp5Fingerprint,
)

export default router
