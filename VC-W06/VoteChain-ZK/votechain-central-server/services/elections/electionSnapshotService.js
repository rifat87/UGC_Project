import Election from "../../models/Election.js"

import {
  getRuntimeElection,
} from "./electionRuntimeService.js"
import ElectionMembership from "../../models/ElectionMembership.js"
import Voter from "../../models/Voter.js"
import Candidate from "../../models/Candidate.js"

import {
  buildWp5MerkleSnapshot,
  hashCandidateManifest,
} from "../zk/wp5PrivacyService.js"

function lifecycleError(
  code,
  message,
) {
  const error =
    new Error(message)

  error.code =
    code

  return error
}

async function acquireSnapshotElection() {
  const now =
    new Date()


  let selected =
    await getRuntimeElection({
      statuses: [
        "registration",
        "starting",
      ],
    })


  if (!selected) {
    throw lifecycleError(
      "NO_REGISTRATION_ELECTION",
      "No election is available to start",
    )
  }


  let election =
    null


  if (
    selected.status ===
      "registration"
  ) {
    election =
      await Election.findOneAndUpdate(
        {
          _id:
            selected._id,

          status:
            "registration",
        },
        {
          $set: {
            status:
              "starting",

            startStage:
              "snapshotting",

            snapshotLockedAt:
              now,
          },

          $unset: {
            failureReason:
              1,
          },
        },
        {
          new:
            true,
        },
      )


    if (election) {
      return {
        election,
        resumed:
          false,
      }
    }
  }


  election =
    await getRuntimeElection({
      statuses: [
        "starting",
      ],
    })


  if (!election) {
    throw lifecycleError(
      "NO_REGISTRATION_ELECTION",
      "No election is available to start",
    )
  }


  if (
    [
      "snapshot_ready",
      "deployed",
      "configured",
      "trustees_pinned",
      "active",
    ].includes(
      election.startStage,
    )
  ) {
    return {
      election,
      resumed:
        true,

      alreadyReady:
        true,
    }
  }


  if (
    election.startStage !==
      "snapshotting"
  ) {
    throw lifecycleError(
      "START_IN_PROGRESS",
      `Election start is already at stage ${election.startStage || "unknown"}`,
    )
  }


  return {
    election,
    resumed:
      true,
  }
}

export async function prepareElectionSnapshot() {
  const acquired =
    await acquireSnapshotElection()

  const election =
    acquired.election

  if (acquired.alreadyReady) {
    return {
      election,
      resumed: true,
      alreadyReady: true,
    }
  }

  try {
    const [
      voters,
      candidates,
    ] =
      await Promise.all([
        Voter
          .find({
            wp5RegistrationStatus:
              "registered",
            wp5IdentityCommitment: {
              $type: "string",
            },
          })
          .sort({
            _id: 1,
          })
          .select({
            _id: 1,
            wp5IdentityCommitment: 1,
          })
          .lean(),

        Candidate
          .find({
            electionId:
              String(
                election.electionId,
              ),

            registrationStatus:
              "registered",
            candidateId: {
              $exists: true,
            },
          })
          .sort({
            candidateId: 1,
          })
          .select({
            _id: 1,
            candidateId: 1,
            name: 1,
            party: 1,
            location: 1,
          })
          .lean(),
      ])

    if (voters.length < 1) {
      throw lifecycleError(
        "NO_ELIGIBLE_VOTERS",
        "Cannot start an election without eligible voters",
      )
    }

    if (candidates.length < 1) {
      throw lifecycleError(
        "NO_REGISTERED_CANDIDATES",
        "Cannot start an election without registered candidates",
      )
    }

    const memberships =
      voters.map(
        (
          voter,
          merkleIndex,
        ) => ({
          election:
            election._id,

          voter:
            voter._id,

          identityCommitment:
            String(
              voter.wp5IdentityCommitment,
            ),

          merkleIndex,
        }),
      )

    await ElectionMembership
      .deleteMany({
        election:
          election._id,
      })

    await ElectionMembership
      .insertMany(
        memberships,
        {
          ordered: true,
        },
      )

    const merkleRecords =
      memberships.map(
        membership => ({
          wp5GroupIndex:
            membership.merkleIndex,

          wp5IdentityCommitment:
            membership.identityCommitment,
        }),
      )

    const merkleSnapshot =
      await buildWp5MerkleSnapshot(
        merkleRecords,
      )

    const candidateIds =
      candidates.map(
        candidate =>
          Number(
            candidate.candidateId,
          ),
      )

    const candidateManifest =
      await hashCandidateManifest(
        candidateIds,
      )

    election.eligibleRoot =
      merkleSnapshot.root

    election.eligibleVoterCount =
      memberships.length

    election.candidateManifestHash =
      candidateManifest.toString()

    election.candidateCount =
      candidates.length

    election.candidateSnapshot =
      candidates.map(
        (
          candidate,
          slot,
        ) => ({
          candidateRef:
            candidate._id,

          candidateId:
            Number(
              candidate.candidateId,
            ),

          slot,

          name:
            candidate.name,

          party:
            candidate.party,

          location:
            candidate.location,
        }),
      )

    election.startStage =
      "snapshot_ready"

    election.failureReason =
      undefined

    await election.save()

    return {
      election,
      resumed:
        acquired.resumed,
      alreadyReady: false,
    }
  } catch (error) {
    election.failureReason =
      error.message

    await election.save()

    throw error
  }
}
