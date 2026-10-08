import test from 'node:test'
import assert from 'node:assert/strict'
import { reconstructGroupFromRecords } from '../services/zk/groupCore.js'

class FakeGroup {
  constructor(members) {
    this.members = members.map(BigInt)
    this.size = this.members.length
    this.root = this.members.reduce((acc, member) => acc * 131n + member, 0n)
  }
}

const runtime = { Group: FakeGroup }
const records = [
  { zkGroupIndex: 1, zkIdentityCommitment: '22' },
  { zkGroupIndex: 0, zkIdentityCommitment: '11' },
]
const expectedRoot = new FakeGroup(['11', '22']).root

test('group reconstruction sorts by authoritative on-chain registration index and matches chain root/size', () => {
  const result = reconstructGroupFromRecords({ runtime, voterRecords: records, chainSize: 2n, chainRoot: expectedRoot })
  assert.deepEqual(result.commitments.map(String), ['11', '22'])
  assert.equal(result.group.root.toString(), expectedRoot.toString())
})

test('stale/incomplete group reconstruction is rejected', () => {
  assert.throws(
    () => reconstructGroupFromRecords({ runtime, voterRecords: records.filter((record) => record.zkGroupIndex === 0), chainSize: 2n, chainRoot: expectedRoot }),
    /group is stale/i,
  )
})

test('incorrect reconstructed Merkle root is rejected', () => {
  assert.throws(
    () => reconstructGroupFromRecords({ runtime, voterRecords: records, chainSize: 2n, chainRoot: expectedRoot + 1n }),
    /root mismatch/i,
  )
})

import { commitmentRecordsFromRegistrationEvents } from '../services/zk/groupEvents.js'

test('on-chain VoterCommitmentRegistered events deterministically define append-only group order', () => {
  const events = [
    { blockNumber: 12, index: 1, args: { identityCommitment: 33n } },
    { blockNumber: 10, index: 2, args: { identityCommitment: 22n } },
    { blockNumber: 10, index: 1, args: { identityCommitment: 11n } },
  ]

  assert.deepEqual(commitmentRecordsFromRegistrationEvents(events), [
    { zkGroupIndex: 0, zkIdentityCommitment: '11' },
    { zkGroupIndex: 1, zkIdentityCommitment: '22' },
    { zkGroupIndex: 2, zkIdentityCommitment: '33' },
  ])
})
