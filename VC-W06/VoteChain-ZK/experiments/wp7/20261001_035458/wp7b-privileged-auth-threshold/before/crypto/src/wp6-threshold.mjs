import {
  createCipheriv,
  createDecipheriv,
  createECDH,
  createHash,
  hkdfSync,
  randomBytes,
  scryptSync,
} from "node:crypto"

import {
  add,
  eq,
  identityPoint,
  mod,
  modInv,
  mul,
  neg,
  pointInts,
  poseidon,
  serializePoint,
} from "./wp2-core-final.mjs"

const FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n

export const WP6 = Object.freeze({
  threshold: 3,
  trusteeCount: 5,
  maxCandidates: 16,

  transcriptVersion:
    "VoteChain-ZK-WP6-DKG-Transcript-v1",

  finalizationVersion:
    "VoteChain-ZK-WP6-Finalization-v1",

  dleqDomain:
    "VoteChain-ZK/WP6/DLEQ/v1",

  shareTransportInfo:
    "VoteChain-ZK/WP6/share-transport/v1",
})

function ensureInteger(
  value,
  name,
) {
  if (
    !Number.isSafeInteger(value)
  ) {
    throw new Error(
      `${name} must be a safe integer`,
    )
  }
}

function ensureThreshold(
  threshold,
  trusteeCount,
) {
  ensureInteger(
    threshold,
    "threshold",
  )

  ensureInteger(
    trusteeCount,
    "trusteeCount",
  )

  if (
    threshold < 2 ||
    trusteeCount < threshold
  ) {
    throw new Error(
      "invalid threshold policy",
    )
  }
}

function jsonSafe(
  value,
) {
  if (
    typeof value === "bigint"
  ) {
    return value.toString()
  }

  if (
    Array.isArray(value)
  ) {
    return value.map(
      jsonSafe,
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
            jsonSafe(
              value[key],
            ),
          ],
        ),
    )
  }

  return value
}

export function canonicalJson(
  value,
) {
  return JSON.stringify(
    jsonSafe(value),
  )
}

export function canonicalSha256(
  value,
) {
  return createHash(
    "sha256",
  )
    .update(
      canonicalJson(
        value,
      ),
      "utf8",
    )
    .digest(
      "hex",
    )
}

export function randomScalar(
  q,
) {
  const modulus =
    BigInt(q)

  for (;;) {
    const candidate =
      BigInt(
        `0x${randomBytes(32).toString("hex")}`,
      ) %
      modulus

    if (
      candidate > 0n
    ) {
      return candidate
    }
  }
}

function pointFromSerialized(
  c,
  encoded,
) {
  if (
    !Array.isArray(encoded) ||
    encoded.length !== 2
  ) {
    throw new Error(
      "invalid point encoding",
    )
  }

  const x =
    BigInt(
      encoded[0],
    )

  const y =
    BigInt(
      encoded[1],
    )

  if (
    x < 0n ||
    y < 0n ||
    x >= FIELD ||
    y >= FIELD
  ) {
    throw new Error(
      "non-canonical BabyJub point",
    )
  }

  const point = [
    c.F.e(x),
    c.F.e(y),
  ]

  if (
    typeof c.baby.inCurve ===
      "function" &&
    !c.baby.inCurve(
      point,
    )
  ) {
    throw new Error(
      "BabyJub point is not on curve",
    )
  }

  if (
    typeof c.baby.inSubgroup ===
      "function" &&
    !c.baby.inSubgroup(
      point,
    )
  ) {
    throw new Error(
      "BabyJub point is outside prime subgroup",
    )
  }

  return point
}

function isIdentity(
  c,
  point,
) {
  return eq(
    c,
    point,
    identityPoint(c),
  )
}

function evalPolynomial(
  coefficients,
  x,
  q,
) {
  let acc = 0n
  let power = 1n

  for (
    const coefficient
    of coefficients
  ) {
    acc =
      mod(
        acc +
          mod(
            coefficient,
            q,
          ) *
          power,
        q,
      )

    power =
      mod(
        power *
          BigInt(x),
        q,
      )
  }

  return acc
}

function publicPolynomialAt(
  c,
  commitments,
  x,
) {
  let out =
    identityPoint(c)

  let power = 1n

  for (
    const encoded
    of commitments
  ) {
    const commitment =
      pointFromSerialized(
        c,
        encoded,
      )

    out =
      add(
        c,
        out,
        mul(
          c,
          commitment,
          power,
        ),
      )

    power =
      mod(
        power *
          BigInt(x),
        c.q,
      )
  }

  return out
}

function validateRoster(
  roster,
  trusteeCount,
) {
  if (
    !Array.isArray(roster) ||
    roster.length !==
      trusteeCount
  ) {
    throw new Error(
      "trustee roster size mismatch",
    )
  }

  const ids =
    roster.map(
      trustee =>
        Number(
          trustee.trusteeId,
        ),
    )

  if (
    new Set(ids).size !==
      trusteeCount
  ) {
    throw new Error(
      "duplicate trustee id",
    )
  }

  ids
    .sort(
      (a, b) =>
        a - b,
    )
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
            "trustee ids must be contiguous from 1",
          )
        }
      },
    )
}

function custodyKey(
  passphrase,
  salt,
) {
  if (
    typeof passphrase !==
      "string" ||
    passphrase.length < 16
  ) {
    throw new Error(
      "trustee passphrase must contain at least 16 characters",
    )
  }

  return scryptSync(
    passphrase,
    salt,
    32,
    {
      N: 16384,
      r: 8,
      p: 1,
      maxmem:
        64 *
        1024 *
        1024,
    },
  )
}

function sealCustody(
  plaintext,
  passphrase,
  aad,
) {
  const salt =
    randomBytes(16)

  const iv =
    randomBytes(12)

  const key =
    custodyKey(
      passphrase,
      salt,
    )

  const cipher =
    createCipheriv(
      "aes-256-gcm",
      key,
      iv,
    )

  cipher.setAAD(
    Buffer.from(
      aad,
      "utf8",
    ),
  )

  const ciphertext =
    Buffer.concat([
      cipher.update(
        Buffer.from(
          plaintext,
          "utf8",
        ),
      ),
      cipher.final(),
    ])

  const authTag =
    cipher.getAuthTag()

  return {
    version: 1,

    kdf:
      "scrypt-N16384-r8-p1",

    contentEncryption:
      "AES-256-GCM",

    salt:
      salt.toString(
        "base64",
      ),

    iv:
      iv.toString(
        "base64",
      ),

    aad,

    ciphertext:
      ciphertext.toString(
        "base64",
      ),

    authTag:
      authTag.toString(
        "base64",
      ),
  }
}

function openCustody(
  sealed,
  passphrase,
  expectedAad,
) {
  if (
    sealed.aad !==
      expectedAad
  ) {
    throw new Error(
      "custody AAD mismatch",
    )
  }

  const salt =
    Buffer.from(
      sealed.salt,
      "base64",
    )

  const iv =
    Buffer.from(
      sealed.iv,
      "base64",
    )

  const key =
    custodyKey(
      passphrase,
      salt,
    )

  const decipher =
    createDecipheriv(
      "aes-256-gcm",
      key,
      iv,
    )

  decipher.setAAD(
    Buffer.from(
      expectedAad,
      "utf8",
    ),
  )

  decipher.setAuthTag(
    Buffer.from(
      sealed.authTag,
      "base64",
    ),
  )

  const plaintext =
    Buffer.concat([
      decipher.update(
        Buffer.from(
          sealed.ciphertext,
          "base64",
        ),
      ),
      decipher.final(),
    ])

  return plaintext.toString(
    "utf8",
  )
}

export function createTrusteeTransportIdentity({
  trusteeId,
  passphrase,
  ceremonyId,
}) {
  ensureInteger(
    trusteeId,
    "trusteeId",
  )

  const ecdh =
    createECDH(
      "prime256v1",
    )

  ecdh.generateKeys()

  const privateKey =
    ecdh
      .getPrivateKey()
      .toString(
        "base64",
      )

  const publicKey =
    ecdh
      .getPublicKey()
      .toString(
        "base64",
      )

  const aad =
    `${ceremonyId}|transport-private|${trusteeId}`

  return {
    publicIdentity: {
      trusteeId,

      keyAgreement:
        "ECDH-P256",

      transportPublicKey:
        publicKey,
    },

    privateCustody:
      sealCustody(
        privateKey,
        passphrase,
        aad,
      ),
  }
}

function openTransportPrivateKey({
  trusteeId,
  passphrase,
  ceremonyId,
  privateCustody,
}) {
  const aad =
    `${ceremonyId}|transport-private|${trusteeId}`

  return Buffer.from(
    openCustody(
      privateCustody,
      passphrase,
      aad,
    ),
    "base64",
  )
}

function transportKey(
  shared,
  salt,
) {
  return Buffer.from(
    hkdfSync(
      "sha256",
      shared,
      salt,
      Buffer.from(
        WP6.shareTransportInfo,
        "utf8",
      ),
      32,
    ),
  )
}

function sealScalarForRecipient({
  scalar,
  recipientPublicKey,
  aad,
}) {
  const ephemeral =
    createECDH(
      "prime256v1",
    )

  ephemeral.generateKeys()

  const shared =
    ephemeral.computeSecret(
      Buffer.from(
        recipientPublicKey,
        "base64",
      ),
    )

  const salt =
    randomBytes(32)

  const iv =
    randomBytes(12)

  const key =
    transportKey(
      shared,
      salt,
    )

  const cipher =
    createCipheriv(
      "aes-256-gcm",
      key,
      iv,
    )

  cipher.setAAD(
    Buffer.from(
      aad,
      "utf8",
    ),
  )

  const ciphertext =
    Buffer.concat([
      cipher.update(
        Buffer.from(
          BigInt(
            scalar,
          ).toString(),
          "utf8",
        ),
      ),
      cipher.final(),
    ])

  return {
    version: 1,

    keyAgreement:
      "ECDH-P256",

    kdf:
      "HKDF-SHA256",

    contentEncryption:
      "AES-256-GCM",

    ephemeralPublicKey:
      ephemeral
        .getPublicKey()
        .toString(
          "base64",
        ),

    salt:
      salt.toString(
        "base64",
      ),

    iv:
      iv.toString(
        "base64",
      ),

    aad,

    ciphertext:
      ciphertext.toString(
        "base64",
      ),

    authTag:
      cipher
        .getAuthTag()
        .toString(
          "base64",
        ),
  }
}

function openScalarDelivery({
  envelope,
  recipientPrivateKey,
  expectedAad,
}) {
  if (
    envelope.aad !==
      expectedAad
  ) {
    throw new Error(
      "DKG delivery AAD mismatch",
    )
  }

  const recipient =
    createECDH(
      "prime256v1",
    )

  recipient.setPrivateKey(
    recipientPrivateKey,
  )

  const shared =
    recipient.computeSecret(
      Buffer.from(
        envelope.ephemeralPublicKey,
        "base64",
      ),
    )

  const salt =
    Buffer.from(
      envelope.salt,
      "base64",
    )

  const key =
    transportKey(
      shared,
      salt,
    )

  const decipher =
    createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(
        envelope.iv,
        "base64",
      ),
    )

  decipher.setAAD(
    Buffer.from(
      expectedAad,
      "utf8",
    ),
  )

  decipher.setAuthTag(
    Buffer.from(
      envelope.authTag,
      "base64",
    ),
  )

  const plaintext =
    Buffer.concat([
      decipher.update(
        Buffer.from(
          envelope.ciphertext,
          "base64",
        ),
      ),
      decipher.final(),
    ])
      .toString(
        "utf8",
      )

  return BigInt(
    plaintext,
  )
}

export function createDkgContribution({
  c,
  trusteeId,
  threshold,
  trusteeCount,
  roster,
  ceremonyId,
}) {
  ensureThreshold(
    threshold,
    trusteeCount,
  )

  validateRoster(
    roster,
    trusteeCount,
  )

  if (
    trusteeId < 1 ||
    trusteeId >
      trusteeCount
  ) {
    throw new Error(
      "invalid contributing trustee id",
    )
  }

  const coefficients =
    Array.from(
      {
        length:
          threshold,
      },
      () =>
        randomScalar(
          c.q,
        ),
    )

  const commitments =
    coefficients.map(
      coefficient =>
        serializePoint(
          c,
          mul(
            c,
            c.G,
            coefficient,
          ),
        ),
    )

  const deliveries =
    roster.map(
      recipient => {
        const scalar =
          evalPolynomial(
            coefficients,
            BigInt(
              recipient
                .trusteeId,
            ),
            c.q,
          )

        const aad =
          `${ceremonyId}|share|${trusteeId}|${recipient.trusteeId}`

        return {
          senderId:
            trusteeId,

          recipientId:
            recipient
              .trusteeId,

          envelope:
            sealScalarForRecipient({
              scalar,

              recipientPublicKey:
                recipient
                  .transportPublicKey,

              aad,
            }),
        }
      },
    )

  /*
   * coefficients intentionally fall out of scope here.
   * They are never returned or persisted.
   */
  return {
    publicContribution: {
      trusteeId,
      commitments,

      deliveryHashes:
        deliveries.map(
          item => ({
            recipientId:
              item.recipientId,

            sha256:
              canonicalSha256(
                item,
              ),
          }),
        ),
    },

    deliveries,
  }
}

export function deriveTrusteeShare({
  c,
  trusteeId,
  threshold,
  trusteeCount,
  ceremonyId,
  identity,
  passphrase,
  contributionBundles,
}) {
  ensureThreshold(
    threshold,
    trusteeCount,
  )

  if (
    contributionBundles.length !==
      trusteeCount
  ) {
    throw new Error(
      "DKG contribution count mismatch",
    )
  }

  const recipientPrivateKey =
    openTransportPrivateKey({
      trusteeId,
      passphrase,
      ceremonyId,

      privateCustody:
        identity
          .privateCustody,
    })

  let aggregateShare =
    0n

  let expectedPublicShare =
    identityPoint(c)

  for (
    const bundle
    of contributionBundles
  ) {
    const contribution =
      bundle
        .publicContribution

    const delivery =
      bundle
        .deliveries
        .find(
          item =>
            item.recipientId ===
              trusteeId,
        )

    if (!delivery) {
      throw new Error(
        `missing DKG delivery for trustee ${trusteeId}`,
      )
    }

    const expectedAad =
      `${ceremonyId}|share|${contribution.trusteeId}|${trusteeId}`

    const scalar =
      openScalarDelivery({
        envelope:
          delivery.envelope,

        recipientPrivateKey,

        expectedAad,
      })

    if (
      scalar < 0n ||
      scalar >= c.q
    ) {
      throw new Error(
        "received DKG scalar outside subgroup order",
      )
    }

    const expectedContribution =
      publicPolynomialAt(
        c,
        contribution
          .commitments,
        BigInt(
          trusteeId,
        ),
      )

    const receivedPublic =
      mul(
        c,
        c.G,
        scalar,
      )

    if (
      !eq(
        c,
        receivedPublic,
        expectedContribution,
      )
    ) {
      throw new Error(
        `DKG commitment verification failed for trustee ${trusteeId}`,
      )
    }

    aggregateShare =
      mod(
        aggregateShare +
          scalar,
        c.q,
      )

    expectedPublicShare =
      add(
        c,
        expectedPublicShare,
        expectedContribution,
      )
  }

  if (
    aggregateShare === 0n
  ) {
    throw new Error(
      "zero aggregate trustee share",
    )
  }

  const publicShare =
    mul(
      c,
      c.G,
      aggregateShare,
    )

  if (
    !eq(
      c,
      publicShare,
      expectedPublicShare,
    )
  ) {
    throw new Error(
      "aggregate trustee public-share mismatch",
    )
  }

  const aad =
    `${ceremonyId}|final-decryption-share|${trusteeId}`

  return {
    trusteeId,

    publicShare:
      serializePoint(
        c,
        publicShare,
      ),

    encryptedShareCustody:
      sealCustody(
        aggregateShare
          .toString(),
        passphrase,
        aad,
      ),
  }
}

export function openTrusteeShare({
  custody,
  trusteeId,
  passphrase,
  ceremonyId,
}) {
  const aad =
    `${ceremonyId}|final-decryption-share|${trusteeId}`

  const scalar =
    BigInt(
      openCustody(
        custody,
        passphrase,
        aad,
      ),
    )

  return scalar
}

function deriveElectionPublicKey(
  c,
  publicContributions,
) {
  let publicKey =
    identityPoint(c)

  for (
    const contribution
    of publicContributions
  ) {
    publicKey =
      add(
        c,
        publicKey,
        pointFromSerialized(
          c,
          contribution
            .commitments[0],
        ),
      )
  }

  if (
    isIdentity(
      c,
      publicKey,
    )
  ) {
    throw new Error(
      "DKG produced identity election public key",
    )
  }

  return publicKey
}

export function buildDkgTranscript({
  c,
  ceremonyId,
  threshold,
  trusteeCount,
  roster,
  contributionBundles,
  derivedShares,
}) {
  ensureThreshold(
    threshold,
    trusteeCount,
  )

  validateRoster(
    roster,
    trusteeCount,
  )

  if (
    contributionBundles.length !==
      trusteeCount ||
    derivedShares.length !==
      trusteeCount
  ) {
    throw new Error(
      "incomplete DKG transcript inputs",
    )
  }

  const publicContributions =
    contributionBundles.map(
      bundle =>
        bundle
          .publicContribution,
    )

  const publicKey =
    deriveElectionPublicKey(
      c,
      publicContributions,
    )

  const transcript = {
    version:
      WP6.transcriptVersion,

    ceremonyId,

    threshold,
    trusteeCount,

    curve:
      "BabyJubJub",

    generator:
      "Base8",

    publicKey:
      serializePoint(
        c,
        publicKey,
      ),

    trustees:
      roster.map(
        trustee => {
          const share =
            derivedShares.find(
              item =>
                item.trusteeId ===
                  trustee.trusteeId,
            )

          if (!share) {
            throw new Error(
              "missing public trustee share",
            )
          }

          return {
            trusteeId:
              trustee.trusteeId,

            transportPublicKey:
              trustee
                .transportPublicKey,

            publicShare:
              share
                .publicShare,
          }
        },
      ),

    participantCommitments:
      publicContributions.map(
        contribution => ({
          trusteeId:
            contribution
              .trusteeId,

          commitments:
            contribution
              .commitments,
        }),
      ),

    deliveryHashes:
      publicContributions
        .flatMap(
          contribution =>
            contribution
              .deliveryHashes
              .map(
                delivery => ({
                  senderId:
                    contribution
                      .trusteeId,

                  recipientId:
                    delivery
                      .recipientId,

                  sha256:
                    delivery
                      .sha256,
                }),
              ),
        ),
  }

  return {
    transcript,

    transcriptHash:
      canonicalSha256(
        transcript,
      ),
  }
}

export function verifyDkgTranscript(
  c,
  transcript,
) {
  ensureThreshold(
    transcript.threshold,
    transcript.trusteeCount,
  )

  if (
    transcript.version !==
      WP6.transcriptVersion
  ) {
    throw new Error(
      "unsupported DKG transcript version",
    )
  }

  validateRoster(
    transcript
      .trustees,
    transcript
      .trusteeCount,
  )

  if (
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
    deriveElectionPublicKey(
      c,
      transcript
        .participantCommitments,
    )

  const statedPublicKey =
    pointFromSerialized(
      c,
      transcript
        .publicKey,
    )

  if (
    !eq(
      c,
      derivedPublicKey,
      statedPublicKey,
    )
  ) {
    throw new Error(
      "DKG public key mismatch",
    )
  }

  for (
    const trustee
    of transcript.trustees
  ) {
    let expected =
      identityPoint(c)

    for (
      const contribution
      of transcript
        .participantCommitments
    ) {
      expected =
        add(
          c,
          expected,
          publicPolynomialAt(
            c,
            contribution
              .commitments,
            BigInt(
              trustee
                .trusteeId,
            ),
          ),
        )
    }

    const publicShare =
      pointFromSerialized(
        c,
        trustee
          .publicShare,
      )

    if (
      !eq(
        c,
        expected,
        publicShare,
      )
    ) {
      throw new Error(
        `public trustee share mismatch for ${trustee.trusteeId}`,
      )
    }
  }

  return true
}

function domainField(
  label,
) {
  return (
    BigInt(
      `0x${
        createHash(
          "sha256",
        )
          .update(
            label,
            "utf8",
          )
          .digest(
            "hex",
          )
      }`,
    ) %
    FIELD
  )
}

async function dleqChallenge({
  c,
  electionId,
  trusteeId,
  slot,
  publicShare,
  R,
  partial,
  A1,
  A2,
}) {
  let state =
    domainField(
      WP6.dleqDomain,
    )

  const values = [
    BigInt(
      electionId,
    ),
    BigInt(
      trusteeId,
    ),
    BigInt(
      slot,
    ),

    ...pointInts(
      c,
      c.G,
    ),

    ...pointInts(
      c,
      publicShare,
    ),

    ...pointInts(
      c,
      R,
    ),

    ...pointInts(
      c,
      partial,
    ),

    ...pointInts(
      c,
      A1,
    ),

    ...pointInts(
      c,
      A2,
    ),
  ]

  for (
    const value
    of values
  ) {
    state =
      await poseidon([
        state,
        mod(
          value,
          FIELD,
        ),
      ])
  }

  return mod(
    state,
    c.q,
  )
}

export async function createPartialRecord({
  c,
  electionId,
  trusteeId,
  slot,
  share,
  publicShare,
  aggregateR,
}) {
  const x =
    mod(
      share,
      c.q,
    )

  if (
    x === 0n
  ) {
    throw new Error(
      "zero trustee share",
    )
  }

  const X =
    pointFromSerialized(
      c,
      publicShare,
    )

  if (
    !eq(
      c,
      mul(
        c,
        c.G,
        x,
      ),
      X,
    )
  ) {
    throw new Error(
      "trustee private/public share mismatch",
    )
  }

  const R =
    pointFromSerialized(
      c,
      aggregateR,
    )

  const partial =
    mul(
      c,
      R,
      x,
    )

  const nonce =
    randomScalar(
      c.q,
    )

  const A1 =
    mul(
      c,
      c.G,
      nonce,
    )

  const A2 =
    mul(
      c,
      R,
      nonce,
    )

  const challenge =
    await dleqChallenge({
      c,
      electionId,
      trusteeId,
      slot,
      publicShare:
        X,
      R,
      partial,
      A1,
      A2,
    })

  const response =
    mod(
      nonce +
        challenge *
        x,
      c.q,
    )

  return {
    version:
      "VoteChain-ZK-WP6-DLEQ-v1",

    electionId:
      String(
        electionId,
      ),

    trusteeId,
    slot,

    publicShare:
      serializePoint(
        c,
        X,
      ),

    partial:
      serializePoint(
        c,
        partial,
      ),

    proof: {
      A1:
        serializePoint(
          c,
          A1,
        ),

      A2:
        serializePoint(
          c,
          A2,
        ),

      challenge:
        challenge
          .toString(),

      response:
        response
          .toString(),
    },
  }
}

export async function verifyPartialRecord({
  c,
  record,
  electionId,
  slot,
  expectedPublicShare,
}) {
  try {
    if (
      String(
        record.electionId,
      ) !==
        String(
          electionId,
        ) ||
      Number(
        record.slot,
      ) !==
        Number(
          slot,
        )
    ) {
      return false
    }

    const publicShare =
      pointFromSerialized(
        c,
        record
          .publicShare,
      )

    const expected =
      pointFromSerialized(
        c,
        expectedPublicShare,
      )

    if (
      !eq(
        c,
        publicShare,
        expected,
      )
    ) {
      return false
    }

    const R =
      pointFromSerialized(
        c,
        record.aggregateR,
      )

    const partial =
      pointFromSerialized(
        c,
        record.partial,
      )

    const A1 =
      pointFromSerialized(
        c,
        record
          .proof
          .A1,
      )

    const A2 =
      pointFromSerialized(
        c,
        record
          .proof
          .A2,
      )

    const challenge =
      BigInt(
        record
          .proof
          .challenge,
      )

    const response =
      BigInt(
        record
          .proof
          .response,
      )

    if (
      challenge < 0n ||
      challenge >= c.q ||
      response < 0n ||
      response >= c.q
    ) {
      return false
    }

    const recomputed =
      await dleqChallenge({
        c,
        electionId,
        trusteeId:
          record
            .trusteeId,
        slot,
        publicShare,
        R,
        partial,
        A1,
        A2,
      })

    if (
      recomputed !==
        challenge
    ) {
      return false
    }

    const lhs1 =
      mul(
        c,
        c.G,
        response,
      )

    const rhs1 =
      add(
        c,
        A1,
        mul(
          c,
          publicShare,
          challenge,
        ),
      )

    const lhs2 =
      mul(
        c,
        R,
        response,
      )

    const rhs2 =
      add(
        c,
        A2,
        mul(
          c,
          partial,
          challenge,
        ),
      )

    return (
      eq(
        c,
        lhs1,
        rhs1,
      ) &&
      eq(
        c,
        lhs2,
        rhs2,
      )
    )
  } catch {
    return false
  }
}

function lagrangeZero(
  id,
  ids,
  q,
) {
  const i =
    BigInt(id)

  let numerator =
    1n

  let denominator =
    1n

  for (
    const other
    of ids
  ) {
    if (
      other === id
    ) {
      continue
    }

    const j =
      BigInt(other)

    numerator =
      mod(
        numerator *
          (-j),
        q,
      )

    denominator =
      mod(
        denominator *
          (i - j),
        q,
      )
  }

  return mod(
    numerator *
      modInv(
        denominator,
        q,
      ),
    q,
  )
}

function combinePartials(
  c,
  partials,
  threshold,
) {
  if (
    partials.length <
      threshold
  ) {
    throw new Error(
      `need at least ${threshold} valid shares`,
    )
  }

  const ids =
    partials.map(
      item =>
        item.trusteeId,
    )

  if (
    new Set(ids).size !==
      ids.length
  ) {
    throw new Error(
      "duplicate trustee",
    )
  }

  let combined =
    identityPoint(c)

  for (
    const item
    of partials
  ) {
    const lambda =
      lagrangeZero(
        item.trusteeId,
        ids,
        c.q,
      )

    combined =
      add(
        c,
        combined,
        mul(
          c,
          item.partial,
          lambda,
        ),
      )
  }

  return combined
}

function pointKey(
  c,
  point,
) {
  return serializePoint(
    c,
    point,
  ).join(":")
}

export function boundedDecodeBsgs(
  c,
  encoded,
  maxCount,
) {
  ensureInteger(
    maxCount,
    "maxCount",
  )

  if (
    maxCount < 0
  ) {
    throw new Error(
      "negative tally bound",
    )
  }

  const m =
    Math.ceil(
      Math.sqrt(
        maxCount + 1,
      ),
    )

  const babySteps =
    new Map()

  let baby =
    identityPoint(c)

  for (
    let j = 0;
    j < m;
    j += 1
  ) {
    babySteps.set(
      pointKey(
        c,
        baby,
      ),
      j,
    )

    baby =
      add(
        c,
        baby,
        c.G,
      )
  }

  const giantStep =
    neg(
      c,
      mul(
        c,
        c.G,
        BigInt(m),
      ),
    )

  let gamma =
    encoded

  for (
    let i = 0;
    i <= m;
    i += 1
  ) {
    const j =
      babySteps.get(
        pointKey(
          c,
          gamma,
        ),
      )

    if (
      j !== undefined
    ) {
      const result =
        i *
          m +
        j

      if (
        result <=
          maxCount
      ) {
        return result
      }
    }

    gamma =
      add(
        c,
        gamma,
        giantStep,
      )
  }

  throw new Error(
    "outside tally bound",
  )
}

export function serializeCiphertext(
  c,
  ciphertext,
) {
  return {
    R:
      serializePoint(
        c,
        ciphertext.R,
      ),

    S:
      serializePoint(
        c,
        ciphertext.S,
      ),
  }
}

function parseCiphertext(
  c,
  ciphertext,
) {
  return {
    R:
      pointFromSerialized(
        c,
        ciphertext.R,
      ),

    S:
      pointFromSerialized(
        c,
        ciphertext.S,
      ),
  }
}

export async function verifyFinalizationTranscript({
  c,
  transcript,
}) {
  if (
    transcript.version !==
      WP6.finalizationVersion
  ) {
    throw new Error(
      "unsupported finalization transcript version",
    )
  }

  verifyDkgTranscript(
    c,
    transcript
      .dkgTranscript,
  )

  const threshold =
    Number(
      transcript
        .dkgTranscript
        .threshold,
    )

  const electionId =
    String(
      transcript
        .electionId,
    )

  const candidateCount =
    Number(
      transcript
        .candidateCount,
    )

  const acceptedBallotCount =
    Number(
      transcript
        .acceptedBallotCount,
    )

  ensureInteger(
    candidateCount,
    "candidateCount",
  )

  ensureInteger(
    acceptedBallotCount,
    "acceptedBallotCount",
  )

  if (
    candidateCount < 1 ||
    candidateCount >
      WP6.maxCandidates
  ) {
    throw new Error(
      "invalid candidate count",
    )
  }

  if (
    transcript
      .aggregateCiphertexts
      .length !==
        WP6.maxCandidates ||
    transcript
      .partialsBySlot
      .length !==
        WP6.maxCandidates
  ) {
    throw new Error(
      "finalization slot count mismatch",
    )
  }

  const publicShares =
    new Map(
      transcript
        .dkgTranscript
        .trustees
        .map(
          trustee => [
            trustee.trusteeId,
            trustee.publicShare,
          ],
        ),
    )

  const totals = []
  const rejectedBySlot = []

  for (
    let slot = 0;
    slot <
      WP6.maxCandidates;
    slot += 1
  ) {
    const ciphertext =
      parseCiphertext(
        c,
        transcript
          .aggregateCiphertexts[
            slot
          ],
      )

    const records =
      transcript
        .partialsBySlot[
          slot
        ]

    const seen =
      new Set()

    const valid =
      []

    const rejected =
      []

    for (
      const record
      of records
    ) {
      if (
        seen.has(
          record.trusteeId,
        )
      ) {
        throw new Error(
          `duplicate trustee in slot ${slot}`,
        )
      }

      seen.add(
        record.trusteeId,
      )

      const expectedPublicShare =
        publicShares.get(
          record.trusteeId,
        )

      if (
        !expectedPublicShare
      ) {
        rejected.push(
          record.trusteeId,
        )

        continue
      }

      const enriched = {
        ...record,

        aggregateR:
          transcript
            .aggregateCiphertexts[
              slot
            ].R,
      }

      const ok =
        await verifyPartialRecord({
          c,
          record:
            enriched,
          electionId,
          slot,
          expectedPublicShare,
        })

      if (!ok) {
        rejected.push(
          record.trusteeId,
        )

        continue
      }

      valid.push({
        trusteeId:
          record.trusteeId,

        partial:
          pointFromSerialized(
            c,
            record.partial,
          ),
      })
    }

    if (
      valid.length <
        threshold
    ) {
      throw new Error(
        `slot ${slot}: need at least ${threshold} valid shares`,
      )
    }

    const combined =
      combinePartials(
        c,
        valid,
        threshold,
      )

    const message =
      add(
        c,
        ciphertext.S,
        neg(
          c,
          combined,
        ),
      )

    const decoded =
      boundedDecodeBsgs(
        c,
        message,
        acceptedBallotCount,
      )

    totals.push(
      decoded,
    )

    rejectedBySlot.push(
      rejected,
    )
  }

  for (
    let slot =
      candidateCount;
    slot <
      WP6.maxCandidates;
    slot += 1
  ) {
    if (
      totals[slot] !== 0
    ) {
      throw new Error(
        `nonzero padded tally slot ${slot}`,
      )
    }
  }

  const activeSum =
    totals
      .slice(
        0,
        candidateCount,
      )
      .reduce(
        (
          sum,
          value,
        ) =>
          sum +
          value,
        0,
      )

  if (
    activeSum !==
      acceptedBallotCount
  ) {
    throw new Error(
      "final tally does not sum to acceptedBallotCount",
    )
  }

  if (
    transcript
      .reportedTotals
  ) {
    if (
      canonicalJson(
        transcript
          .reportedTotals,
      ) !==
      canonicalJson(
        totals,
      )
    ) {
      throw new Error(
        "reported tally totals mismatch verified totals",
      )
    }
  }

  return {
    totals,
    rejectedBySlot,

    transcriptHash:
      canonicalSha256(
        transcript,
      ),
  }
}
