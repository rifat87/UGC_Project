import assert from 'node:assert/strict'

import {
  mkdtemp,
  rm,
} from 'node:fs/promises'

import {
  tmpdir,
} from 'node:os'

import {
  join,
} from 'node:path'

import express from 'express'
import request from 'supertest'

import {
  Wallet,
} from 'ethers'

import {
  buildAdminRequestMessage,
  canonicalAdminJson,
  createAdminRequestVerifier,
  createFileReplayStore,
  hashAdminBody,
} from '../middleware/adminRequestSecurity.js'

const fixedNow =
  1_796_000_000_000

const admin =
  Wallet.createRandom()

const attacker =
  Wallet.createRandom()

const audience =
  Wallet.createRandom()
    .address

const temp =
  await mkdtemp(
    join(
      tmpdir(),
      'votechain-wp7b-admin-',
    ),
  )

async function authHeader({
  wallet = admin,
  claimedAddress =
    wallet.address,
  path = '/protected',
  method = 'POST',
  body = {
    value: 1,
  },
  timestamp =
    fixedNow,
  nonce =
    '0123456789abcdef0123456789abcdef',
}) {
  const bodyHash =
    hashAdminBody(
      body,
    )

  const message =
    buildAdminRequestMessage({
      audience,
      address:
        claimedAddress,
      method,
      path,
      timestamp:
        String(
          timestamp,
        ),
      nonce,
      bodyHash,
    })

  const signature =
    await wallet
      .signMessage(
        message,
      )

  return `VoteChainAdmin ${claimedAddress}.${timestamp}.${nonce}.${signature}`
}

function makeApp(
  replayDirectory,
) {
  const app =
    express()

  app.use(
    express.json({
      limit: '16kb',
      strict: true,
    }),
  )

  const verifier =
    createAdminRequestVerifier({
      resolveAdminContext:
        async () => ({
          admin:
            admin.address,
          audience,
        }),

      replayStore:
        createFileReplayStore(
          replayDirectory,
        ),

      now:
        () =>
          fixedNow,
    })

  app.post(
    '/protected',
    verifier,
    (
      req,
      res,
    ) => {
      assert.equal(
        req.voteChainAdmin
          .address
          .toLowerCase(),
        admin.address
          .toLowerCase(),
      )

      res.status(204).end()
    },
  )

  app.patch(
    '/protected',
    verifier,
    (_req, res) =>
      res.status(204).end(),
  )

  app.post(
    '/other',
    verifier,
    (_req, res) =>
      res.status(204).end(),
  )

  return app
}

function passed(
  name,
) {
  console.log(
    `[PASS] ${name}`,
  )
}

try {
  const replayDirectory =
    join(
      temp,
      'replay',
    )

  const app =
    makeApp(
      replayDirectory,
    )

  await request(app)
    .post('/protected')
    .send({
      value: 1,
    })
    .expect(401)

  passed(
    'unsigned privileged request rejected',
  )

  {
    const header =
      await authHeader({
        wallet:
          attacker,

        nonce:
          '11111111111111111111111111111111',
      })

    await request(app)
      .post('/protected')
      .set(
        'Authorization',
        header,
      )
      .send({
        value: 1,
      })
      .expect(403)

    passed(
      'non-admin wallet rejected',
    )
  }

  {
    const header =
      await authHeader({
        timestamp:
          fixedNow -
          61_000,

        nonce:
          '22222222222222222222222222222222',
      })

    await request(app)
      .post('/protected')
      .set(
        'Authorization',
        header,
      )
      .send({
        value: 1,
      })
      .expect(401)

    passed(
      'expired administrator signature rejected',
    )
  }

  {
    const header =
      await authHeader({
        timestamp:
          fixedNow +
          11_000,

        nonce:
          '33333333333333333333333333333333',
      })

    await request(app)
      .post('/protected')
      .set(
        'Authorization',
        header,
      )
      .send({
        value: 1,
      })
      .expect(401)

    passed(
      'far-future administrator signature rejected',
    )
  }

  {
    const body = {
      nested: {
        b: 2,
        a: 1,
      },
      list: [
        3,
        4,
      ],
    }

    const header =
      await authHeader({
        body,

        nonce:
          '44444444444444444444444444444444',
      })

    await request(app)
      .post('/protected')
      .set(
        'Authorization',
        header,
      )
      .send(body)
      .expect(204)

    passed(
      'valid admin wallet signature accepted',
    )
  }

  /*
   * Prove that canonical object-key sorting is deterministic.
   */
  assert.equal(
    canonicalAdminJson({
      b: 2,
      a: {
        d: 4,
        c: 3,
      },
    }),
    canonicalAdminJson({
      a: {
        c: 3,
        d: 4,
      },
      b: 2,
    }),
  )

  passed(
    'canonical JSON signing representation deterministic',
  )

  {
    const nonce =
      '55555555555555555555555555555555'

    const header =
      await authHeader({
        nonce,
      })

    await request(app)
      .post('/protected')
      .set(
        'Authorization',
        header,
      )
      .send({
        value: 1,
      })
      .expect(204)

    await request(app)
      .post('/protected')
      .set(
        'Authorization',
        header,
      )
      .send({
        value: 1,
      })
      .expect(409)

    passed(
      'same-process replay rejected',
    )

    /*
     * Construct a fresh middleware instance to model a backend restart.
     * The atomic nonce file must still reject the already-used request.
     */
    const restarted =
      makeApp(
        replayDirectory,
      )

    await request(restarted)
      .post('/protected')
      .set(
        'Authorization',
        header,
      )
      .send({
        value: 1,
      })
      .expect(409)

    passed(
      'replay remains rejected after verifier restart',
    )
  }

  {
    const header =
      await authHeader({
        body: {
          value: 1,
        },

        nonce:
          '66666666666666666666666666666666',
      })

    await request(app)
      .post('/protected')
      .set(
        'Authorization',
        header,
      )
      .send({
        value: 2,
      })
      .expect(401)

    passed(
      'signed body tampering rejected',
    )
  }

  {
    const header =
      await authHeader({
        path:
          '/protected',

        nonce:
          '77777777777777777777777777777777',
      })

    await request(app)
      .post('/other')
      .set(
        'Authorization',
        header,
      )
      .send({
        value: 1,
      })
      .expect(401)

    passed(
      'signed path substitution rejected',
    )
  }

  {
    const header =
      await authHeader({
        method:
          'POST',

        nonce:
          '88888888888888888888888888888888',
      })

    await request(app)
      .patch('/protected')
      .set(
        'Authorization',
        header,
      )
      .send({
        value: 1,
      })
      .expect(401)

    passed(
      'signed HTTP method substitution rejected',
    )
  }

  {
    const header =
      await authHeader({
        claimedAddress:
          attacker.address,

        wallet:
          admin,

        nonce:
          '99999999999999999999999999999999',
      })

    await request(app)
      .post('/protected')
      .set(
        'Authorization',
        header,
      )
      .send({
        value: 1,
      })
      .expect(403)

    passed(
      'claimed-wallet substitution rejected',
    )
  }

  console.log()
  console.log(
    'STATUS=PASS_WP7B_ADMIN_AUTH_NEGATIVE_MATRIX',
  )
} finally {
  await rm(
    temp,
    {
      recursive: true,
      force: true,
    },
  )
}
