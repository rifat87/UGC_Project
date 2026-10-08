import { encryptZkCredential } from './credentialCrypto.js'
import { loadSemaphoreRuntime } from './semaphoreRuntime.js'

export async function createEncryptedSemaphoreIdentity({ runtime, secret } = {}) {
  const semaphoreRuntime = runtime || await loadSemaphoreRuntime()
  const identity = new semaphoreRuntime.Identity()
  const identityCommitment = identity.commitment.toString()
  const exportedCredential = identity.export()
  const encryptedCredential = encryptZkCredential(exportedCredential, identityCommitment, secret)

  return {
    identityCommitment,
    encryptedCredential,
  }
}
