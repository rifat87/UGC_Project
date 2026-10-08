import Election from "../../models/Election.js"

import {
  getRuntimeElection,
} from "./electionRuntimeService.js"

export async function getActiveElectionCandidates() {
  const election =
    await getRuntimeElection({
      statuses: [
        "active",
      ],

      lean:
        true,
    })

  if (!election) {
    throw new Error(
      "No active election candidate snapshot is available",
    )
  }

  const snapshot =
    [...(election.candidateSnapshot || [])]
      .sort(
        (a, b) =>
          Number(a.slot) -
          Number(b.slot),
      )

  snapshot.forEach(
    (
      candidate,
      expectedSlot,
    ) => {
      if (
        Number(candidate.slot) !==
        expectedSlot
      ) {
        throw new Error(
          `Election candidate slots are invalid; expected ${expectedSlot}, got ${candidate.slot}`,
        )
      }
    },
  )

  if (
    snapshot.length !==
    Number(
      election.candidateCount,
    )
  ) {
    throw new Error(
      "Election candidate snapshot count does not match the frozen election record",
    )
  }

  return {
    election,

    candidates:
      snapshot.map(
        candidate => ({
          candidateId:
            Number(
              candidate.candidateId,
            ),

          name:
            candidate.name,

          party:
            candidate.party,

          location:
            candidate.location,

          slot:
            Number(
              candidate.slot,
            ),
        }),
      ),
  }
}
