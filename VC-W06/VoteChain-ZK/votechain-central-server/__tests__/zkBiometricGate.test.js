import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareProofAfterBiometricAuthentication } from '../services/zk/biometricProofGate.js'

test('successful biometric authentication may cross the proof-generation gate', async () => {
  const voter = { id: 'synthetic-voter' }
  let calls = 0
  const result = await prepareProofAfterBiometricAuthentication({
    biometricAccepted: true,
    voter,
    candidateId: 7,
    proofGenerator: async (receivedVoter, candidateId) => {
      calls += 1
      assert.equal(receivedVoter, voter)
      assert.equal(candidateId, 7)
      return { proof: 'synthetic-proof' }
    },
  })

  assert.equal(calls, 1)
  assert.deepEqual(result, { proof: 'synthetic-proof' })
})

test('failed biometric authentication cannot reach proof generation', async () => {
  let calls = 0
  await assert.rejects(
    prepareProofAfterBiometricAuthentication({
      biometricAccepted: false,
      voter: { id: 'synthetic-voter' },
      candidateId: 7,
      proofGenerator: async () => {
        calls += 1
        return { proof: 'must-not-exist' }
      },
    }),
    /Biometric authentication is required/i,
  )
  assert.equal(calls, 0)
})
