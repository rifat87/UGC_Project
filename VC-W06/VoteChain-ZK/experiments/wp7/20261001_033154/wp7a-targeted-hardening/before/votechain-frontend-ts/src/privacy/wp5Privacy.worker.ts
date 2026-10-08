/// <reference lib="webworker" />

import {
  Buffer,
} from "buffer"

import appProfile from "./wp5-application-profile.json"

import type {
  Wp5Authorization,
  Wp5PublicConfig,
} from "../services/api"

/*
 * circomlibjs/ffjavascript still exercise Buffer-backed code
 * in the browser bundle.
 *
 * This assignment MUST happen before circomlibjs/snarkjs are
 * evaluated, so those packages are loaded dynamically below.
 */
;(globalThis as any).Buffer = Buffer

/*
 * Lazy browser crypto loading.
 *
 * Buffer is assigned above before either dependency is evaluated.
 * Keeping the dynamic imports inside async functions avoids
 * top-level await while preserving browser-first initialization.
 */
async function buildPoseidon() {
  const circomlib: any =
    await import(
      "circomlibjs"
    )

  return circomlib.buildPoseidon()
}

async function buildBabyjub() {
  const circomlib: any =
    await import(
      "circomlibjs"
    )

  return circomlib.buildBabyjub()
}

async function loadGroth16() {
  const snarkjs: any =
    await import(
      "snarkjs"
    )

  return snarkjs.groth16
}

const groth16: any = {
  async fullProve(
    ...args: any[]
  ) {
    const api =
      await loadGroth16()

    return api.fullProve(
      ...args
    )
  },

  async verify(
    ...args: any[]
  ) {
    const api =
      await loadGroth16()

    return api.verify(
      ...args
    )
  },

  async exportSolidityCallData(
    ...args: any[]
  ) {
    const api =
      await loadGroth16()

    return api.exportSolidityCallData(
      ...args
    )
  },
}

const MAX =
  Number(appProfile.maxCandidates)

const DEPTH =
  Number(appProfile.merkleDepth)

const FIELD =
  BigInt(appProfile.fieldModulus)

const SUBORDER =
  BigInt(
    appProfile.babyjub.subOrder,
  )

const D_ID =
  BigInt(
    appProfile.domains.identity,
  )

const D_NULL =
  BigInt(
    appProfile.domains.nullifier,
  )

const D_CTX =
  BigInt(
    appProfile.domains.electionContext,
  )

const D_MANIFEST =
  BigInt(
    appProfile.domains.candidateManifest,
  )

let sessionKeyPair:
  CryptoKeyPair | null =
    null

let poseidonPromise:
  Promise<any> | null =
    null

let babyjubPromise:
  Promise<any> | null =
    null

function getPoseidon() {
  if (!poseidonPromise) {
    poseidonPromise =
      buildPoseidon()
  }

  return poseidonPromise
}

function getBabyjub() {
  if (!babyjubPromise) {
    babyjubPromise =
      buildBabyjub()
  }

  return babyjubPromise
}

function fromBase64(
  value: string,
) {
  const raw =
    atob(value)

  const out =
    new Uint8Array(
      raw.length,
    )

  for (
    let i = 0;
    i < raw.length;
    i += 1
  ) {
    out[i] =
      raw.charCodeAt(i)
  }

  return out
}

function randomScalar() {
  const bytes =
    new Uint8Array(32)

  crypto.getRandomValues(
    bytes,
  )

  let value = 0n

  for (const byte of bytes) {
    value =
      (value << 8n) |
      BigInt(byte)
  }

  return (
    value %
    (SUBORDER - 1n)
  ) + 1n
}

async function H(
  values:
    Array<
      string |
      number |
      bigint
    >,
) {
  const poseidon =
    await getPoseidon()

  return BigInt(
    poseidon.F.toObject(
      poseidon(
        values.map(
          value =>
            BigInt(value),
        ),
      ),
    ),
  )
}

async function computeManifest(
  candidateIds: number[],
) {
  if (
    candidateIds.length < 1 ||
    candidateIds.length > MAX
  ) {
    throw new Error(
      "Candidate count is outside the frozen WP5 range",
    )
  }

  if (
    appProfile
      .candidateManifest
      .algorithm !==
    "POSEIDON_INDEXED_CHAIN_V1"
  ) {
    throw new Error(
      "Unexpected WP5 candidate-manifest algorithm",
    )
  }

  let state =
    await H([
      D_MANIFEST,
      BigInt(
        candidateIds.length,
      ),
    ])

  for (
    let index = 0;
    index < candidateIds.length;
    index += 1
  ) {
    state =
      await H([
        state,
        BigInt(index),
        BigInt(
          candidateIds[index],
        ),
      ])
  }

  return state
}

async function reconstructRoot(
  commitment: bigint,
  siblings: string[],
  pathBits: string[],
) {
  if (
    siblings.length !== DEPTH ||
    pathBits.length !== DEPTH
  ) {
    throw new Error(
      "Invalid WP5 Merkle witness depth",
    )
  }

  let current =
    commitment

  for (
    let i = 0;
    i < DEPTH;
    i += 1
  ) {
    const bit =
      BigInt(pathBits[i])

    const sibling =
      BigInt(siblings[i])

    if (
      bit !== 0n &&
      bit !== 1n
    ) {
      throw new Error(
        "Invalid Merkle path bit",
      )
    }

    current =
      bit === 0n
        ? await H([
            current,
            sibling,
          ])
        : await H([
            sibling,
            current,
          ])
  }

  return current
}

async function beginAuthorization() {
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

  return {
    credentialPublicKey:
      publicKey,
  }
}

async function unwrapCredential(
  authorization:
    Wp5Authorization,
) {
  if (!sessionKeyPair) {
    throw new Error(
      "Credential-release session is missing",
    )
  }

  const envelope =
    authorization
      .credentialEnvelope

  if (
    envelope.version !== 1 ||
    envelope.keyAgreement !==
      "ECDH-P256-HKDF-SHA256" ||
    envelope.contentEncryption !==
      "AES-256-GCM"
  ) {
    throw new Error(
      "Unsupported credential envelope",
    )
  }

  if (
    Date.now() >
    authorization.expiresAt ||
    Date.now() >
    envelope.expiresAt
  ) {
    throw new Error(
      "Biometric authorization expired",
    )
  }

  const expectedAad =
    [
      "VoteChain-ZK/WP5/v1",
      authorization
        .membership
        .identityCommitment,
      authorization.electionId,
      String(
        envelope.expiresAt,
      ),
    ].join("|")

  const aad =
    fromBase64(
      envelope.aad,
    )

  const decodedAad =
    new TextDecoder()
      .decode(aad)

  if (
    decodedAad !==
    expectedAad
  ) {
    throw new Error(
      "Credential-envelope context mismatch",
    )
  }

  const serverPublicKey =
    await crypto.subtle.importKey(
      "jwk",
      envelope.serverPublicKey,
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      false,
      [],
    )

  const shared =
    await crypto.subtle.deriveBits(
      {
        name: "ECDH",
        public:
          serverPublicKey,
      },
      sessionKeyPair.privateKey,
      256,
    )

  const ikm =
    await crypto.subtle.importKey(
      "raw",
      shared,
      "HKDF",
      false,
      ["deriveKey"],
    )

  const aesKey =
    await crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt:
          fromBase64(
            envelope.salt,
          ),
        info:
          new TextEncoder()
            .encode(
              "VoteChain-ZK/WP5/credential-release/v1",
            ),
      },
      ikm,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["decrypt"],
    )

  const plaintext =
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv:
          fromBase64(
            envelope.iv,
          ),
        additionalData:
          aad,
      },
      aesKey,
      fromBase64(
        envelope.ciphertext,
      ),
    )

  const secretText =
    new TextDecoder()
      .decode(plaintext)

  if (
    !/^\d+$/.test(
      secretText,
    )
  ) {
    throw new Error(
      "Released WP5 credential is malformed",
    )
  }

  const secret =
    BigInt(secretText)

  if (
    secret <= 0n ||
    secret >= FIELD
  ) {
    throw new Error(
      "Released WP5 credential is outside the field",
    )
  }

  return secret
}

function pointBig(
  babyjub: any,
  point: any[],
) {
  return [
    BigInt(
      babyjub.F.toObject(
        point[0],
      ),
    ),
    BigInt(
      babyjub.F.toObject(
        point[1],
      ),
    ),
  ]
}

function normalizeScalar(
  value: unknown,
) {
  return BigInt(
    String(value),
  ).toString()
}

async function prepareBallot(
  candidateId: number,
  authorization:
    Wp5Authorization,
  publicConfig:
    Wp5PublicConfig,
) {
  let secret = 0n

  const randomness:
    bigint[] =
    Array.from(
      { length: MAX },
      () => 0n,
    )

  try {
    if (
      !Number.isSafeInteger(
        candidateId,
      ) ||
      candidateId <= 0
    ) {
      throw new Error(
        "Invalid locally selected candidate",
      )
    }

    if (
      !publicConfig.configured ||
      Number(
        publicConfig.phase,
      ) !== 1
    ) {
      throw new Error(
        "Election is not active",
      )
    }

    const candidateCount =
      Number(
        publicConfig
          .config
          .candidateCount,
      )

    if (
      !Number.isSafeInteger(
        candidateCount,
      ) ||
      candidateCount < 1 ||
      candidateCount > MAX ||
      candidateCount !==
        publicConfig
          .candidates
          .length
    ) {
      throw new Error(
        "Public candidate count is inconsistent",
      )
    }

    const candidateIndex =
      publicConfig
        .candidates
        .findIndex(
          candidate =>
            candidate
              .candidateId ===
            candidateId,
        )

    if (
      candidateIndex < 0 ||
      candidateIndex >=
        candidateCount
    ) {
      throw new Error(
        "Selected candidate is not in the frozen manifest",
      )
    }

    const candidateIds =
      publicConfig
        .candidates
        .map(
          candidate =>
            candidate
              .candidateId,
        )

    const manifest =
      await computeManifest(
        candidateIds,
      )

    if (
      manifest !==
      BigInt(
        publicConfig
          .config
          .candidateManifestHash,
      )
    ) {
      throw new Error(
        "Candidate manifest does not match the contract",
      )
    }

    const electionId =
      BigInt(
        publicConfig
          .config
          .electionId,
      )

    if (
      authorization.electionId !==
      electionId.toString()
    ) {
      throw new Error(
        "Authorization belongs to another election",
      )
    }

    if (
      authorization
        .membership
        .eligibleRoot !==
      publicConfig
        .config
        .eligibleRoot
    ) {
      throw new Error(
        "Authorization Merkle root does not match election configuration",
      )
    }

    secret =
      await unwrapCredential(
        authorization,
      )

    const commitment =
      await H([
        D_ID,
        secret,
      ])

    if (
      commitment.toString() !==
      authorization
        .membership
        .identityCommitment
    ) {
      throw new Error(
        "Released credential does not match voter commitment",
      )
    }

    const reconstructedRoot =
      await reconstructRoot(
        commitment,
        authorization
          .membership
          .siblings,
        authorization
          .membership
          .pathBits,
      )

    if (
      reconstructedRoot.toString() !==
      publicConfig
        .config
        .eligibleRoot
    ) {
      throw new Error(
        "Merkle witness does not reconstruct the configured root",
      )
    }

    const context =
      await H([
        D_CTX,
        electionId,
        manifest,
        BigInt(candidateCount),
        BigInt(
          publicConfig
            .config
            .contractDomain,
        ),
        BigInt(
          publicConfig
            .config
            .Yx,
        ),
        BigInt(
          publicConfig
            .config
            .Yy,
        ),
      ])

    if (
      context.toString() !==
      publicConfig
        .config
        .electionContextHash
    ) {
      throw new Error(
        "Election context hash mismatch",
      )
    }

    const nullifier =
      await H([
        D_NULL,
        secret,
        electionId,
      ])

    const babyjub =
      await getBabyjub()

    const Y = [
      babyjub.F.e(
        BigInt(
          publicConfig
            .config
            .Yx,
        ),
      ),
      babyjub.F.e(
        BigInt(
          publicConfig
            .config
            .Yy,
        ),
      ),
    ]

    if (
      typeof babyjub.inCurve ===
        "function" &&
      !babyjub.inCurve(Y)
    ) {
      throw new Error(
        "Election BabyJub public key is not on curve",
      )
    }

    if (
      typeof babyjub.inSubgroup ===
        "function" &&
      !babyjub.inSubgroup(Y)
    ) {
      throw new Error(
        "Election BabyJub public key is outside the prime subgroup",
      )
    }

    const bits =
      Array.from(
        { length: MAX },
        (_unused, index) =>
          index ===
          candidateIndex
            ? 1n
            : 0n,
      )

    const identityPoint = [
      babyjub.F.e(0),
      babyjub.F.e(1),
    ]

    const Rx: bigint[] = []
    const Ry: bigint[] = []
    const Sx: bigint[] = []
    const Sy: bigint[] = []

    for (
      let slot = 0;
      slot < MAX;
      slot += 1
    ) {
      const r =
        randomScalar()

      randomness[slot] =
        r

      const R =
        babyjub
          .mulPointEscalar(
            babyjub.Base8,
            r,
          )

      const rY =
        babyjub
          .mulPointEscalar(
            Y,
            r,
          )

      const message =
        bits[slot] === 1n
          ? babyjub.Base8
          : identityPoint

      const S =
        babyjub.addPoint(
          rY,
          message,
        )

      const rPoint =
        pointBig(
          babyjub,
          R,
        )

      const sPoint =
        pointBig(
          babyjub,
          S,
        )

      Rx.push(
        rPoint[0],
      )

      Ry.push(
        rPoint[1],
      )

      Sx.push(
        sPoint[0],
      )

      Sy.push(
        sPoint[1],
      )
    }

    const input = {
      secret:
        secret.toString(),

      siblings:
        authorization
          .membership
          .siblings,

      pathBits:
        authorization
          .membership
          .pathBits,

      bit:
        bits.map(
          value =>
            value.toString(),
        ),

      randomness:
        randomness.map(
          value =>
            value.toString(),
        ),

      eligibleRoot:
        publicConfig
          .config
          .eligibleRoot,

      electionId:
        electionId.toString(),

      candidateManifestHash:
        manifest.toString(),

      candidateCount:
        String(candidateCount),

      contractDomain:
        publicConfig
          .config
          .contractDomain,

      Yx:
        publicConfig
          .config
          .Yx,

      Yy:
        publicConfig
          .config
          .Yy,

      electionContextHash:
        context.toString(),

      nullifier:
        nullifier.toString(),

      Rx:
        Rx.map(
          value =>
            value.toString(),
        ),

      Ry:
        Ry.map(
          value =>
            value.toString(),
        ),

      Sx:
        Sx.map(
          value =>
            value.toString(),
        ),

      Sy:
        Sy.map(
          value =>
            value.toString(),
        ),
    }

    const {
      proof,
      publicSignals,
    } =
      await groth16.fullProve(
        input,
        appProfile
          .directArtifacts
          .wasmUrl,
        appProfile
          .directArtifacts
          .zkeyUrl,
      )

    if (
      !Array.isArray(
        publicSignals,
      ) ||
      publicSignals.length !== 73
    ) {
      throw new Error(
        "DIRECT prover did not return 73 public signals",
      )
    }

    const expectedPublic = [
      publicConfig
        .config
        .eligibleRoot,
      electionId.toString(),
      manifest.toString(),
      String(candidateCount),
      publicConfig
        .config
        .contractDomain,
      publicConfig
        .config
        .Yx,
      publicConfig
        .config
        .Yy,
      context.toString(),
      nullifier.toString(),
      ...Rx.map(
        value =>
          value.toString(),
      ),
      ...Ry.map(
        value =>
          value.toString(),
      ),
      ...Sx.map(
        value =>
          value.toString(),
      ),
      ...Sy.map(
        value =>
          value.toString(),
      ),
    ]

    if (
      expectedPublic.length !==
      73
    ) {
      throw new Error(
        "Internal DIRECT public-signal layout error",
      )
    }

    for (
      let i = 0;
      i < 73;
      i += 1
    ) {
      if (
        BigInt(
          publicSignals[i],
        ) !==
        BigInt(
          expectedPublic[i],
        )
      ) {
        throw new Error(
          `DIRECT public signal mismatch at index ${i}`,
        )
      }
    }

    const verificationKeyResponse =
      await fetch(
        appProfile
          .directArtifacts
          .verificationKeyUrl,
        {
          cache: "no-store",
        },
      )

    if (
      !verificationKeyResponse.ok
    ) {
      throw new Error(
        "Unable to load DIRECT verification key",
      )
    }

    const verificationKey =
      await verificationKeyResponse.json()

    const locallyVerified =
      await groth16.verify(
        verificationKey,
        publicSignals,
        proof,
      )

    if (!locallyVerified) {
      throw new Error(
        "Locally generated DIRECT proof did not verify",
      )
    }

    const calldataText =
      await groth16
        .exportSolidityCallData(
          proof,
          publicSignals,
        )

    const [
      rawA,
      rawB,
      rawC,
      rawPublic,
    ] =
      JSON.parse(
        `[${calldataText}]`,
      )

    if (
      !Array.isArray(rawA) ||
      rawA.length !== 2 ||
      !Array.isArray(rawB) ||
      rawB.length !== 2 ||
      !Array.isArray(rawC) ||
      rawC.length !== 2 ||
      !Array.isArray(rawPublic) ||
      rawPublic.length !== 73
    ) {
      throw new Error(
        "Unexpected Groth16 Solidity calldata shape",
      )
    }

    for (
      let i = 0;
      i < 73;
      i += 1
    ) {
      if (
        BigInt(rawPublic[i]) !==
        BigInt(
          publicSignals[i],
        )
      ) {
        throw new Error(
          "Groth16 calldata/public-signal mismatch",
        )
      }
    }

    return {
      a:
        rawA.map(
          normalizeScalar,
        ),

      b:
        rawB.map(
          (row: unknown[]) =>
            row.map(
              normalizeScalar,
            ),
        ),

      c:
        rawC.map(
          normalizeScalar,
        ),

      nullifier:
        nullifier.toString(),

      rx:
        Rx.map(
          value =>
            value.toString(),
        ),

      ry:
        Ry.map(
          value =>
            value.toString(),
        ),

      sx:
        Sx.map(
          value =>
            value.toString(),
        ),

      sy:
        Sy.map(
          value =>
            value.toString(),
        ),
    }
  } finally {
    secret = 0n

    randomness.fill(
      0n,
    )

    sessionKeyPair =
      null
  }
}

type RequestMessage =
  {
    id: number
    type: "BEGIN_AUTH"
  } |
  {
    id: number
    type: "PREPARE_BALLOT"
    candidateId: number
    authorization:
      Wp5Authorization
    publicConfig:
      Wp5PublicConfig
  } |
  {
    id: number
    type: "CLEAR"
  }

self.onmessage =
  async (
    event:
      MessageEvent<RequestMessage>,
  ) => {
    const message =
      event.data

    try {
      let result:
        unknown

      if (
        message.type ===
        "BEGIN_AUTH"
      ) {
        result =
          await beginAuthorization()
      } else if (
        message.type ===
        "PREPARE_BALLOT"
      ) {
        result =
          await prepareBallot(
            message.candidateId,
            message.authorization,
            message.publicConfig,
          )
      } else if (
        message.type ===
        "CLEAR"
      ) {
        sessionKeyPair =
          null

        result = {
          cleared: true,
        }
      } else {
        throw new Error(
          "Unknown WP5 privacy-worker request",
        )
      }

      self.postMessage({
        id:
          message.id,
        ok: true,
        result,
      })
    } catch (error) {
      sessionKeyPair =
        null

      self.postMessage({
        id:
          message.id,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "WP5 privacy worker failed",
      })
    }
  }

export {}
