import dotenv
  from "dotenv"

import mongoose
  from "mongoose"

import {
  getAddress,
} from "ethers"

import Candidate
  from "../models/Candidate.js"

import Election
  from "../models/Election.js"

import {
  getRuntimeElection,
} from "../services/elections/electionRuntimeService.js"

import Voter
  from "../models/Voter.js"

import {
  getContract,
  getProvider,
} from "../utils/contract.js"

dotenv.config()

function findMongoUri() {
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
    candidates.length !== 1
  ) {
    throw new Error(
      "Expected exactly one MongoDB URI environment variable",
    )
  }

  return candidates[0][1]
}

await mongoose.connect(
  findMongoUri(),
)

try {
  const election =
    await getRuntimeElection({
      statuses: [
        "registration",
      ],
    })

  if (!election) {
    throw new Error(
      "No current Registration election exists",
    )
  }

  const provider =
    getProvider()

  const signer =
    await provider
      .getSigner(0)

  const signerAddress =
    getAddress(
      await signer
        .getAddress(),
    )

  const contract =
    getContract()
      .connect(
        signer,
      )

  const [
    commission,
    chainElectionId,
    state,
  ] =
    await Promise.all([
      contract
        .electionCommission(),

      contract
        .electionId(),

      contract
        .state(),
    ])

  if (
    signerAddress !==
    getAddress(
      commission,
    )
  ) {
    throw new Error(
      "Local signer 0 is not the ZKLocalVoting Election Commission",
    )
  }

  if (
    BigInt(
      chainElectionId,
    ) !==
    BigInt(
      election
        .electionId,
    )
  ) {
    throw new Error(
      "ZKLocalVoting electionId does not match the current Mongo election",
    )
  }

  if (
    Number(state) !== 0
  ) {
    throw new Error(
      "ZKLocalVoting is not in Registration state",
    )
  }

  const candidates =
    await Candidate
      .find({
        electionId:
          String(
            election.electionId,
          ),

        registrationStatus:
          "registered",

        candidateId: {
          $exists:
            true,
        },
      })
      .sort({
        candidateId:
          1,
      })
      .select({
        candidateId:
          1,
      })
      .lean()

  const voters =
    await Voter
      .find({
        zkRegistrationStatus:
          "registered",

        zkIdentityCommitment: {
          $type:
            "string",
        },
      })
      .sort({
        _id:
          1,
      })
      .select({
        zkIdentityCommitment:
          1,
      })
      .lean()

  let candidateTxs =
    0

  let voterTxs =
    0

  for (
    const candidate
    of candidates
  ) {
    const candidateId =
      BigInt(
        candidate
          .candidateId,
      )

    const chainCandidate =
      await contract
        .candidates(
          candidateId,
        )

    const exists =
      Boolean(
        chainCandidate
          .exists ??
        chainCandidate[0],
      )

    if (exists) {
      continue
    }

    const tx =
      await contract
        .registerCandidate(
          candidateId,
        )

    await tx.wait()

    candidateTxs +=
      1
  }

  for (
    const voter
    of voters
  ) {
    const commitment =
      BigInt(
        voter
          .zkIdentityCommitment,
      )

    const exists =
      await contract
        .registeredCommitments(
          commitment,
        )

    if (exists) {
      continue
    }

    const tx =
      await contract
        .registerVoterCommitment(
          commitment,
        )

    await tx.wait()

    voterTxs +=
      1
  }

  const pendingVoters =
    await Voter.countDocuments({
      zkRegistrationStatus:
        "pending",
    })

  console.log(
    `CURRENT_ELECTION=${election.electionId}`,
  )

  console.log(
    `CONFIRMED_CANDIDATES=${candidates.length}`,
  )

  console.log(
    `CONFIRMED_ZK_VOTERS=${voters.length}`,
  )

  console.log(
    `CANDIDATE_REANCHOR_TXS=${candidateTxs}`,
  )

  console.log(
    `VOTER_REANCHOR_TXS=${voterTxs}`,
  )

  console.log(
    `PENDING_ZK_VOTERS=${pendingVoters}`,
  )

  console.log(
    "LOCAL_REGISTRATION_REANCHOR=PASS",
  )
} finally {
  await mongoose
    .disconnect()
}
