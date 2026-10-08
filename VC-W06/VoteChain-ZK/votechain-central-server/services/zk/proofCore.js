import { decryptZkCredential } from './credentialCrypto.js'
import { normalizeSemaphoreProof } from './proofSerialization.js'

function validateCandidateId(candidateId) {
  const value = Number(candidateId)
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('A positive candidateId is required')
  return value
}

export async function generateBoundSemaphoreProof({ runtime, voter, candidateId, electionId, group, chainRegistered, secret, snarkArtifacts }) {
  if (!voter) throw new Error('Verified voter record is required')
  if (chainRegistered !== true) throw new Error('Voter ZK commitment is not registered on-chain')
  if (!voter.zkIdentityCommitment || !voter.zkCredential) throw new Error('Voter does not have an enrolled ZK credential')

  const selectedCandidateId = validateCandidateId(candidateId)
  const normalizedElectionId = BigInt(electionId)
  const exportedCredential = decryptZkCredential(voter.zkCredential, voter.zkIdentityCommitment, secret)
  const identity = runtime.Identity.import(exportedCredential)

  if (identity.commitment.toString() !== voter.zkIdentityCommitment.toString()) {
    throw new Error('Decrypted Semaphore identity does not match stored commitment')
  }

  const proof = await runtime.generateProof(
    identity,
    group,
    BigInt(selectedCandidateId),
    normalizedElectionId,
    undefined,
    snarkArtifacts,
  )
  const normalized = normalizeSemaphoreProof(proof)

  if (BigInt(normalized.message) !== BigInt(selectedCandidateId)) throw new Error('Generated proof message does not match candidateId')
  if (BigInt(normalized.scope) !== normalizedElectionId) throw new Error('Generated proof scope does not match electionId')

  if (typeof runtime.verifyProof === 'function' && !(await runtime.verifyProof(proof))) {
    throw new Error('Generated Semaphore proof failed local verification')
  }

  return {
    candidateId: selectedCandidateId,
    electionId: normalizedElectionId.toString(),
    proof: normalized,
  }
}
