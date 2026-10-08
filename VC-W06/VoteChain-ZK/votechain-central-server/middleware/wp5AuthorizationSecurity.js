const COORDINATE =
  /^[A-Za-z0-9_-]{43}$/

function configuredOrigins(
  env = process.env,
) {
  return new Set(
    String(
      env.FRONTEND_ORIGINS ||
      '',
    )
      .split(',')
      .map(
        value =>
          value.trim(),
      )
      .filter(Boolean),
  )
}

function isRecord(
  value,
) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value),
  )
}

/*
 * Validate the browser-generated public half of the ephemeral
 * P-256 credential-release key before any biometric operation.
 *
 * In particular:
 *   - private JWK material is forbidden;
 *   - P-256 coordinates must be canonical 32-byte base64url values;
 *   - unexpected JWK fields are rejected.
 */
export function validateWp5PublicJwk(
  value,
) {
  if (!isRecord(value)) {
    throw new Error(
      'credentialPublicKey must be a public P-256 JWK',
    )
  }

  const allowed =
    new Set([
      'kty',
      'crv',
      'x',
      'y',
      'ext',
      'key_ops',
      'alg',
      'use',
    ])

  for (
    const key
    of Object.keys(value)
  ) {
    if (!allowed.has(key)) {
      throw new Error(
        'credentialPublicKey contains an unexpected field',
      )
    }
  }

  if (
    value.kty !== 'EC' ||
    value.crv !== 'P-256' ||
    typeof value.x !== 'string' ||
    typeof value.y !== 'string' ||
    !COORDINATE.test(value.x) ||
    !COORDINATE.test(value.y) ||
    Object.prototype.hasOwnProperty.call(
      value,
      'd',
    )
  ) {
    throw new Error(
      'credentialPublicKey must be a public P-256 JWK',
    )
  }

  if (
    value.key_ops !== undefined &&
    (
      !Array.isArray(value.key_ops) ||
      !value.key_ops.every(
        item =>
          typeof item === 'string',
      )
    )
  ) {
    throw new Error(
      'credentialPublicKey key_ops is invalid',
    )
  }

  return value
}

/*
 * Browser requests carry Origin. Non-browser/internal research clients
 * may omit it, but if Origin is present it MUST be an explicitly
 * configured frontend origin.
 */
export function requireWp5AllowedOrigin(
  req,
  res,
  next,
) {
  const origin =
    req.get('origin')

  if (!origin) {
    return next()
  }

  const allowed =
    configuredOrigins()

  if (
    allowed.size === 0 ||
    !allowed.has(origin)
  ) {
    return res.status(403).json({
      success: false,
      message:
        'Request origin is not authorized for private-voting authorization',
    })
  }

  return next()
}

/*
 * Candidate-blind authorization has exactly one request-body property.
 * This deliberately rejects candidateId, selectedCandidate, or any
 * accidental future plaintext vote field instead of silently ignoring it.
 */
export function validateWp5AuthorizationRequest(
  req,
  res,
  next,
) {
  if (!req.is('application/json')) {
    return res.status(415).json({
      success: false,
      message:
        'Private-voting authorization requires application/json',
    })
  }

  if (!isRecord(req.body)) {
    return res.status(400).json({
      success: false,
      message:
        'Invalid private-voting authorization request',
    })
  }

  const keys =
    Object.keys(req.body)

  if (
    keys.length !== 1 ||
    keys[0] !==
      'credentialPublicKey'
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Authorization request must contain only credentialPublicKey',
    })
  }

  try {
    validateWp5PublicJwk(
      req.body
        .credentialPublicKey,
    )
  } catch {
    return res.status(400).json({
      success: false,
      message:
        'Invalid credentialPublicKey',
    })
  }

  return next()
}
