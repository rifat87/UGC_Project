import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const activeBackendFiles = [
  '../controllers/voteController.js',
  '../controllers/fingerprintController.js',
  '../controllers/voterController.js',
  '../services/zk/proofCore.js',
  '../services/zk/proofService.js',
]

const activeFrontendFiles = [
  '../../votechain-frontend-ts/src/hooks/useContract.ts',
  '../../votechain-frontend-ts/src/components/Biometric/VerificationModal.tsx',
  '../../votechain-frontend-ts/src/components/Voter/VoteCasting.tsx',
  '../../votechain-frontend-ts/src/components/Admin/RegisterVoter.tsx',
  '../../votechain-frontend-ts/src/services/api.ts',
]

test('active biometric and blockchain ZK path does not use voterHash or encryptedSalt', () => {
  for (const relative of [...activeBackendFiles, ...activeFrontendFiles]) {
    const source = readFileSync(new URL(relative, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /voterHash|encryptedSalt/, `legacy identity primitive remains active in ${relative}`)
  }
})

test(
  'active voter flow keeps candidate plaintext local and submits only encrypted WP5 ballot material',
  async () => {
    const {
      readFileSync,
    } =
      await import(
        'node:fs'
      )

    const useContractSource =
      readFileSync(
        new URL(
          '../../votechain-frontend-ts/src/hooks/useContract.ts',
          import.meta.url,
        ),
        'utf8',
      )

    const voteCastingSource =
      readFileSync(
        new URL(
          '../../votechain-frontend-ts/src/components/Voter/VoteCasting.tsx',
          import.meta.url,
        ),
        'utf8',
      )

    /*
     * Candidate plaintext is consumed only by the isolated local
     * privacy preparation step.
     */
    assert.match(
      voteCastingSource,
      /prepareWp5EncryptedBallot\([\s\S]*candidateId[\s\S]*authorization[\s\S]*data/,
    )

    /*
     * The wallet-facing path receives the already prepared encrypted
     * ballot object, not candidateId.
     */
    assert.match(
      voteCastingSource,
      /castEncryptedVote\(\s*ballot,\s*\)/,
    )

    /*
     * Final WP5 must never reintroduce the legacy plaintext
     * candidate + Semaphore proof transaction shape.
     */
    assert.doesNotMatch(
      useContractSource,
      /castVote\(\s*candidateId\s*,\s*proof/,
    )

    /*
     * VoteChainDirect receives proof/nullifier/ciphertext coordinates.
     */
    assert.match(
      useContractSource,
      /instance\.castVote\([\s\S]*ballot\.a[\s\S]*ballot\.b[\s\S]*ballot\.c[\s\S]*nullifier[\s\S]*ballot\.rx[\s\S]*ballot\.ry[\s\S]*ballot\.sx[\s\S]*ballot\.sy/,
    )

    assert.match(
      useContractSource,
      /getCurrentWp5DirectContract/,
    )
  },
)

test(
  'backend gates enrollment to Registration and active privacy inputs to frozen election membership and candidate snapshots',
  async () => {
    const {
      readFileSync,
    } =
      await import(
        'node:fs'
      )

    const voterRoutesSource =
      readFileSync(
        new URL(
          '../routes/voterRoutes.js',
          import.meta.url,
        ),
        'utf8',
      )

    const membershipSource =
      readFileSync(
        new URL(
          '../services/elections/electionMembershipService.js',
          import.meta.url,
        ),
        'utf8',
      )

    const candidateSource =
      readFileSync(
        new URL(
          '../services/elections/electionCandidateService.js',
          import.meta.url,
        ),
        'utf8',
      )

    /*
     * Enrollment is controlled by the Mongo/current-election
     * Registration lifecycle gate, not by the legacy voting contract.
     */
    assert.match(
      voterRoutesSource,
      /requireElectionRegistrationOpen/,
    )

    assert.match(
      voterRoutesSource,
      /router\.post\([\s\S]*requireElectionRegistrationOpen[\s\S]*voterController\.createVoter/,
    )

    /*
     * Active eligibility comes from the frozen election-local
     * membership snapshot.
     */
    assert.match(
      membershipSource,
      /(?:status:\s*"active"|statuses:\s*\[\s*"active",?\s*\])/,
    )

    assert.match(
      membershipSource,
      /ElectionMembership/,
    )

    /*
     * Valid candidates for voting come from the frozen Active
     * candidate snapshot, not the mutable global candidate list.
     */
    assert.match(
      candidateSource,
      /(?:status:\s*"active"|statuses:\s*\[\s*"active",?\s*\])/,
    )

    assert.match(
      candidateSource,
      /candidateSnapshot/,
    )
  },
)

