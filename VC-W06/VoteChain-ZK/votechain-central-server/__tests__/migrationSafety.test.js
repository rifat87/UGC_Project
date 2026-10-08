import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CANDIDATE_ID_INDEX_NAME,
  migrateCandidateIdsWithModels,
} from '../services/candidateMigration.js'

function isLegacy(record) {
  return record.candidateId === undefined || record.candidateId === null
}

class FakeCursor {
  constructor(records) {
    this.records = records
  }

  sort(spec) {
    const [[field, direction]] = Object.entries(spec)
    this.records.sort((left, right) => {
      const a = String(left[field])
      const b = String(right[field])
      return direction >= 0 ? a.localeCompare(b) : b.localeCompare(a)
    })
    return this
  }

  async toArray() {
    return this.records.map((record) => ({ ...record }))
  }
}

class FakeCandidateCollection {
  constructor(records) {
    this.records = records.map((record) => ({ ...record }))
    this.indexList = [
      { name: '_id_', key: { _id: 1 }, unique: true },
      { name: 'candidateId_1', key: { candidateId: 1 }, unique: true },
    ]
    this.droppedIndexes = []
    this.createdIndexes = []
  }

  find(filter) {
    let records
    if (filter.$or) {
      records = this.records.filter(isLegacy)
    } else if (filter.candidateId?.$exists === true) {
      records = this.records.filter((record) => !isLegacy(record))
    } else {
      records = [...this.records]
    }
    return new FakeCursor(records)
  }

  async indexes() {
    return this.indexList.map((index) => structuredClone(index))
  }

  async dropIndex(name) {
    this.droppedIndexes.push(name)
    this.indexList = this.indexList.filter((index) => index.name !== name)
  }

  async createIndex(key, options) {
    const index = { key: structuredClone(key), ...structuredClone(options) }
    this.createdIndexes.push(index)
    this.indexList.push(index)
    return options.name
  }

  async updateOne(filter, update) {
    const record = this.records.find((item) => item._id === filter._id)
    if (!record || !isLegacy(record)) return { modifiedCount: 0 }
    Object.assign(record, update.$set)
    return { modifiedCount: 1 }
  }
}

class FakeCandidateModel {
  static collection
}

class FakeCounterModel {
  static seq = 0

  static async findOneAndUpdate(_filter, update) {
    if (update.$max?.seq !== undefined) {
      this.seq = Math.max(this.seq, update.$max.seq)
    }
    if (update.$inc?.seq !== undefined) {
      this.seq += update.$inc.seq
    }
    return { seq: this.seq }
  }
}

test('migration safely handles multiple legacy candidates and preserves existing allocated IDs', async () => {
  const collection = new FakeCandidateCollection([
    { _id: 'a', candidateId: 2, nationalId: '1111111111', registrationStatus: 'registered' },
    { _id: 'b', nationalId: '2222222222' },
    { _id: 'c', candidateId: null, nationalId: '3333333333', registrationStatus: 'failed' },
    { _id: 'd', candidateId: 5, nationalId: '4444444444', registrationStatus: 'registered' },
  ])
  FakeCandidateModel.collection = collection
  FakeCounterModel.seq = 3

  const logLines = []
  const result = await migrateCandidateIdsWithModels({
    CandidateModel: FakeCandidateModel,
    CounterModel: FakeCounterModel,
    logger: { info: (line) => logLines.push(line) },
  })

  const byId = new Map(collection.records.map((record) => [record._id, record]))

  assert.equal(byId.get('a').candidateId, 2)
  assert.equal(byId.get('d').candidateId, 5)
  assert.equal(byId.get('b').candidateId, 6)
  assert.equal(byId.get('c').candidateId, 7)
  assert.equal(byId.get('b').registrationStatus, 'pending')
  assert.equal(byId.get('c').registrationStatus, 'pending')
  assert.equal(FakeCounterModel.seq, 7)
  assert.equal(result.migrated, 2)
  assert.equal(result.highestExistingCandidateId, 5)

  assert.deepEqual(collection.droppedIndexes, ['candidateId_1'])
  assert.equal(collection.createdIndexes.length, 1)
  assert.deepEqual(collection.createdIndexes[0], {
    key: { candidateId: 1 },
    name: CANDIDATE_ID_INDEX_NAME,
    unique: true,
    partialFilterExpression: { candidateId: { $type: 'number', $gte: 1 } },
  })

  assert.ok(logLines.every((line) => !/1111111111|2222222222|3333333333|4444444444/.test(line)))
})

test('migration stops before index changes when existing candidate IDs are duplicated', async () => {
  const collection = new FakeCandidateCollection([
    { _id: 'a', candidateId: 4 },
    { _id: 'b', candidateId: 4 },
    { _id: 'c' },
  ])
  FakeCandidateModel.collection = collection
  FakeCounterModel.seq = 0

  await assert.rejects(
    () => migrateCandidateIdsWithModels({
      CandidateModel: FakeCandidateModel,
      CounterModel: FakeCounterModel,
      logger: { info: () => {} },
    }),
    /Duplicate existing candidateId 4/,
  )

  assert.deepEqual(collection.droppedIndexes, [])
  assert.deepEqual(collection.createdIndexes, [])
})
