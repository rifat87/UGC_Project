import Election from "../../models/Election.js"

import {
  getRuntimeElection,
} from "./electionRuntimeService.js"
import ElectionMembership from "../../models/ElectionMembership.js"

export async function getActiveElectionMembership(
  voter,
) {
  const election =
    await getRuntimeElection({
      statuses: [
        "active",
      ],
    })

  if (!election) {
    throw new Error(
      "No active election membership snapshot is available",
    )
  }

  const membership =
    await ElectionMembership.findOne({
      election: election._id,
      voter: voter._id,
    })
      .select({
        identityCommitment: 1,
        merkleIndex: 1,
      })
      .lean()

  if (!membership) {
    throw new Error(
      "This voter is not eligible for the active election",
    )
  }

  if (
    String(
      membership.identityCommitment,
    ) !==
    String(
      voter.wp5IdentityCommitment,
    )
  ) {
    throw new Error(
      "Election membership commitment does not match voter credential",
    )
  }

  const memberships =
    await ElectionMembership
      .find({
        election: election._id,
      })
      .sort({
        merkleIndex: 1,
      })
      .select({
        identityCommitment: 1,
        merkleIndex: 1,
      })
      .lean()

  if (
    election.eligibleVoterCount !==
      undefined &&
    election.eligibleVoterCount !==
      null &&
    memberships.length !==
      Number(
        election.eligibleVoterCount,
      )
  ) {
    throw new Error(
      "Election membership snapshot count does not match the frozen election record",
    )
  }

  memberships.forEach(
    (
      record,
      expectedIndex,
    ) => {
      if (
        Number(
          record.merkleIndex,
        ) !==
        expectedIndex
      ) {
        throw new Error(
          `Election Merkle indices are invalid; expected ${expectedIndex}, got ${record.merkleIndex}`,
        )
      }
    },
  )

  return {
    election,
    index:
      Number(
        membership.merkleIndex,
      ),

    records:
      memberships.map(
        record => ({
          wp5GroupIndex:
            Number(
              record.merkleIndex,
            ),

          wp5IdentityCommitment:
            String(
              record.identityCommitment,
            ),
        }),
      ),
  }
}
