import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const abi = JSON.parse(readFileSync(new URL('../abi/ZKLocalVoting.json', import.meta.url), 'utf8'))
const functions = abi.filter((entry) => entry.type === 'function')
const byName = new Map(functions.map((entry) => [entry.name, entry]))

function signature(name) {
  const entry = byName.get(name)
  return entry ? `${name}(${entry.inputs.map((input) => input.type).join(',')})` : null
}

test('ZK ABI exposes candidateId/commitment/proof lifecycle', () => {
  assert.equal(signature('registerCandidate'), 'registerCandidate(uint256)')
  assert.equal(signature('registerVoterCommitment'), 'registerVoterCommitment(uint256)')
  assert.equal(signature('castVote'), 'castVote(uint256,tuple)')
  assert.equal(signature('startElection'), 'startElection()')
  assert.equal(signature('endElection'), 'endElection()')
  assert.equal(signature('getVoteCount'), 'getVoteCount(uint256)')
  assert.equal(signature('getElectionState'), 'getElectionState()')
  assert.equal(signature('getGroupRoot'), 'getGroupRoot()')
  assert.equal(signature('getGroupSize'), 'getGroupSize()')
})

test('ZK ABI has no active voterHash or civil identity transaction input', () => {
  assert.equal(byName.has('registerVoter'), false)
  const serialized = JSON.stringify(abi)
  for (const forbidden of ['voterHash', 'nationalId', 'dateOfBirth', 'birthDate', 'encryptedSalt', 'biometric']) {
    assert.equal(serialized.includes(forbidden), false, `forbidden ABI term: ${forbidden}`)
  }

  const castVote = byName.get('castVote')
  assert.equal(castVote.inputs[0].name, 'candidateId')
  assert.equal(castVote.inputs[1].type, 'tuple')
  assert.equal(castVote.inputs[1].components.length, 6)
  assert.deepEqual(castVote.inputs[1].components.map((component) => component.name), [
    'merkleTreeDepth', 'merkleTreeRoot', 'nullifier', 'message', 'scope', 'points',
  ])
})
