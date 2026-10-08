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
  getActiveWp5Contract,
} from "../utils/wp5Contract.js"


dotenv.config()


const mongoEntry =
  Object
    .entries(
      process.env,
    )
    .find(
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


if (!mongoEntry) {
  throw new Error(
    "MongoDB URI environment variable not found",
  )
}


await mongoose.connect(
  mongoEntry[1],
)


try {
  const election =
    await getRuntimeElection({
      statuses: [
        "active",
      ],
    })


  if (!election) {
    throw new Error(
      "No active election found",
    )
  }


  const {
    contract,
  } =
    await getActiveWp5Contract()


  const [
    phase,
    configured,
    electionId,
    eligibleRoot,
    manifest,
    candidateCount,
    transcriptHash,
    acceptedBallotCount,
  ] =
    await Promise.all([
      contract.phase(),
      contract.configured(),
      contract.electionId(),
      contract.eligibleRoot(),
      contract.candidateManifestHash(),
      contract.candidateCount(),
      contract.trusteeTranscriptHash(),
      contract.acceptedBallotCount(),
    ])


  const checks = {
    phaseActive:
      Number(
        phase,
      ) === 1,

    configured:
      Boolean(
        configured,
      ),

    electionId:
      BigInt(
        electionId,
      ) ===
      BigInt(
        election.electionId,
      ),

    eligibleRoot:
      BigInt(
        eligibleRoot,
      ) ===
      BigInt(
        election.eligibleRoot,
      ),

    candidateManifest:
      BigInt(
        manifest,
      ) ===
      BigInt(
        election
          .candidateManifestHash,
      ),

    candidateCount:
      BigInt(
        candidateCount,
      ) ===
      BigInt(
        election
          .candidateCount,
      ),

    trusteeTranscript:
      String(
        transcriptHash,
      )
        .toLowerCase() ===
      String(
        election
          .trusteeTranscriptHash,
      )
        .toLowerCase(),
  }


  for (
    const [
      name,
      passed,
    ]
    of Object.entries(
      checks,
    )
  ) {
    console.log(
      `${name.toUpperCase()}=${passed ? "PASS" : "FAIL"}`,
    )
  }


  console.log(
    `DIRECT_CONTRACT=${election.directContractAddress}`,
  )

  console.log(
    `ACCEPTED_BALLOTS=${acceptedBallotCount.toString()}`,
  )


  if (
    Object
      .values(
        checks,
      )
      .some(
        passed =>
          !passed,
      )
  ) {
    process.exitCode =
      1
  } else {
    console.log(
      "ACTIVE_ELECTION_CHAIN_CHECK=PASS",
    )
  }
} finally {
  await mongoose.disconnect()
}
