export function toCandidateWorkflowResponse(candidate) {
  return {
    id: String(candidate._id),
    candidateId: candidate.candidateId,
    name: candidate.name,
    party: candidate.party,
    location: candidate.location,
    age: candidate.age,
    registrationStatus: candidate.registrationStatus,
  }
}

export function toSafeVoterResponse(voter) {
  return {
    id: String(voter._id),
    name: voter.name,
    location: voter.location,
    zkRegistrationStatus: voter.zkRegistrationStatus,
  }
}

export function toZkVoterEnrollmentResponse(voter) {
  return {
    voter: toSafeVoterResponse(voter),
    identityCommitment: voter.zkIdentityCommitment,
  }
}
