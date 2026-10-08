import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  allocateCandidateIdWithModel,
  createCandidateWithModels,
} from '../services/candidateCore.js'

class FakeCounterModel {
  static seq = 0
  static async findOneAndUpdate(_filter, update) {
    if (update.$inc?.seq) this.seq += update.$inc.seq
    return { seq: this.seq }
  }
}

class FakeCandidateModel {
  static records = []
  static async findOne(filter) {
    return this.records.find((candidate) => candidate.nationalId === filter.nationalId) || null
  }
  constructor(data) { Object.assign(this, data) }
  async save() { FakeCandidateModel.records.push(this); return this }
}

function reset() {
  FakeCounterModel.seq = 0
  FakeCandidateModel.records = []
}

test('candidate IDs are positive, unique, and sequential', async () => {
  reset()
  const first = await allocateCandidateIdWithModel(FakeCounterModel)
  const second = await allocateCandidateIdWithModel(FakeCounterModel)
  assert.equal(first, 1)
  assert.equal(second, 2)
  assert.ok(first > 0 && second > 0)
  assert.equal(new Set([first, second]).size, 2)
})

test('client supplied candidateId cannot override backend allocation', async () => {
  reset()
  const candidate = await createCandidateWithModels({
    candidateId: 999,
    registrationStatus: 'registered',
    nationalId: '1234567890',
    name: 'Alice Example',
    party: 'Example Party',
    location: 'Dhaka',
    age: 40,
  },
      String(process.pid), { CandidateModel: FakeCandidateModel, CounterModel: FakeCounterModel })

  assert.equal(candidate.candidateId, 1)
  assert.equal(candidate.registrationStatus, 'pending')
})

test('duplicate candidate NID protection remains', async () => {
  reset()
  const metadata = { nationalId: '1234567890', name: 'Alice Example', party: 'Example Party', location: 'Dhaka', age: 40 }
  await createCandidateWithModels(metadata,
      String(process.pid), { CandidateModel: FakeCandidateModel, CounterModel: FakeCounterModel })
  await assert.rejects(
    () => createCandidateWithModels(metadata,
      String(process.pid), { CandidateModel: FakeCandidateModel, CounterModel: FakeCounterModel }),
    /already exists/,
  )
})

test('Candidate schema keeps candidateId immutable and uses a partial unique index for valid IDs', () => {
  const source = readFileSync(new URL('../models/Candidate.js', import.meta.url), 'utf8')
  assert.match(source, /candidateId:\s*\{[\s\S]*?immutable:\s*true[\s\S]*?min:\s*\[1,/)
  assert.match(source, /name:\s*'candidateId_unique_valid'/)
  assert.match(source, /unique:\s*true/)
  assert.match(source, /partialFilterExpression:\s*\{\s*candidateId:\s*\{\s*\$type:\s*'number',\s*\$gte:\s*1/)
})
