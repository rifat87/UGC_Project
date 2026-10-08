from pathlib import Path
import sys

root = Path(sys.argv[1])

back = root / "votechain-central-server"
front = root / "votechain-frontend-ts"
crypto = root / "crypto"

candidate = back / "routes/candidateRoutes.js"
voter = back / "routes/voterRoutes.js"
biometric = back / "routes/biometricRoutes.js"
fingerprint = back / "controllers/fingerprintController.js"
server = back / "server.js"
api = front / "src/services/api.ts"
core = crypto / "src/wp6-threshold.mjs"


def replace_once(path, old, new, label, marker=None):
    text = path.read_text(encoding="utf-8")

    if marker and marker in text:
        print(f"{label}=ALREADY_PATCHED")
        return

    if old not in text:
        raise RuntimeError(
            f"{label}: expected anchor missing in {path}"
        )

    text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")
    print(f"{label}=PATCHED")


# ------------------------------------------------------------------
# Candidate router: every mutation is privileged.
# ------------------------------------------------------------------

text = candidate.read_text(encoding="utf-8")

if "requireWp5AdminMutation" not in text:
    anchor = "import validate from '../middleware/validate.js'\n"

    replacement = """import validate from '../middleware/validate.js'
import {
  requireWp5AdminMutation,
} from '../middleware/adminRequestSecurity.js'
"""

    if anchor not in text:
        raise RuntimeError(
            "candidateRoutes validation import anchor missing"
        )

    text = text.replace(
        anchor,
        replacement,
        1,
    )

    anchor = "const router = express.Router()\n"

    replacement = """const router = express.Router()

router.use(
  requireWp5AdminMutation,
)
"""

    if anchor not in text:
        raise RuntimeError(
            "candidateRoutes router anchor missing"
        )

    text = text.replace(
        anchor,
        replacement,
        1,
    )

    candidate.write_text(
        text,
        encoding="utf-8",
    )

    print("CANDIDATE_ADMIN_GUARD=PATCHED")
else:
    print("CANDIDATE_ADMIN_GUARD=ALREADY_PATCHED")


# ------------------------------------------------------------------
# Voter router: every active mutation is privileged.
# ------------------------------------------------------------------

text = voter.read_text(encoding="utf-8")

if "requireWp5AdminMutation" not in text:
    anchor = "import validate from '../middleware/validate.js';\n"

    replacement = """import validate from '../middleware/validate.js';
import {
  requireWp5AdminMutation,
} from '../middleware/adminRequestSecurity.js';
"""

    if anchor not in text:
        raise RuntimeError(
            "voterRoutes validation import anchor missing"
        )

    text = text.replace(
        anchor,
        replacement,
        1,
    )

    anchor = "const router = express.Router();\n"

    replacement = """const router = express.Router();

router.use(
  requireWp5AdminMutation,
);
"""

    if anchor not in text:
        raise RuntimeError(
            "voterRoutes router anchor missing"
        )

    text = text.replace(
        anchor,
        replacement,
        1,
    )

    voter.write_text(
        text,
        encoding="utf-8",
    )

    print("VOTER_ADMIN_GUARD=PATCHED")
else:
    print("VOTER_ADMIN_GUARD=ALREADY_PATCHED")


# ------------------------------------------------------------------
# Biometric router: protect active enrollment/destructive operations,
# while keeping the legacy DETECT endpoint reachable only to return 410.
# ------------------------------------------------------------------

text = biometric.read_text(encoding="utf-8")

if "requireWp5AdminRequest" not in text:
    anchor = "import fingerprintController from '../controllers/fingerprintController.js';\n"

    replacement = """import fingerprintController from '../controllers/fingerprintController.js';
import {
    requireWp5AdminRequest,
} from '../middleware/adminRequestSecurity.js';
"""

    if anchor not in text:
        raise RuntimeError(
            "biometricRoutes import anchor missing"
        )

    text = text.replace(
        anchor,
        replacement,
        1,
    )

    old = "router.post('/capture-face', async (req, res) => {"
    new = "router.post('/capture-face', requireWp5AdminRequest, async (req, res) => {"

    if old not in text:
        raise RuntimeError(
            "capture-face route anchor missing"
        )

    text = text.replace(
        old,
        new,
        1,
    )

    old = "router.post('/fingerprint/enroll', fingerprintController.captureFingerprint);"
    new = "router.post('/fingerprint/enroll', requireWp5AdminRequest, fingerprintController.captureFingerprint);"

    if old not in text:
        raise RuntimeError(
            "fingerprint enroll route anchor missing"
        )

    text = text.replace(
        old,
        new,
        1,
    )

    old = "router.post('/fingerprint/format', fingerprintController.formatFingerprintDatabase);"
    new = "router.post('/fingerprint/format', requireWp5AdminRequest, fingerprintController.formatFingerprintDatabase);"

    if old not in text:
        raise RuntimeError(
            "fingerprint format route anchor missing"
        )

    text = text.replace(
        old,
        new,
        1,
    )

    biometric.write_text(
        text,
        encoding="utf-8",
    )

    print("BIOMETRIC_ADMIN_GUARDS=PATCHED")
else:
    print("BIOMETRIC_ADMIN_GUARDS=ALREADY_PATCHED")


# ------------------------------------------------------------------
# Remove device/internal exception strings from client responses.
# ------------------------------------------------------------------

text = fingerprint.read_text(
    encoding="utf-8",
)

old = "return res.status(500).json({ success: false, error: error.message })"

if old in text:
    text = text.replace(
        old,
        """return res.status(500).json({
      success: false,
      message: "Fingerprint device operation failed",
    })""",
    )

    fingerprint.write_text(
        text,
        encoding="utf-8",
    )

    print("FINGERPRINT_ERROR_RESPONSE_HYGIENE=PATCHED")
else:
    print("FINGERPRINT_ERROR_RESPONSE_HYGIENE=ALREADY_PATCHED_OR_NOT_NEEDED")


text = biometric.read_text(
    encoding="utf-8",
)

text = text.replace(
    """message: 'Failed to start face capture process',
                    error: err.message""",
    """message: 'Failed to start face capture process'""",
)

text = text.replace(
    """message: 'Failed to start face capture process',
                error: error.message""",
    """message: 'Failed to start face capture process'""",
)

biometric.write_text(
    text,
    encoding="utf-8",
)

print("BIOMETRIC_ERROR_RESPONSE_HYGIENE=PATCHED")


# ------------------------------------------------------------------
# Global body/parser error hygiene.
# ------------------------------------------------------------------

replace_once(
    server,
    """app.use((error, _req, res, _next) => {
  console.error(error.stack)
  res.status(500).json({ success: false, message: 'Something went wrong!' })
})
""",
    """app.use((error, _req, res, _next) => {
  if (
    error?.type === 'entity.too.large' ||
    Number(error?.status) === 413
  ) {
    return res.status(413).json({
      success: false,
      message: 'Request body is too large',
    })
  }

  console.error(
    '[Server] unhandled request error:',
    error?.message || 'unknown error',
  )

  return res.status(500).json({
    success: false,
    message: 'Something went wrong!',
  })
})
""",
    "SERVER_ERROR_RESPONSE_HYGIENE",
    marker="Request body is too large",
)


# ------------------------------------------------------------------
# Frontend REST layer: administrator mutations sign through wallet.
# ------------------------------------------------------------------

text = api.read_text(
    encoding="utf-8",
)

if 'from "@/services/adminAuth"' not in text:
    anchor = 'import { apiUrl } from "@/config/api"\n'

    replacement = """import { apiUrl } from "@/config/api"
import {
  adminFetch,
} from "@/services/adminAuth"
"""

    if anchor not in text:
        raise RuntimeError(
            "frontend api import anchor missing"
        )

    text = text.replace(
        anchor,
        replacement,
        1,
    )

    old = """async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init)
"""

    new = """async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method =
    (init?.method || "GET").toUpperCase()

  const privileged =
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    (
      path.startsWith("/api/candidates") ||
      path.startsWith("/api/voters") ||
      path.startsWith("/api/biometric")
    )

  const response =
    privileged
      ? await adminFetch(path, init)
      : await fetch(apiUrl(path), init)
"""

    if old not in text:
        raise RuntimeError(
            "frontend request helper anchor missing"
        )

    text = text.replace(
        old,
        new,
        1,
    )

    text = text.replace(
        'const response = await fetch(apiUrl("/api/voters"), {',
        'const response = await adminFetch("/api/voters", {',
        1,
    )

    text = text.replace(
        'const response = await fetch(apiUrl("/api/voters/zk-registration-status"), {',
        'const response = await adminFetch("/api/voters/zk-registration-status", {',
        1,
    )

    api.write_text(
        text,
        encoding="utf-8",
    )

    print("FRONTEND_ADMIN_API_SIGNING=PATCHED")
else:
    print("FRONTEND_ADMIN_API_SIGNING=ALREADY_PATCHED")


# ------------------------------------------------------------------
# WP6 public transcript verifier hardening.
#
# This is an intentional WP7 security patch to the previously frozen WP6
# implementation. The pre-WP7 core hash remains preserved in evidence.
# ------------------------------------------------------------------

text = core.read_text(
    encoding="utf-8",
)

if "WP7_DKG_STRUCTURAL_BINDING" not in text:
    anchor = """  if (
    transcript
      .participantCommitments
      .length !==
    transcript
      .trusteeCount
  ) {
    throw new Error(
      "incomplete participant commitments",
    )
  }

  const derivedPublicKey =
"""

    insertion = """  if (
    transcript
      .participantCommitments
      .length !==
    transcript
      .trusteeCount
  ) {
    throw new Error(
      "incomplete participant commitments",
    )
  }

  /*
   * WP7_DKG_STRUCTURAL_BINDING
   *
   * The public ceremony transcript must contain exactly one polynomial
   * commitment set for each trustee, exactly threshold commitments per
   * participant, and a complete n*n matrix of encrypted-delivery hashes.
   */
  const participantIds =
    transcript
      .participantCommitments
      .map(
        contribution =>
          Number(
            contribution
              .trusteeId,
          ),
      )

  if (
    participantIds.some(
      id =>
        !Number.isSafeInteger(id) ||
        id < 1 ||
        id >
          transcript
            .trusteeCount,
    ) ||
    new Set(
      participantIds,
    ).size !==
      transcript
        .trusteeCount
  ) {
    throw new Error(
      "invalid or duplicate DKG participant id",
    )
  }

  const orderedParticipantIds =
    [...participantIds]
      .sort(
        (a, b) =>
          a - b,
      )

  orderedParticipantIds
    .forEach(
      (
        id,
        index,
      ) => {
        if (
          id !==
          index + 1
        ) {
          throw new Error(
            "incomplete DKG participant roster",
          )
        }
      },
    )

  for (
    const contribution
    of transcript
      .participantCommitments
  ) {
    if (
      !Array.isArray(
        contribution
          .commitments,
      ) ||
      contribution
        .commitments
        .length !==
          transcript
            .threshold
    ) {
      throw new Error(
        "invalid DKG commitment count",
      )
    }

    for (
      const commitment
      of contribution
        .commitments
    ) {
      pointFromSerialized(
        c,
        commitment,
      )
    }
  }

  if (
    !Array.isArray(
      transcript
        .deliveryHashes,
    ) ||
    transcript
      .deliveryHashes
      .length !==
        transcript
          .trusteeCount *
        transcript
          .trusteeCount
  ) {
    throw new Error(
      "incomplete DKG delivery hash matrix",
    )
  }

  const deliveryPairs =
    new Set()

  for (
    const delivery
    of transcript
      .deliveryHashes
  ) {
    const senderId =
      Number(
        delivery
          .senderId,
      )

    const recipientId =
      Number(
        delivery
          .recipientId,
      )

    if (
      !Number.isSafeInteger(
        senderId,
      ) ||
      !Number.isSafeInteger(
        recipientId,
      ) ||
      senderId < 1 ||
      senderId >
        transcript
          .trusteeCount ||
      recipientId < 1 ||
      recipientId >
        transcript
          .trusteeCount ||
      !/^[0-9a-f]{64}$/i.test(
        String(
          delivery
            .sha256 ||
          "",
        ),
      )
    ) {
      throw new Error(
        "invalid DKG delivery hash record",
      )
    }

    const pair =
      `${senderId}:${recipientId}`

    if (
      deliveryPairs.has(
        pair,
      )
    ) {
      throw new Error(
        "duplicate DKG delivery hash pair",
      )
    }

    deliveryPairs.add(
      pair,
    )
  }

  const derivedPublicKey =
"""

    if anchor not in text:
        raise RuntimeError(
            "WP6 verifyDkgTranscript anchor missing"
        )

    text = text.replace(
        anchor,
        insertion,
        1,
    )

    core.write_text(
        text,
        encoding="utf-8",
    )

    print("WP6_DKG_STRUCTURE_HARDENING=PATCHED")
else:
    print("WP6_DKG_STRUCTURE_HARDENING=ALREADY_PATCHED")


text = core.read_text(
    encoding="utf-8",
)

if "WP7_DKG_TRANSCRIPT_HASH_BINDING" not in text:
    anchor = """  verifyDkgTranscript(
    c,
    transcript
      .dkgTranscript,
  )

  const threshold =
"""

    insertion = """  /*
   * WP7_DKG_TRANSCRIPT_HASH_BINDING
   *
   * A finalization transcript is valid only for the exact DKG transcript
   * whose canonical SHA-256 hash was pinned for the election.
   */
  const statedDkgTranscriptHash =
    String(
      transcript
        .dkgTranscriptHash ||
      "",
    )
      .toLowerCase()

  if (
    !/^[0-9a-f]{64}$/.test(
      statedDkgTranscriptHash,
    )
  ) {
    throw new Error(
      "invalid DKG transcript hash",
    )
  }

  const computedDkgTranscriptHash =
    canonicalSha256(
      transcript
        .dkgTranscript,
    )

  if (
    computedDkgTranscriptHash !==
      statedDkgTranscriptHash
  ) {
    throw new Error(
      "DKG transcript hash mismatch",
    )
  }

  verifyDkgTranscript(
    c,
    transcript
      .dkgTranscript,
  )

  const threshold =
"""

    if anchor not in text:
        raise RuntimeError(
            "WP6 finalization verifier anchor missing"
        )

    text = text.replace(
        anchor,
        insertion,
        1,
    )

    core.write_text(
        text,
        encoding="utf-8",
    )

    print("WP6_FINALIZATION_DKG_HASH_BINDING=PATCHED")
else:
    print("WP6_FINALIZATION_DKG_HASH_BINDING=ALREADY_PATCHED")
