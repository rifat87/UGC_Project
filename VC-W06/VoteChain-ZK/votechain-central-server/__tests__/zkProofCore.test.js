import test from 'node:test'
import assert from 'node:assert/strict'
import { encryptZkCredential } from '../services/zk/credentialCrypto.js'
import { generateBoundSemaphoreProof } from '../services/zk/proofCore.js'

const secret = '12345678901234567890123456789012'
const commitment = '555555'

class FakeIdentity {
  static import(serialized) {
    assert.equal(serialized, 'serialized-secret')
    return { commitment: 555555n }
  }
}

const runtime = {
  Identity: FakeIdentity,
  async generateProof(identity, group, message, scope) {
    assert.equal(identity.commitment, 555555n)
    assert.equal(group.marker, 'group')
    return {
      merkleTreeDepth: 1,
      merkleTreeRoot: 999n,
      nullifier: 777n,
      message: BigInt(message),
      scope: BigInt(scope),
      points: [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n],
    }
  },
  async verifyProof() { return true },
}

function voter(overrides = {}) {
  return {
    zkIdentityCommitment: commitment,
    zkRegistrationStatus: 'registered',
    zkCredential: encryptZkCredential('serialized-secret', commitment, secret),
    ...overrides,
  }
}

test('biometric-authorized proof core binds candidateId as message and electionId as scope', async () => {
  const result = await generateBoundSemaphoreProof({
    runtime,
    voter: voter(),
    candidateId: 7,
    electionId: 20260818n,
    group: { marker: 'group' },
    chainRegistered: true,
    secret,
  })

  assert.equal(result.candidateId, 7)
  assert.equal(result.electionId, '20260818')
  assert.equal(result.proof.message, '7')
  assert.equal(result.proof.scope, '20260818')
  assert.equal(result.proof.nullifier, '777')
  assert.equal('identity' in result, false)
  assert.equal('credential' in result, false)
  assert.equal('voterHash' in result, false)
})

test('proof generation refuses voters whose ZK commitment is not chain-registered', async () => {
  await assert.rejects(
    () => generateBoundSemaphoreProof({
      runtime,
      voter: voter({ zkRegistrationStatus: 'pending' }),
      candidateId: 7,
      electionId: 20260818n,
      group: { marker: 'group' },
      chainRegistered: false,
      secret,
    }),
    /not registered/i,
  )
})

test('proof generation detects encrypted credential/commitment mismatch', async () => {
  const mismatched = voter({ zkIdentityCommitment: '666666' })
  mismatched.zkCredential = encryptZkCredential('serialized-secret', '666666', secret)
  await assert.rejects(
    () => generateBoundSemaphoreProof({
      runtime,
      voter: mismatched,
      candidateId: 7,
      electionId: 20260818n,
      group: { marker: 'group' },
      chainRegistered: true,
      secret,
    }),
    /does not match stored commitment/i,
  )
})
