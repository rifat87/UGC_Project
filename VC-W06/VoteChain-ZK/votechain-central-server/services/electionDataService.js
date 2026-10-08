import { mapElectionState } from '../utils/electionState.js'

export async function buildPublicElectionData({ candidateRecords, contract }) {
  const electionState = mapElectionState(await contract.getElectionState())
  const candidates = []

  for (const candidate of candidateRecords) {
    if (!Number.isSafeInteger(Number(candidate.candidateId)) || Number(candidate.candidateId) <= 0) continue

    const chainCandidate = await contract.candidates(candidate.candidateId)
    const exists = Boolean(chainCandidate.exists ?? chainCandidate[0])
    if (!exists) continue

    const voteCountRaw = chainCandidate.voteCount ?? chainCandidate[1]
    candidates.push({
      candidateId: Number(candidate.candidateId),
      name: candidate.name,
      party: candidate.party,
      location: candidate.location,
      voteCount: Number(voteCountRaw),
    })
  }

  return {
    electionState,
    candidateCount: candidates.length,
    candidates,
  }
}
