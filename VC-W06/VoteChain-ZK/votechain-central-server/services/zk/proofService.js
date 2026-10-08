import { getContract } from '../../utils/contract.js'
import { loadSemaphoreRuntime } from './semaphoreRuntime.js'
import { reconstructElectionGroup } from './groupService.js'
import { generateBoundSemaphoreProof } from './proofCore.js'
import { getConfiguredSnarkArtifacts } from './snarkArtifacts.js'

export async function generateVoteProofForVoter(voter, candidateId, options = {}) {
  const runtime = options.runtime || await loadSemaphoreRuntime()
  const contract = options.contract || getContract()
  const normalizedCandidateId = Number(candidateId)

  if (!Number.isSafeInteger(normalizedCandidateId) || normalizedCandidateId <= 0) {
    throw new Error('A positive candidateId is required before ZK proof generation')
  }
  if (!voter?.zkIdentityCommitment || !/^\d+$/.test(String(voter.zkIdentityCommitment))) {
    throw new Error('Verified voter does not have a valid ZK identity commitment')
  }

  const [{ group }, electionId, chainRegistered, electionState, candidateState] = await Promise.all([
    reconstructElectionGroup({ runtime, contract, fromBlock: options.fromBlock }),
    contract.electionId(),
    contract.registeredCommitments(BigInt(voter.zkIdentityCommitment)),
    contract.getElectionState(),
    contract.candidates(BigInt(normalizedCandidateId)),
  ])

  if (Number(electionState) !== 1) {
    throw new Error('Anonymous vote proof generation is only available while the election is Active')
  }
  const candidateExists = Boolean(candidateState?.exists ?? candidateState?.[0])
  if (!candidateExists) {
    throw new Error('Selected candidate is not registered on-chain')
  }

  return generateBoundSemaphoreProof({
    runtime,
    voter,
    candidateId: normalizedCandidateId,
    electionId,
    group,
    chainRegistered: Boolean(chainRegistered),
    secret: options.secret,
    snarkArtifacts: options.snarkArtifacts || getConfiguredSnarkArtifacts(),
  })
}
