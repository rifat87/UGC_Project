export const CANDIDATE_COUNTER_ID = 'candidateId'

export async function allocateCandidateIdWithModel(CounterModel) {
  const counter = await CounterModel.findOneAndUpdate(
    { _id: CANDIDATE_COUNTER_ID },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )

  const candidateId = Number(counter.seq)
  if (!Number.isSafeInteger(candidateId) || candidateId <= 0) {
    throw new Error('Allocated candidate ID is not a positive safe integer')
  }
  return candidateId
}

export function sanitizeCandidateMetadata(input = {}) {
  return {
    nationalId: input.nationalId,
    name: input.name,
    party: input.party,
    location: input.location,
    age: input.age,
  }
}

export function normalizeCandidateElectionId(value) {
  const electionId =
    String(
      value ?? "",
    ).trim()

  if (
    !/^\d+$/.test(
      electionId,
    ) ||
    BigInt(
      electionId,
    ) <= 0n
  ) {
    const error =
      new Error(
        "A positive decimal electionId is required",
      )

    error.code =
      "INVALID_ELECTION_ID"

    throw error
  }

  return electionId
}

export async function createCandidateWithModels(
  metadata,
  electionId,
  {
    CandidateModel,
    CounterModel,
  },
) {
  const normalizedElectionId =
    normalizeCandidateElectionId(
      electionId,
    )

  const cleanMetadata =
    sanitizeCandidateMetadata(
      metadata,
    )

  const existingCandidate =
    await CandidateModel.findOne({
      electionId:
        normalizedElectionId,

      nationalId:
        cleanMetadata.nationalId,
    })
  if (existingCandidate) {
    const error = new Error('A candidate with this National ID already exists in the current election')
    error.code = 'DUPLICATE_NID'
    throw error
  }

  const candidateId = await allocateCandidateIdWithModel(CounterModel)
  const candidate = new CandidateModel({
    ...cleanMetadata,
    electionId:
      normalizedElectionId,
    candidateId,
    registrationStatus: 'pending',
  })
  await candidate.save()
  return candidate
}

export async function setCandidateRegistrationStatusWithModel(
  candidateId,
  registrationStatus,
  electionId,
  CandidateModel,
) {
  if (!['pending', 'registered', 'failed'].includes(registrationStatus)) {
    throw new Error('Invalid candidate registration status')
  }

  const normalizedElectionId =
    normalizeCandidateElectionId(
      electionId,
    )

  const candidate =
    await CandidateModel.findOneAndUpdate(
      {
        candidateId:
          Number(
            candidateId,
          ),

        electionId:
          normalizedElectionId,
      },
      {
        $set: {
          registrationStatus,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    )

  if (!candidate) {
    const error = new Error('Candidate not found in the current election')
    error.code = 'NOT_FOUND'
    throw error
  }
  return candidate
}

export async function ensureCandidateCounterAtLeastWithModel(value, CounterModel) {
  const floor = Number(value)
  if (!Number.isSafeInteger(floor) || floor < 0) {
    throw new Error('Counter floor must be a non-negative safe integer')
  }

  return CounterModel.findOneAndUpdate(
    { _id: CANDIDATE_COUNTER_ID },
    { $max: { seq: floor } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
}
