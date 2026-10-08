
import {
  createHash,
  randomBytes,
} from "node:crypto"

import {
  getAddress,
  isAddress,
  verifyMessage,
} from "ethers"

import AdminChallenge
  from "../../models/AdminChallenge.js"

import {
  resolveAdminAuthority,
} from "./adminAuthorityService.js"

export const ADMIN_AUTH_SCHEME =
  "VoteChainAdminV2"

export const ADMIN_AUTH_VERSION =
  "VoteChain-ZK Admin Challenge v2"

const CHALLENGE_TTL_MS =
  2 * 60 * 1000

function authError(
  status,
  code,
  message,
) {
  const error =
    new Error(message)

  error.status =
    status

  error.code =
    code

  return error
}

function normalizeJson(
  value,
) {
  if (Array.isArray(value)) {
    return value.map(
      normalizeJson,
    )
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object
        .keys(value)
        .sort()
        .map(
          key => [
            key,
            normalizeJson(
              value[key],
            ),
          ],
        ),
    )
  }

  return value
}

export function canonicalAdminJson(
  value,
) {
  return JSON.stringify(
    normalizeJson(
      value === undefined
        ? null
        : value,
    ),
  )
}

export function hashAdminBody(
  value,
) {
  return createHash(
    "sha256",
  )
    .update(
      canonicalAdminJson(
        value,
      ),
      "utf8",
    )
    .digest(
      "hex",
    )
}

function buildMessage({
  audience,
  chainId,
  address,
  method,
  path,
  bodyHash,
  challengeId,
  issuedAt,
  expiresAt,
}) {
  return [
    ADMIN_AUTH_VERSION,
    `audience:${audience}`,
    `chain-id:${chainId}`,
    `address:${address.toLowerCase()}`,
    `method:${method.toUpperCase()}`,
    `path:${path}`,
    `body-sha256:${bodyHash.toLowerCase()}`,
    `challenge-id:${challengeId}`,
    `issued-at:${issuedAt}`,
    `expires-at:${expiresAt}`,
  ].join("\n")
}

export async function
getAdminAuthorityContext() {
  return resolveAdminAuthority()
}

export async function
issueAdminChallenge({
  address,
  method,
  path,
  bodyHash,
}) {
  if (!isAddress(address)) {
    throw authError(
      400,
      "INVALID_ADMIN_ADDRESS",
      "A valid administrator wallet address is required",
    )
  }

  if (
    !/^[0-9a-fA-F]{64}$/
      .test(
        String(bodyHash),
      )
  ) {
    throw authError(
      400,
      "INVALID_BODY_HASH",
      "A valid SHA-256 request-body digest is required",
    )
  }

  const normalizedMethod =
    String(method)
      .toUpperCase()

  if (
    ![
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ].includes(
      normalizedMethod,
    )
  ) {
    throw authError(
      400,
      "INVALID_ADMIN_METHOD",
      "Administrator request method is invalid",
    )
  }

  if (
    typeof path !== "string" ||
    !path.startsWith("/api/")
  ) {
    throw authError(
      400,
      "INVALID_ADMIN_PATH",
      "Administrator request path is invalid",
    )
  }

  const authority =
    await resolveAdminAuthority()

  const normalizedAddress =
    getAddress(address)

  if (
    normalizedAddress !==
    authority.admin
  ) {
    throw authError(
      403,
      "NOT_ELECTION_ADMIN",
      "The connected wallet is not the VoteChain election administrator",
    )
  }

  const challengeId =
    randomBytes(32)
      .toString("hex")

  const issuedAt =
    Date.now()

  const expiresAt =
    issuedAt +
    CHALLENGE_TTL_MS

  const audience =
    "votechain-zk-admin"

  const message =
    buildMessage({
      audience,
      chainId:
        authority.chainId,
      address:
        normalizedAddress,
      method:
        normalizedMethod,
      path,
      bodyHash:
        String(bodyHash),
      challengeId,
      issuedAt,
      expiresAt,
    })

  await AdminChallenge.create({
    challengeId,

    address:
      normalizedAddress,

    method:
      normalizedMethod,

    path,

    bodyHash:
      String(bodyHash)
        .toLowerCase(),

    message,

    audience,

    chainId:
      authority.chainId,

    issuedAt:
      new Date(issuedAt),

    expiresAt:
      new Date(expiresAt),
  })

  return {
    challengeId,
    message,
    issuedAt,
    expiresAt,
    audience,
    address:
      normalizedAddress,
    chainId:
      authority.chainId,
  }
}

function parseAuthorization(
  header,
) {
  if (
    typeof header !==
    "string"
  ) {
    return null
  }

  const prefix =
    `${ADMIN_AUTH_SCHEME} `

  if (
    !header.startsWith(
      prefix,
    )
  ) {
    return null
  }

  const token =
    header
      .slice(
        prefix.length,
      )
      .trim()

  const splitAt =
    token.indexOf(".")

  if (splitAt <= 0) {
    return null
  }

  const challengeId =
    token.slice(
      0,
      splitAt,
    )

  const signature =
    token.slice(
      splitAt + 1,
    )

  if (
    !/^[0-9a-f]{64}$/
      .test(
        challengeId,
      ) ||
    !/^0x[0-9a-fA-F]{130}$/
      .test(
        signature,
      )
  ) {
    return null
  }

  return {
    challengeId,
    signature,
  }
}

export async function
verifyAdminChallengeRequest(
  req,
) {
  const parsed =
    parseAuthorization(
      req.get(
        "authorization",
      ),
    )

  if (!parsed) {
    throw authError(
      401,
      "ADMIN_CHALLENGE_REQUIRED",
      "A valid one-time administrator challenge is required",
    )
  }

  const challenge =
    await AdminChallenge
      .findOne({
        challengeId:
          parsed.challengeId,
      })

  if (!challenge) {
    throw authError(
      401,
      "ADMIN_CHALLENGE_NOT_FOUND",
      "Administrator challenge was not found or has expired",
    )
  }

  const now =
    new Date()

  if (challenge.usedAt) {
    throw authError(
      409,
      "ADMIN_CHALLENGE_REPLAY",
      "Administrator challenge replay was rejected",
    )
  }

  if (
    challenge.expiresAt <=
    now
  ) {
    throw authError(
      401,
      "ADMIN_CHALLENGE_EXPIRED",
      "Administrator challenge has expired",
    )
  }

  const method =
    String(
      req.method,
    )
      .toUpperCase()

  const path =
    String(
      req.originalUrl,
    )

  const bodyHash =
    hashAdminBody(
      req.body,
    )

  if (
    challenge.method !==
      method ||
    challenge.path !==
      path ||
    challenge.bodyHash !==
      bodyHash.toLowerCase()
  ) {
    throw authError(
      401,
      "ADMIN_CHALLENGE_BINDING_MISMATCH",
      "Administrator challenge does not match this request",
    )
  }

  let recovered

  try {
    recovered =
      getAddress(
        verifyMessage(
          challenge.message,
          parsed.signature,
        ),
      )
  } catch {
    throw authError(
      401,
      "ADMIN_SIGNATURE_INVALID",
      "Administrator challenge signature is invalid",
    )
  }

  if (
    recovered !==
    getAddress(
      challenge.address,
    )
  ) {
    throw authError(
      401,
      "ADMIN_SIGNATURE_INVALID",
      "Administrator challenge signature is invalid",
    )
  }

  /*
   * Re-check authority immediately before consuming the challenge.
   */
  const authority =
    await resolveAdminAuthority()

  if (
    authority.chainId !==
      challenge.chainId ||
    authority.admin !==
      recovered
  ) {
    throw authError(
      403,
      "ADMIN_AUTHORITY_CHANGED",
      "Administrator authority changed after this challenge was issued",
    )
  }

  /*
   * Atomic one-time consumption.
   */
  const consumed =
    await AdminChallenge
      .findOneAndUpdate(
        {
          _id:
            challenge._id,

          usedAt:
            null,

          expiresAt: {
            $gt:
              now,
          },
        },
        {
          $set: {
            usedAt:
              now,
          },
        },
        {
          new: true,
        },
      )

  if (!consumed) {
    throw authError(
      409,
      "ADMIN_CHALLENGE_REPLAY",
      "Administrator challenge replay was rejected",
    )
  }

  return {
    address:
      recovered,

    challengeId:
      challenge.challengeId,
  }
}
