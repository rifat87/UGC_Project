import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getSecretKey() {
  const secret = process.env.VOTER_SALT_SECRET_KEY

  if (!secret) {
    throw new Error('VOTER_SALT_SECRET_KEY is missing from .env')
  }

  if (Buffer.byteLength(secret, 'utf8') !== 32) {
    throw new Error('VOTER_SALT_SECRET_KEY must be exactly 32 bytes for AES-256')
  }

  return Buffer.from(secret, 'utf8')
}

export function generateRandomSalt() {
  return crypto.randomBytes(32).toString('hex')
}

export function encryptSalt(salt) {
  const key = getSecretKey()
  const iv = crypto.randomBytes(12)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(salt, 'utf8'),
    cipher.final()
  ])

  const authTag = cipher.getAuthTag()

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

export function decryptSalt(encryptedSalt) {
  const key = getSecretKey()

  const iv = Buffer.from(encryptedSalt.iv, 'hex')
  const encryptedData = Buffer.from(encryptedSalt.encryptedData, 'hex')
  const authTag = Buffer.from(encryptedSalt.authTag, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ])

  return decrypted.toString('utf8')
}

export function generateVoterHash(nationalId, salt) {
  return (
    '0x' +
    crypto
      .createHash('sha256')
      .update(`${nationalId}:${salt}`)
      .digest('hex')
  )
}