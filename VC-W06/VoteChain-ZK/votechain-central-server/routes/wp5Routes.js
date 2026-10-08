import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  requireWp5AllowedOrigin,
  validateWp5AuthorizationRequest,
} from '../middleware/wp5AuthorizationSecurity.js'
import {
  authorizeFace,
  getConfig,
} from '../controllers/wp5Controller.js'
import fingerprintController from '../controllers/fingerprintController.js'

const router = express.Router()

/*
 * WP5_AUTHORIZATION_RATE_LIMIT
 *
 * Biometric authorization is intentionally more expensive than ordinary
 * public reads, so it receives a tighter endpoint-specific limiter in
 * addition to the application-wide limiter.
 */
const wp5AuthorizationLimiter =
  rateLimit({
    windowMs:
      60 * 1000,
    max: 12,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message:
        'Too many private-voting authorization attempts; retry shortly',
    },
  })

const wp5AuthorizationGuards = [
  requireWp5AllowedOrigin,
  wp5AuthorizationLimiter,
  validateWp5AuthorizationRequest,
]

router.get('/config', getConfig)

/*
 * Candidate plaintext is forbidden on both authorization endpoints.
 * The request contains only an ephemeral public key used to envelope
 * the custom voter credential after biometric success.
 */
router.post(
  '/authorize/face',
  ...wp5AuthorizationGuards,
  authorizeFace,
)
router.post(
  '/authorize/fingerprint',
  ...wp5AuthorizationGuards,
  fingerprintController.detectWp5Fingerprint,
)

export default router
