import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPublicElectionData } from '../services/electionDataService.js'

test('public election data uses Mongo metadata and authoritative chain state', async () => {
  const candidateRecords = [
    { candidateId: 1, nationalId: '1234567890', name: 'Alice Example', party: 'Example Party', location: 'Dhaka', registrationStatus: 'pending' },
    { candidateId: 2, nationalId: '9876543210', name: 'Bob Example', party: 'Other Party', location: 'Chattogram', registrationStatus: 'registered' },
  ]
  const contract = {
    async getElectionState() { return 1n },
    async candidates(candidateId) {
      if (candidateId === 1) return { exists: true, voteCount: 7n }
      return { exists: false, voteCount: 99n }
    },
  }

  const data = await buildPublicElectionData({ candidateRecords, contract })
  assert.equal(data.electionState, 'Active')
  assert.equal(data.candidateCount, 1)
  assert.deepEqual(data.candidates, [{ candidateId: 1, name: 'Alice Example', party: 'Example Party', location: 'Dhaka', voteCount: 7 }])
  assert.equal('nationalId' in data.candidates[0], false)
  assert.equal('voterHash' in data.candidates[0], false)
  assert.equal('encryptedSalt' in data.candidates[0], false)
})
