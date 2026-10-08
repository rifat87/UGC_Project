import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildWp5MerkleSnapshot,
  commitmentFromWp5Secret,
  hashCandidateManifest,
} from '../services/zk/wp5PrivacyService.js'

test('WP5 custom commitment is deterministic and secret-sensitive', async () => {
  const a = await commitmentFromWp5Secret(123456789n)
  const b = await commitmentFromWp5Secret(123456789n)
  const c = await commitmentFromWp5Secret(123456790n)

  assert.equal(a, b)
  assert.notEqual(a, c)
})

test('WP5 fixed-depth Merkle witness reconstructs the root', async () => {
  const commitments = []

  for (const secret of [11n, 22n, 33n]) {
    commitments.push(
      await commitmentFromWp5Secret(secret),
    )
  }

  const records = commitments.map((commitment, index) => ({
    wp5GroupIndex: index,
    wp5IdentityCommitment: commitment.toString(),
  }))

  const snapshot =
    await buildWp5MerkleSnapshot(records, 1)

  let current = commitments[1]

  for (let level = 0; level < snapshot.depth; level += 1) {
    const sibling =
      BigInt(snapshot.siblings[level])

    const bit =
      Number(snapshot.pathBits[level])

    const { wp5Hash } =
      await import('../services/zk/wp5PrivacyService.js')

    current = bit === 0
      ? await wp5Hash([current, sibling])
      : await wp5Hash([sibling, current])
  }

  assert.equal(
    current.toString(),
    snapshot.root,
  )
})

test('WP5 candidate manifest depends on ordered public candidate list', async () => {
  const a = await hashCandidateManifest([101, 102, 103])
  const b = await hashCandidateManifest([101, 102, 103])
  const c = await hashCandidateManifest([101, 103, 102])

  assert.equal(a, b)
  assert.notEqual(a, c)
})
