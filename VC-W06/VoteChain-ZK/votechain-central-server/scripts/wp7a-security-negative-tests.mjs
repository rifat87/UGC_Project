import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'

import {
  requireWp5AllowedOrigin,
  validateWp5AuthorizationRequest,
} from '../middleware/wp5AuthorizationSecurity.js'

import {
  saveVoterWithWp5IndexRetry,
} from '../services/zk/wp5RegistrationCore.js'

import voteRoutes from '../routes/voteRoutes.js'
import biometricRoutes from '../routes/biometricRoutes.js'
import wp5Routes from '../routes/wp5Routes.js'

const pass =
  label =>
    console.log(
      `[PASS] ${label}`,
    )

const validJwk = {
  kty: 'EC',
  crv: 'P-256',
  x: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  y: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  ext: true,
  key_ops: [],
}

process.env.FRONTEND_ORIGINS =
  'http://127.0.0.1:4173'

/*
 * Pure guard harness. No biometric controller is reached here.
 */
{
  const app =
    express()

  app.use(
    express.json({
      limit: '16kb',
      strict: true,
    }),
  )

  app.post(
    '/guard',
    requireWp5AllowedOrigin,
    validateWp5AuthorizationRequest,
    (_req, res) =>
      res.status(204).end(),
  )

  await request(app)
    .post('/guard')
    .set(
      'Content-Type',
      'application/json',
    )
    .send({
      credentialPublicKey:
        validJwk,
    })
    .expect(204)

  pass(
    'valid candidate-blind authorization body accepted',
  )

  await request(app)
    .post('/guard')
    .set(
      'Origin',
      'http://evil.example',
    )
    .send({
      credentialPublicKey:
        validJwk,
    })
    .expect(403)

  pass(
    'unapproved browser origin rejected',
  )

  await request(app)
    .post('/guard')
    .send({
      credentialPublicKey:
        validJwk,
      candidateId: 1,
    })
    .expect(400)

  pass(
    'candidateId injection rejected',
  )

  await request(app)
    .post('/guard')
    .send({
      credentialPublicKey:
        validJwk,
      selectedCandidate: 1,
    })
    .expect(400)

  pass(
    'selectedCandidate injection rejected',
  )

  await request(app)
    .post('/guard')
    .send({
      credentialPublicKey: {
        ...validJwk,
        d:
          'PRIVATE_MATERIAL_FORBIDDEN',
      },
    })
    .expect(400)

  pass(
    'private JWK material rejected',
  )

  await request(app)
    .post('/guard')
    .send({
      credentialPublicKey: {
        ...validJwk,
        x: 'short',
      },
    })
    .expect(400)

  pass(
    'malformed P-256 coordinate rejected',
  )

  await request(app)
    .post('/guard')
    .set(
      'Content-Type',
      'text/plain',
    )
    .send('credentialPublicKey')
    .expect(415)

  pass(
    'non-JSON authorization request rejected',
  )
}

/*
 * Verify the actual WP5 router rejects candidate leakage BEFORE
 * either face Python or fingerprint hardware can execute.
 */
{
  const app =
    express()

  app.use(
    express.json({
      limit: '16kb',
      strict: true,
    }),
  )

  app.use(
    '/api/wp5',
    wp5Routes,
  )

  await request(app)
    .post('/api/wp5/authorize/face')
    .send({
      credentialPublicKey:
        validJwk,
      candidateId: 2,
    })
    .expect(400)

  pass(
    'face WP5 route rejects candidate field before biometric execution',
  )

  await request(app)
    .post('/api/wp5/authorize/fingerprint')
    .send({
      credentialPublicKey:
        validJwk,
      candidateId: 2,
    })
    .expect(400)

  pass(
    'fingerprint WP5 route rejects candidate field before hardware execution',
  )
}

/*
 * Legacy candidate-aware APIs must stay unreachable.
 */
{
  const app =
    express()

  app.use(
    express.json({
      limit: '16kb',
      strict: true,
    }),
  )

  app.use(
    '/api/votes',
    voteRoutes,
  )

  app.use(
    '/api/biometric',
    biometricRoutes,
  )

  await request(app)
    .post('/api/votes/verify-face')
    .send({
      candidateId: 1,
    })
    .expect(410)

  pass(
    'legacy candidate-aware face route remains disabled',
  )

  await request(app)
    .post('/api/biometric/fingerprint/detect')
    .send({
      candidateId: 1,
    })
    .expect(410)

  pass(
    'legacy candidate-aware fingerprint route remains disabled',
  )
}

/*
 * Request-body size gate.
 */
{
  const app =
    express()

  app.use(
    express.json({
      limit: '16kb',
      strict: true,
    }),
  )

  app.post(
    '/body',
    (_req, res) =>
      res.json({
        ok: true,
      }),
  )

  await request(app)
    .post('/body')
    .set(
      'Content-Type',
      'application/json',
    )
    .send(
      JSON.stringify({
        payload:
          'x'.repeat(
            20 * 1024,
          ),
      }),
    )
    .expect(413)

  pass(
    'oversized JSON body rejected',
  )
}

/*
 * Deterministic concurrency simulation.
 *
 * All calls initially observe the same free index. The simulated unique
 * database index chooses one winner; losers retry until indices 0..19
 * are committed without duplicates or gaps.
 */
{
  const used =
    new Set()

  let collisionCount =
    0

  const allocateIndex =
    async () => {
      if (
        used.size === 0
      ) {
        return 0
      }

      return (
        Math.max(
          ...used,
        ) + 1
      )
    }

  const saveAtIndex =
    async index => {
      /*
       * Yield so concurrent requests can observe the same candidate index
       * before any simulated insert commits.
       */
      await Promise.resolve()

      if (
        used.has(index)
      ) {
        collisionCount += 1

        const error =
          new Error(
            'duplicate wp5GroupIndex',
          )

        error.code =
          11000

        error.keyPattern = {
          wp5GroupIndex: 1,
        }

        throw error
      }

      used.add(index)

      return {
        index,
      }
    }

  await Promise.all(
    Array.from(
      {
        length: 20,
      },
      () =>
        saveVoterWithWp5IndexRetry({
          allocateIndex,
          saveAtIndex,
        }),
    ),
  )

  const ordered =
    [...used]
      .sort(
        (a, b) =>
          a - b,
      )

  assert.deepEqual(
    ordered,
    Array.from(
      {
        length: 20,
      },
      (_unused, index) =>
        index,
    ),
  )

  assert.ok(
    collisionCount > 0,
    'simulation did not exercise duplicate-index retry',
  )

  pass(
    'concurrent WP5 registration resolves duplicate-index races without gaps',
  )
}

/*
 * Do not retry unrelated unique-key failures.
 */
{
  let attempts = 0

  await assert.rejects(
    () =>
      saveVoterWithWp5IndexRetry({
        allocateIndex:
          async () => 0,

        saveAtIndex:
          async () => {
            attempts += 1

            const error =
              new Error(
                'duplicate nationalId',
              )

            error.code =
              11000

            error.keyPattern = {
              nationalId: 1,
            }

            throw error
          },
      }),
  )

  assert.equal(
    attempts,
    1,
  )

  pass(
    'unrelated unique-key failure is not retried as an index race',
  )
}

console.log()
console.log(
  'STATUS=PASS_WP7A_SECURITY_NEGATIVE_TESTS',
)
