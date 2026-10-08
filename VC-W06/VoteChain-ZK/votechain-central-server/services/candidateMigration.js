import {
  allocateCandidateIdWithModel,
  ensureCandidateCounterAtLeastWithModel,
} from './candidateCore.js'

export const CANDIDATE_ID_INDEX_NAME = 'candidateId_unique_valid'
export const CANDIDATE_ID_PARTIAL_FILTER = {
  candidateId: { $type: 'number', $gte: 1 },
}

function isCandidateIdOnlyIndex(index) {
  return index?.key?.candidateId === 1 && Object.keys(index.key).length === 1
}

function isSafeCandidateIdIndex(index) {
  const filter = index?.partialFilterExpression?.candidateId
  return isCandidateIdOnlyIndex(index)
    && index.unique === true
    && filter?.$type === 'number'
    && filter?.$gte === 1
}

async function inspectExistingCandidateIds(candidateCollection) {
  const records = await candidateCollection.find(
    { candidateId: { $exists: true, $ne: null } },
    { projection: { _id: 1, candidateId: 1 } },
  ).toArray()

  const seen = new Set()
  let highest = 0

  for (const record of records) {
    const candidateId = Number(record.candidateId)
    if (!Number.isSafeInteger(candidateId) || candidateId <= 0) {
      throw new Error(`Existing candidate record ${record._id} has an invalid candidateId`)
    }
    if (seen.has(candidateId)) {
      throw new Error(`Duplicate existing candidateId ${candidateId}; migration stopped before index changes`)
    }
    seen.add(candidateId)
    highest = Math.max(highest, candidateId)
  }

  return { highest, count: records.length }
}

export async function ensureSafeCandidateIdIndex(candidateCollection) {
  const inspection = await inspectExistingCandidateIds(candidateCollection)
  const indexes = await candidateCollection.indexes()
  const candidateIndexes = indexes.filter(isCandidateIdOnlyIndex)
  const safeExisting = candidateIndexes.find(isSafeCandidateIdIndex)

  if (safeExisting) {
    return { ...inspection, indexName: safeExisting.name, indexChanged: false }
  }

  // Replace only indexes whose entire key is candidateId. This removes the
  // legacy non-partial unique index without touching unrelated indexes.
  for (const index of candidateIndexes) {
    await candidateCollection.dropIndex(index.name)
  }

  const indexName = await candidateCollection.createIndex(
    { candidateId: 1 },
    {
      name: CANDIDATE_ID_INDEX_NAME,
      unique: true,
      partialFilterExpression: CANDIDATE_ID_PARTIAL_FILTER,
    },
  )

  return { ...inspection, indexName, indexChanged: true }
}

export async function migrateCandidateIdsWithModels({
  CandidateModel,
  CounterModel,
  logger = console,
}) {
  const candidateCollection = CandidateModel.collection
  const indexResult = await ensureSafeCandidateIdIndex(candidateCollection)

  // Advance the atomic counter above all already-allocated IDs before assigning
  // any legacy records, so existing IDs are preserved and cannot be reused.
  await ensureCandidateCounterAtLeastWithModel(indexResult.highest, CounterModel)

  const legacyCandidates = await candidateCollection.find(
    {
      $or: [
        { candidateId: { $exists: false } },
        { candidateId: null },
      ],
    },
    { projection: { _id: 1 } },
  ).sort({ _id: 1 }).toArray()

  let migrated = 0
  let skipped = 0

  for (const candidate of legacyCandidates) {
    const candidateId = await allocateCandidateIdWithModel(CounterModel)
    const result = await candidateCollection.updateOne(
      {
        _id: candidate._id,
        $or: [
          { candidateId: { $exists: false } },
          { candidateId: null },
        ],
      },
      { $set: { candidateId, registrationStatus: 'pending' } },
    )

    if (result.modifiedCount === 1) {
      migrated += 1
      logger.info(`Migrated candidate record ${candidate._id} -> candidateId ${candidateId}`)
    } else {
      skipped += 1
      logger.info(`Skipped candidate record ${candidate._id}; candidateId was already assigned`)
    }
  }

  return {
    migrated,
    skipped,
    existingCandidateCount: indexResult.count,
    highestExistingCandidateId: indexResult.highest,
    indexName: indexResult.indexName,
    indexChanged: indexResult.indexChanged,
  }
}
