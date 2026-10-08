import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  toCandidateWorkflowResponse,
  toSafeVoterResponse,
  toZkVoterEnrollmentResponse,
} from '../services/privacyProjection.js'

const sensitiveKeys = new Set([
  'nationalId',
  'voterHash',
  'encryptedSalt',
  'salt',
  'dateOfBirth',
  'birthDate',
  'biometric',
  'biometricData',
  'zkCredential',
  'privateIdentity',
  'decryptionKey',
])

function assertNoSensitiveKeys(value) {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    assert.equal(sensitiveKeys.has(key), false, `Sensitive key leaked: ${key}`)
    assertNoSensitiveKeys(child)
  }
}

test('candidate workflow projection omits candidate NID and voter-sensitive fields', () => {
  const projected = toCandidateWorkflowResponse({
    _id: 'mongo-candidate',
    candidateId: 9,
    nationalId: '1234567890',
    name: 'Alice Example',
    party: 'Example Party',
    location: 'Dhaka',
    age: 40,
    registrationStatus: 'pending',
  })

  assert.deepEqual(projected, {
    id: 'mongo-candidate',
    candidateId: 9,
    name: 'Alice Example',
    party: 'Example Party',
    location: 'Dhaka',
    age: 40,
    registrationStatus: 'pending',
  })
  assertNoSensitiveKeys(projected)
})

test('voter document projection omits NID, voterHash, encrypted salt, and DOB', () => {
  const projected = toSafeVoterResponse({
    _id: 'mongo-voter',
    nationalId: '1234567890',
    voterHash: `0x${'11'.repeat(32)}`,
    encryptedSalt: 'ciphertext',
    dateOfBirth: '1990-01-01',
    name: 'Voter Example',
    location: 'Dhaka',
    zkRegistrationStatus: 'registered',
    zkCredential: { ciphertext: 'secret' },
  })

  assert.deepEqual(projected, {
    id: 'mongo-voter',
    name: 'Voter Example',
    location: 'Dhaka',
    zkRegistrationStatus: 'registered',
  })
  assertNoSensitiveKeys(projected)
})

test('ZK enrollment response exposes only public commitment plus safe voter projection', () => {
  const projected = toZkVoterEnrollmentResponse({
    _id: 'mongo-voter',
    nationalId: '1234567890',
    voterHash: 'legacy-hash',
    zkIdentityCommitment: '12345678901234567890',
    zkCredential: { ciphertext: 'encrypted-private-identity' },
    name: 'Voter Example',
    location: 'Dhaka',
    zkRegistrationStatus: 'pending',
  })
  assert.deepEqual(projected, {
    voter: {
      id: 'mongo-voter',
      name: 'Voter Example',
      location: 'Dhaka',
      zkRegistrationStatus: 'pending',
    },
    identityCommitment: '12345678901234567890',
  })
  assertNoSensitiveKeys(projected)
})

test('unused raw Candidate/Voter GET routes are removed', () => {
  const candidateRoutes = readFileSync(new URL('../routes/candidateRoutes.js', import.meta.url), 'utf8')
  const voterRoutes = readFileSync(new URL('../routes/voterRoutes.js', import.meta.url), 'utf8')

  assert.doesNotMatch(candidateRoutes, /router\.get\(\s*['"]\/["']/)
  assert.doesNotMatch(candidateRoutes, /router\.get\(\s*['"]\/:id["']/)
  assert.doesNotMatch(voterRoutes, /router\.get\(\s*['"]\/["']/)
  assert.doesNotMatch(voterRoutes, /router\.get\(\s*['"]\/voter["']/)
})
