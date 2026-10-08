import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const abi = JSON.parse(readFileSync(new URL('../abi/LocalVoting.json', import.meta.url), 'utf8'))
const functions = abi.filter((entry) => entry.type === 'function')
const byName = new Map(functions.map((entry) => [entry.name, entry]))

function signature(name) {
  const entry = byName.get(name)
  return entry ? `${name}(${entry.inputs.map((input) => input.type).join(',')})` : null
}

test('ABI contains the accepted VC-W01 interface', () => {
  assert.equal(signature('registerCandidate'), 'registerCandidate(uint256)')
  assert.equal(signature('registerVoter'), 'registerVoter(bytes32)')
  assert.equal(signature('castVote'), 'castVote(uint256,bytes32)')
  assert.equal(signature('startElection'), 'startElection()')
  assert.equal(signature('endElection'), 'endElection()')
  assert.equal(signature('getVoteCount'), 'getVoteCount(uint256)')
  assert.equal(signature('getElectionState'), 'getElectionState()')
})

test('ABI omits removed legacy application APIs', () => {
  for (const removed of ['getCandidates', 'getCandidate', 'getVoter', 'electionEnded']) {
    assert.equal(byName.has(removed), false)
  }
  assert.equal(functions.some((entry) => entry.name === 'castVote' && entry.inputs[0]?.type === 'string'), false)
})
