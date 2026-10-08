from pathlib import Path
import re
import sys

root = Path(sys.argv[1])

server = root / "votechain-central-server/server.js"
routes = root / "votechain-central-server/routes/wp5Routes.js"
model = root / "votechain-central-server/models/Voter.js"
voter = root / "votechain-central-server/controllers/voterController.js"
worker = root / "votechain-frontend-ts/src/privacy/wp5Privacy.worker.ts"


def replace_once(path, old, new, label, marker=None):
    text = path.read_text(encoding="utf-8")

    if marker and marker in text:
        print(f"{label}=ALREADY_PATCHED")
        return

    if old not in text:
        raise RuntimeError(
            f"{label}: expected source anchor not found in {path}"
        )

    text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")
    print(f"{label}=PATCHED")


# ------------------------------------------------------------------
# Express request-size hardening.
# ------------------------------------------------------------------

replace_once(
    server,
    """app.use(express.json())
app.use(express.urlencoded({ extended: true }))
""",
    """app.use(express.json({
  limit: '16kb',
  strict: true,
}))
app.use(express.urlencoded({
  extended: true,
  limit: '16kb',
  parameterLimit: 50,
}))
""",
    "SERVER_BODY_LIMIT",
    marker="limit: '16kb'",
)


# ------------------------------------------------------------------
# WP5 route guards / endpoint-specific throttling.
# ------------------------------------------------------------------

text = routes.read_text(encoding="utf-8")

if "WP5_AUTHORIZATION_RATE_LIMIT" not in text:
    text = text.replace(
        "import express from 'express'\n",
        """import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  requireWp5AllowedOrigin,
  validateWp5AuthorizationRequest,
} from '../middleware/wp5AuthorizationSecurity.js'
""",
        1,
    )

    anchor = "const router = express.Router()\n"

    if anchor not in text:
        raise RuntimeError(
            "wp5Routes router anchor missing"
        )

    text = text.replace(
        anchor,
        """const router = express.Router()

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
""",
        1,
    )

    old = """router.post('/authorize/face', authorizeFace)
router.post(
  '/authorize/fingerprint',
  fingerprintController.detectWp5Fingerprint,
)
"""

    new = """router.post(
  '/authorize/face',
  ...wp5AuthorizationGuards,
  authorizeFace,
)
router.post(
  '/authorize/fingerprint',
  ...wp5AuthorizationGuards,
  fingerprintController.detectWp5Fingerprint,
)
"""

    if old not in text:
        raise RuntimeError(
            "WP5 authorization route block missing"
        )

    text = text.replace(
        old,
        new,
        1,
    )

    routes.write_text(
        text,
        encoding="utf-8",
    )

    print("WP5_AUTH_ROUTE_GUARDS=PATCHED")
else:
    print("WP5_AUTH_ROUTE_GUARDS=ALREADY_PATCHED")


# ------------------------------------------------------------------
# Preserve Mongo duplicate-key metadata through the schema hook.
# The concurrency retry layer needs keyPattern.wp5GroupIndex.
# ------------------------------------------------------------------

replace_once(
    model,
    """voterSchema.post('save', function duplicateKeyError(error, _doc, next) {
  if ((error.name === 'MongoError' || error.name === 'MongoServerError') && error.code === 11000) {
    next(new Error('A voter with this National ID or ZK identity commitment already exists'))
  } else {
    next(error)
  }
})
""",
    """voterSchema.post('save', function duplicateKeyError(error, _doc, next) {
  if (
    (error.name === 'MongoError' ||
      error.name === 'MongoServerError') &&
    error.code === 11000
  ) {
    const duplicate =
      new Error(
        'A voter with duplicate identity or registration-index data already exists',
      )

    duplicate.name =
      error.name
    duplicate.code =
      error.code
    duplicate.keyPattern =
      error.keyPattern
    duplicate.keyValue =
      error.keyValue

    next(duplicate)
  } else {
    next(error)
  }
})
""",
    "VOTER_DUPLICATE_METADATA",
    marker="duplicate.keyPattern",
)


# ------------------------------------------------------------------
# Registration concurrency retry.
# ------------------------------------------------------------------

text = voter.read_text(
    encoding="utf-8",
)

if "saveVoterWithWp5IndexRetry" not in text:
    anchor = """import { createWp5Credential, allocateWp5GroupIndex } from '../services/zk/wp5PrivacyService.js'
"""

    replacement = """import { createWp5Credential, allocateWp5GroupIndex } from '../services/zk/wp5PrivacyService.js'
import { saveVoterWithWp5IndexRetry } from '../services/zk/wp5RegistrationCore.js'
"""

    if anchor not in text:
        raise RuntimeError(
            "voterController import anchor missing"
        )

    text = text.replace(
        anchor,
        replacement,
        1,
    )

    old = """    const { identityCommitment, encryptedCredential } = await createEncryptedSemaphoreIdentity()
    const wp5 = await createWp5Credential()
    const wp5GroupIndex = await allocateWp5GroupIndex()
    const voter = new Voter({
      nationalId,
      name,
      dateOfBirth,
      location,
      zkIdentityCommitment: identityCommitment,
      zkCredential: encryptedCredential,
      zkRegistrationStatus: 'pending',
      wp5IdentityCommitment: wp5.identityCommitment,
      wp5Credential: wp5.encryptedCredential,
      wp5RegistrationStatus: 'registered',
      wp5GroupIndex,
    })

    await voter.save()
"""

    new = """    const { identityCommitment, encryptedCredential } = await createEncryptedSemaphoreIdentity()
    const wp5 = await createWp5Credential()

    const voter =
      await saveVoterWithWp5IndexRetry({
        allocateIndex:
          allocateWp5GroupIndex,

        saveAtIndex:
          async (
            wp5GroupIndex,
          ) => {
            const candidate =
              new Voter({
                nationalId,
                name,
                dateOfBirth,
                location,
                zkIdentityCommitment:
                  identityCommitment,
                zkCredential:
                  encryptedCredential,
                zkRegistrationStatus:
                  'pending',
                wp5IdentityCommitment:
                  wp5.identityCommitment,
                wp5Credential:
                  wp5.encryptedCredential,
                wp5RegistrationStatus:
                  'registered',
                wp5GroupIndex,
              })

            await candidate.save()

            return candidate
          },
      })
"""

    if old not in text:
        raise RuntimeError(
            "voterController registration block missing"
        )

    text = text.replace(
        old,
        new,
        1,
    )

    voter.write_text(
        text,
        encoding="utf-8",
    )

    print("WP5_REGISTRATION_RETRY=PATCHED")
else:
    print("WP5_REGISTRATION_RETRY=ALREADY_PATCHED")


# ------------------------------------------------------------------
# Prevent deletion of an active WP5 member. Removing an interior member
# would violate the contiguous-index Merkle representation.
# ------------------------------------------------------------------

replace_once(
    voter,
    """    if (voter.zkRegistrationStatus === 'registered') {
      return res.status(409).json({
        message: 'A voter with an on-chain ZK commitment cannot be deleted from the active election record',
      })
    }
""",
    """    if (
      voter.zkRegistrationStatus === 'registered' ||
      voter.wp5RegistrationStatus === 'registered'
    ) {
      return res.status(409).json({
        message:
          'A voter with an active election credential cannot be deleted from the election record',
      })
    }
""",
    "WP5_REGISTERED_DELETE_GUARD",
    marker="voter.wp5RegistrationStatus === 'registered'",
)


# ------------------------------------------------------------------
# Browser worker single-use authorization state.
# ------------------------------------------------------------------

text = worker.read_text(
    encoding="utf-8",
)

if "authorizationSessionState:" not in text:
    anchor = """let sessionKeyPair:
  CryptoKeyPair | null =
    null
"""

    addition = """let sessionKeyPair:
  CryptoKeyPair | null =
    null

let authorizationSessionState:
  "idle" |
  "initializing" |
  "ready" |
  "consuming" =
    "idle"
"""

    if anchor not in text:
        raise RuntimeError(
            "worker session-key anchor missing"
        )

    text = text.replace(
        anchor,
        addition,
        1,
    )

    begin_pattern = re.compile(
        r'async function beginAuthorization\(\) \{.*?\n\}\n\nasync function unwrapCredential',
        re.S,
    )

    begin_match = begin_pattern.search(
        text,
    )

    if not begin_match:
        raise RuntimeError(
            "worker beginAuthorization block missing"
        )

    begin_replacement = """async function beginAuthorization() {
  if (
    authorizationSessionState !==
      "idle" ||
    sessionKeyPair
  ) {
    throw new Error(
      "A WP5 authorization session is already active",
    )
  }

  authorizationSessionState =
    "initializing"

  try {
    sessionKeyPair =
      await crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256",
        },
        true,
        ["deriveBits"],
      )

    const publicKey =
      await crypto.subtle.exportKey(
        "jwk",
        sessionKeyPair.publicKey,
      )

    authorizationSessionState =
      "ready"

    return {
      credentialPublicKey:
        publicKey,
    }
  } catch (error) {
    sessionKeyPair =
      null

    authorizationSessionState =
      "idle"

    throw error
  }
}

async function unwrapCredential"""

    text = (
        text[:begin_match.start()] +
        begin_replacement +
        text[begin_match.end():]
    )

    prepare_index = text.index(
        "async function prepareBallot(",
    )

    opening = text.index(
        ") {\n  let secret = 0n",
        prepare_index,
    )

    old_opening = """) {
  let secret = 0n"""

    new_opening = """) {
  if (
    authorizationSessionState !==
      "ready" ||
    !sessionKeyPair
  ) {
    throw new Error(
      "WP5 authorization session is not available for ballot preparation",
    )
  }

  /*
   * Transition synchronously before the first await so a second
   * PREPARE_BALLOT message cannot consume the same credential session.
   */
  authorizationSessionState =
    "consuming"

  let secret = 0n"""

    segment = text[
        prepare_index:
    ]

    if old_opening not in segment:
        raise RuntimeError(
            "worker prepareBallot opening missing"
        )

    segment = segment.replace(
        old_opening,
        new_opening,
        1,
    )

    text = (
        text[:prepare_index] +
        segment
    )

    request_index = text.index(
        "type RequestMessage",
        prepare_index,
    )

    prepare_segment = text[
        prepare_index:
        request_index
    ]

    cleanup_old = """    sessionKeyPair =
      null
  }
}
"""

    cleanup_new = """    sessionKeyPair =
      null

    authorizationSessionState =
      "idle"
  }
}
"""

    if cleanup_old not in prepare_segment:
        raise RuntimeError(
            "worker prepareBallot cleanup missing"
        )

    prepare_segment = prepare_segment.replace(
        cleanup_old,
        cleanup_new,
        1,
    )

    text = (
        text[:prepare_index] +
        prepare_segment +
        text[request_index:]
    )

    clear_old = """        sessionKeyPair =
          null

        result = {
          cleared: true,
        }
"""

    clear_new = """        sessionKeyPair =
          null

        authorizationSessionState =
          "idle"

        result = {
          cleared: true,
        }
"""

    if clear_old not in text:
        raise RuntimeError(
            "worker CLEAR block missing"
        )

    text = text.replace(
        clear_old,
        clear_new,
        1,
    )

    # Cleanup is owned by beginAuthorization() and prepareBallot().
    # A second concurrent PREPARE must not clear the first request's
    # key merely because the second request was rejected.
    catch_old = """    } catch (error) {
      sessionKeyPair =
        null

      self.postMessage({
"""

    catch_new = """    } catch (error) {
      self.postMessage({
"""

    if catch_old not in text:
        raise RuntimeError(
            "worker dispatch catch block missing"
        )

    text = text.replace(
        catch_old,
        catch_new,
        1,
    )

    worker.write_text(
        text,
        encoding="utf-8",
    )

    print("WP5_WORKER_SINGLE_USE_SESSION=PATCHED")
else:
    print("WP5_WORKER_SINGLE_USE_SESSION=ALREADY_PATCHED")
