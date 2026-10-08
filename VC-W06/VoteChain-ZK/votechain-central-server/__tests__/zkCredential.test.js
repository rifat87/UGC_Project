import test from 'node:test'
import assert from 'node:assert/strict'
import { encryptZkCredential, decryptZkCredential } from '../services/zk/credentialCrypto.js'
import { createEncryptedSemaphoreIdentity } from '../services/zk/identityService.js'

const keyA = '12345678901234567890123456789012'
const keyB = 'abcdefghijklmnopqrstuvwxyzABCDEF'

test('ZK credential encryption/decryption round-trip succeeds', () => {
  const encrypted = encryptZkCredential('private-semaphore-identity', '123456789', keyA)
  assert.notEqual(encrypted.ciphertext, 'private-semaphore-identity')
  assert.equal(decryptZkCredential(encrypted, '123456789', keyA), 'private-semaphore-identity')
})

test('wrong ZK credential encryption key fails authentication', () => {
  const encrypted = encryptZkCredential('private-semaphore-identity', '123456789', keyA)
  assert.throws(() => decryptZkCredential(encrypted, '123456789', keyB))
})

test('identity enrollment uses random Identity constructor and returns only encrypted private credential', async () => {
  let constructorCalls = 0
  class FakeIdentity {
    constructor() {
      constructorCalls += 1
      this.commitment = 987654321n
    }
    export() { return 'secret-exported-identity' }
  }

  const result = await createEncryptedSemaphoreIdentity({ runtime: { Identity: FakeIdentity }, secret: keyA })
  assert.equal(constructorCalls, 1)
  assert.equal(result.identityCommitment, '987654321')
  assert.equal('privateIdentity' in result, false)
  assert.equal('identity' in result, false)
  assert.equal(decryptZkCredential(result.encryptedCredential, result.identityCommitment, keyA), 'secret-exported-identity')
})
