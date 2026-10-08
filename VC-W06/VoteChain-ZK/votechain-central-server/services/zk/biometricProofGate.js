/**
 * Pure authentication gate placed in front of Semaphore proof generation.
 * The caller injects the backend proof generator only after a successful biometric match,
 * which keeps this boundary testable without loading blockchain/network dependencies.
 */
export async function prepareProofAfterBiometricAuthentication({
  biometricAccepted,
  voter,
  candidateId,
  proofGenerator,
}) {
  if (biometricAccepted !== true) {
    throw new Error('Biometric authentication is required before ZK proof generation')
  }
  if (!voter) {
    throw new Error('Biometrically verified voter record is required before ZK proof generation')
  }
  if (typeof proofGenerator !== 'function') {
    throw new Error('Backend ZK proof generator is required')
  }

  return proofGenerator(voter, candidateId)
}
