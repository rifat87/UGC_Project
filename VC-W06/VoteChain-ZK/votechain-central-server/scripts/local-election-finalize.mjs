import dotenv
  from "dotenv"

import mongoose
  from "mongoose"

import Election
  from "../models/Election.js"

import {
  getRuntimeElection,
} from "../services/elections/electionRuntimeService.js"

import {
  endElectionLifecycle,
  finalizeElectionLifecycle,
  getFinalElectionResults,
  loadLocalFinalizationTranscript,
} from "../services/elections/electionFinalizationService.js"


dotenv.config()


function mongoUri() {
  const explicitKey =
    process.env
      .VOTECHAIN_MONGO_ENV_KEY
      ?.trim()

  if (explicitKey) {
    const value =
      process.env[
        explicitKey
      ]

    if (
      !value ||
      !/^mongodb(?:\+srv)?:\/\//i
        .test(
          value,
        )
    ) {
      throw new Error(
        "Configured MongoDB URI environment variable is invalid",
      )
    }

    return {
      key:
        explicitKey,

      value,
    }
  }

  const candidates =
    Object
      .entries(
        process.env,
      )
      .filter(
        (
          [
            _key,
            value,
          ],
        ) =>
          /^mongodb(?:\+srv)?:\/\//i
            .test(
              String(
                value ||
                "",
              ),
            ),
      )

  if (
    candidates.length !==
      1
  ) {
    throw new Error(
      "Unable to resolve exactly one MongoDB URI environment variable",
    )
  }

  return {
    key:
      candidates[0][0],

    value:
      candidates[0][1],
  }
}


async function connectDatabase() {
  const selected =
    mongoUri()

  await mongoose.connect(
    selected.value,
  )

  console.log(
    "MONGODB_CONNECTED=YES",
  )

  console.log(
    `MONGODB_ENV_KEY=${selected.key}`,
  )
}


async function current() {
  return getRuntimeElection()
}


async function commandStatus() {
  const election =
    await current()

  if (!election) {
    console.log(
      "CURRENT_ELECTION=NONE",
    )

    return
  }

  console.log(
    `ELECTION_ID=${election.electionId}`,
  )

  console.log(
    `ELECTION_STATUS=${election.status}`,
  )

  console.log(
    `ACCEPTED_BALLOTS=${election.acceptedBallotCount || "0"}`,
  )

  console.log(
    `DIRECT_CONTRACT=${election.directContractAddress || "NONE"}`,
  )

  console.log(
    `FINALIZATION_TRANSCRIPT_HASH=${election.finalizationTranscriptHash || "NONE"}`,
  )
}


async function commandEnd() {
  const election =
    await current()

  if (!election) {
    throw new Error(
      "No current election exists",
    )
  }

  const result =
    await endElectionLifecycle({
      electionId:
        election.electionId,
    })

  console.log(
    "ELECTION_END=PASS",
  )

  console.log(
    `ELECTION_ID=${result.electionId}`,
  )

  console.log(
    `ELECTION_STATUS=${result.status}`,
  )

  console.log(
    `ACCEPTED_BALLOTS=${result.acceptedBallotCount}`,
  )

  console.log(
    `ALREADY_ENDED=${result.alreadyEnded}`,
  )

  console.log(
    `AGGREGATE_FILE=${result.aggregateFile}`,
  )
}


async function commandFinalize() {
  const election =
    await current()

  if (!election) {
    throw new Error(
      "No current election exists",
    )
  }

  const transcript =
    await loadLocalFinalizationTranscript(
      election.electionId,
    )

  const result =
    await finalizeElectionLifecycle({
      electionId:
        election.electionId,

      transcript,
    })

  console.log(
    "ELECTION_FINALIZE=PASS",
  )

  console.log(
    `ELECTION_ID=${result.electionId}`,
  )

  console.log(
    `ELECTION_STATUS=${result.status}`,
  )

  console.log(
    `ACCEPTED_BALLOTS=${result.acceptedBallotCount}`,
  )

  console.log(
    `FINALIZATION_TRANSCRIPT_HASH=${result.finalizationTranscriptHash}`,
  )

  console.log(
    `ALREADY_FINALIZED=${result.alreadyFinalized}`,
  )

  for (
    const item
    of result.results
  ) {
    console.log(
      `RESULT_SLOT_${item.slot}=candidateId:${item.candidateId},votes:${item.votes}`,
    )
  }
}


async function commandResults() {
  const election =
    await current()

  if (!election) {
    throw new Error(
      "No current election exists",
    )
  }

  const result =
    await getFinalElectionResults(
      election.electionId,
    )

  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  )
}


const command =
  process.argv[2]


try {
  await connectDatabase()

  switch (
    command
  ) {
    case "status":
      await commandStatus()
      break

    case "end":
      await commandEnd()
      break

    case "finalize":
      await commandFinalize()
      break

    case "results":
      await commandResults()
      break

    default:
      throw new Error(
        "Usage: node scripts/local-election-finalize.mjs status|end|finalize|results",
      )
  }
} catch (error) {
  console.error(
    "LOCAL_ELECTION_FINALIZATION_ERROR=" +
    (
      error?.message ||
      String(
        error,
      )
    ),
  )

  process.exitCode =
    1
} finally {
  await mongoose
    .disconnect()
    .catch(
      () => {},
    )
}
