
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import voterRoutes from './routes/voterRoutes.js'
import candidateRoutes from './routes/candidateRoutes.js'
import electionRoutes from './routes/electionRoutes.js'
import voteRoutes from './routes/voteRoutes.js'
import biometricRoutes from './routes/biometricRoutes.js'
import blockchainRoutes from './routes/blockchainRoutes.js'
import wp5Routes from './routes/wp5Routes.js'
import adminAuthRoutes from './routes/adminAuthRoutes.js'
import registrationReconciliationRoutes from './routes/registrationReconciliationRoutes.js'

import {
  getServerConfig,
} from './config/env.js'

import {
  reconcileCurrentElection,
} from './services/elections/electionReconciliationService.js'

const {
  port,
  mongoUri,
  frontendOrigins,
} =
  getServerConfig()

const app =
  express()

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          ...frontendOrigins,
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
        ],
        imgSrc: [
          "'self'",
          'data:',
          'https:',
        ],
        fontSrc: [
          "'self'",
        ],
      },
    },
  }),
)

app.use(
  rateLimit({
    windowMs:
      15 * 60 * 1000,
    max:
      100,
  }),
)

app.use(
  cors({
    origin:
      frontendOrigins.length > 0
        ? frontendOrigins
        : false,

    methods: [
      'GET',
      'POST',
      'PATCH',
      'PUT',
      'DELETE',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],

    credentials:
      true,
  }),
)

app.use(
  express.json({
    limit:
      '16kb',
    strict:
      true,
  }),
)

app.use(
  express.urlencoded({
    extended:
      true,
    limit:
      '16kb',
    parameterLimit:
      50,
  }),
)

app.use(
  '/api/admin-auth',
  adminAuthRoutes,
)

app.use(
  '/api/registration-reconciliation',
  registrationReconciliationRoutes,
)

app.use(
  '/api/voters',
  voterRoutes,
)

app.use(
  '/api/candidates',
  candidateRoutes,
)

app.use(
  '/api/elections',
  electionRoutes,
)

app.use(
  '/api/votes',
  voteRoutes,
)

app.use(
  '/api/biometric',
  biometricRoutes,
)

app.use(
  '/api/blockchain',
  blockchainRoutes,
)

app.use(
  '/api/wp5',
  wp5Routes,
)

app.use(
  (
    error,
    _req,
    res,
    _next,
  ) => {
    if (
      error?.type ===
        'entity.too.large' ||
      Number(
        error?.status,
      ) === 413
    ) {
      return res
        .status(413)
        .json({
          success:
            false,
          message:
            'Request body is too large',
        })
    }

    console.error(
      '[Server] unhandled request error:',
      error?.message ||
      'unknown error',
    )

    return res
      .status(500)
      .json({
        success:
          false,
        message:
          'Something went wrong!',
      })
  },
)

async function startServer() {
  try {
    await mongoose.connect(
      mongoUri,
    )

    console.log(
      'MongoDB connected',
    )
  } catch (error) {
    console.error(
      'MongoDB connection error:',
      error.message,
    )

    process.exitCode = 1
    return
  }

  try {
    const reconciled =
      await reconcileCurrentElection()

    if (reconciled) {
      console.log(
        `[ElectionReconcile] status=${reconciled.status} chainHealth=${reconciled.chainHealth || 'unknown'}`,
      )
    }
  } catch (error) {
    /*
     * Reconciliation should normally fail closed internally.
     * Keep the server reachable for diagnostics if an unexpected
     * reconciliation error occurs.
     */
    console.error(
      '[ElectionReconcile] startup reconciliation error:',
      error.message,
    )
  }

  app.listen(
    port,
    () => {
      console.log(
        `Server running on port ${port}`,
      )
    },
  )
}

void startServer()
