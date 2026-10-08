import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const CREDENTIAL_VERSION = 1

function getCredentialKey(secret = process.env.ZK_CREDENTIAL_SECRET_KEY) {
  if (!secret) throw new Error('ZK_CREDENTIAL_SECRET_KEY is missing from environment')
  if (Buffer.byteLength(secret, 'utf8') !== 32) {
    throw new Error('ZK_CREDENTIAL_SECRET_KEY must be exactly 32 bytes for AES-256-GCM')
  }
  return Buffer.from(secret, 'utf8')
}

export function encryptZkCredential(credential, identityCommitment, secret) {
  if (typeof credential !== 'string' || credential.length === 0) throw new Error('Semaphore credential is required')
  if (!identityCommitment) throw new Error('Identity commitment is required for credential binding')

  const key = getCredentialKey(secret)
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  cipher.setAAD(Buffer.from(String(identityCommitment), 'utf8'))

  const ciphertext = Buffer.concat([cipher.update(credential, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    version: CREDENTIAL_VERSION,
    iv: iv.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

export function decryptZkCredential(encryptedCredential, identityCommitment, secret) {
  if (!encryptedCredential || encryptedCredential.version !== CREDENTIAL_VERSION) {
    throw new Error('Unsupported or missing ZK credential version')
  }
  if (!identityCommitment) throw new Error('Identity commitment is required for credential binding')

  const key = getCredentialKey(secret)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(encryptedCredential.iv, 'hex'))
  decipher.setAAD(Buffer.from(String(identityCommitment), 'utf8'))
  decipher.setAuthTag(Buffer.from(encryptedCredential.authTag, 'hex'))

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encryptedCredential.ciphertext, 'hex')),
    decipher.final(),
  ])
  return plaintext.toString('utf8')
}
