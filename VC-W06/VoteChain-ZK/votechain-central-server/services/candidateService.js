import Candidate from '../models/Candidate.js'
import Counter from '../models/Counter.js'
import {
  allocateCandidateIdWithModel,
  createCandidateWithModels,
  ensureCandidateCounterAtLeastWithModel,
  sanitizeCandidateMetadata,
  setCandidateRegistrationStatusWithModel,
} from './candidateCore.js'

export { sanitizeCandidateMetadata }

export async function allocateCandidateId({ CounterModel = Counter } = {}) {
  return allocateCandidateIdWithModel(CounterModel)
}

export async function createCandidate(
  metadata,
  electionId,
  {
    CandidateModel = Candidate,
    CounterModel = Counter,
  } = {},
) {
  return createCandidateWithModels(
    metadata,
    electionId,
    {
      CandidateModel,
      CounterModel,
    },
  )
}

export async function setCandidateRegistrationStatus(
  candidateId,
  registrationStatus,
  electionId,
  {
    CandidateModel = Candidate,
  } = {},
) {
  return setCandidateRegistrationStatusWithModel(
    candidateId,
    registrationStatus,
    electionId,
    CandidateModel,
  )
}

export async function ensureCandidateCounterAtLeast(value, { CounterModel = Counter } = {}) {
  return ensureCandidateCounterAtLeastWithModel(value, CounterModel)
}
