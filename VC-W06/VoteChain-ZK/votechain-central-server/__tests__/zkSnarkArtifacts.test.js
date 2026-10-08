import test from 'node:test'
import assert from 'node:assert/strict'
import { getConfiguredSnarkArtifacts } from '../services/zk/snarkArtifacts.js'

test('SNARK artifact config is optional but must be paired', () => {
  assert.equal(getConfiguredSnarkArtifacts({}), undefined)
  assert.deepEqual(getConfiguredSnarkArtifacts({ ZK_SNARK_WASM: '/tmp/a.wasm', ZK_SNARK_ZKEY: '/tmp/a.zkey' }), {
    wasm: '/tmp/a.wasm', zkey: '/tmp/a.zkey',
  })
  assert.throws(() => getConfiguredSnarkArtifacts({ ZK_SNARK_WASM: '/tmp/a.wasm' }), /configured together/)
})
