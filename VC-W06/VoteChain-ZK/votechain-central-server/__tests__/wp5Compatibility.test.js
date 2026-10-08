import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  hashCandidateManifest,
} from '../services/zk/wp5PrivacyService.js'

const appProfile = JSON.parse(
  fs.readFileSync(
    new URL(
      '../../crypto/config/wp5-application-profile.json',
      import.meta.url,
    ),
    'utf8',
  ),
)

test(
  'WP5 K16 manifest matches frozen compatibility profile',
  async () => {
    assert.equal(
      appProfile.candidateManifest.algorithm,
      'POSEIDON_INDEXED_CHAIN_V1',
    )

    const candidateIds =
      Array.from(
        { length: 16 },
        (_value, index) =>
          101 + index,
      )

    const actual =
      await hashCandidateManifest(
        candidateIds,
      )

    assert.equal(
      actual.toString(),
      String(
        appProfile
          .candidateManifest
          .manifest16,
      ),
    )
  },
)

test(
  'WP5 indexed manifest is order-sensitive',
  async () => {
    const a =
      await hashCandidateManifest(
        [101, 102, 103, 104],
      )

    const b =
      await hashCandidateManifest(
        [101, 103, 102, 104],
      )

    assert.notEqual(
      a.toString(),
      b.toString(),
    )
  },
)
