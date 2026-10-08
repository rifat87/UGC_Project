import {
  readFile,
} from "node:fs/promises"

import {
  resolve,
} from "node:path"

import dotenv
  from "dotenv"

import mongoose
  from "mongoose"

import {
  getAddress,
} from "ethers"

import Election
  from "../models/Election.js"

import Voter
  from "../models/Voter.js"

import Candidate
  from "../models/Candidate.js"

import {
  createElectionRecord,
  getCurrentElection,
} from "../services/elections/electionLifecycleService.js"

import {
  storeElectionTrusteeTranscript,
} from "../services/elections/electionTrusteeService.js"

import {
  startElectionLifecycle,
} from "../services/elections/electionStartService.js"

import {
  getProvider,
} from "../utils/contract.js"

import {
  resolveAdminAuthority,
} from "../services/admin/adminAuthorityService.js"


dotenv.config()


function mongoUri() {
  const explicitKey =
    process.env
      .VOTECHAIN_MONGO_ENV_KEY
      ?.trim()

  if (explicitKey) {
    const explicitValue =
      process.env[
        explicitKey
      ]

    if (
      !explicitValue ||
      !/^mongodb(?:\+srv)?:\/\//i
        .test(
          explicitValue,
        )
    ) {
      throw new Error(
        `VOTECHAIN_MONGO_ENV_KEY points to an invalid MongoDB URI variable: ${explicitKey}`,
      )
    }

    return {
      key:
        explicitKey,

      value:
        explicitValue,
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
    candidates.length ===
      0
  ) {
    throw new Error(
      "No MongoDB URI-valued environment variable was found",
    )
  }


  if (
    candidates.length >
      1
  ) {
    throw new Error(
      "Multiple MongoDB URI environment variables were found. Set VOTECHAIN_MONGO_ENV_KEY to one of: " +
      candidates
        .map(
          ([key]) =>
            key,
        )
        .join(", "),
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


async function localAdmin() {
  const provider =
    getProvider()

  const authority =
    await resolveAdminAuthority()

  const signer =
    await provider.getSigner(0)

  const signerAddress =
    getAddress(
      await signer.getAddress(),
    )

  const admin =
    getAddress(
      authority.admin,
    )

  console.log(
    `LOCAL_ADMIN=${admin}`,
  )

  console.log(
    `LOCAL_DEPLOYER=${signerAddress}`,
  )

  console.log(
    `LOCAL_DEPLOYER_IS_ADMIN=${signerAddress === admin}`,
  )

  if (
    signerAddress !== admin
  ) {
    throw new Error(
      "Anvil signer 0 is not the current Election Commission administrator",
    )
  }

  return admin
}


async function current() {
  return getCurrentElection()
}


async function counts(
  election,
) {
  const eligibleVoters =
    await Voter.countDocuments({
      wp5RegistrationStatus:
        "registered",

      wp5IdentityCommitment: {
        $type:
          "string",
      },
    })

  let registeredCandidates =
    0

  if (
    election?.status ===
      "registration"
  ) {
    registeredCandidates =
      await Candidate.countDocuments({
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
  } else if (
    election &&
    Array.isArray(
      election.candidateSnapshot,
    )
  ) {
    registeredCandidates =
      election.candidateSnapshot.length
  }

  return {
    eligibleVoters,
    registeredCandidates,
  }
}

async function printElection(
  election,
) {
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
    `START_STAGE=${election.startStage || "NONE"}`,
  )

  console.log(
    `CHAIN_ID=${election.chainId || "NONE"}`,
  )

  console.log(
    `TRUSTEE_TRANSCRIPT=${election.trusteeTranscriptHash ? "READY" : "NOT_READY"}`,
  )

  console.log(
    `DIRECT_CONTRACT=${election.directContractAddress || "NOT_DEPLOYED"}`,
  )

  console.log(
    `VERIFIER_CONTRACT=${election.verifierAddress || "NOT_DEPLOYED"}`,
  )
}


async function commandCreate() {
  const admin =
    await localAdmin()

  let election =
    await current()


  if (election) {
    console.log(
      "ELECTION_CREATE=SKIPPED_CURRENT_EXISTS",
    )

    await printElection(
      election,
    )

    return
  }



  election =
    await createElectionRecord({
      adminAddress:
        admin,
    })


  console.log(
    "ELECTION_CREATE=PASS",
  )

  await printElection(
    election,
  )
}


async function commandStatus() {
  const election =
    await current()

  await printElection(
    election,
  )

  const result =
    await counts(election)

  console.log(
    `ELIGIBLE_VOTERS=${result.eligibleVoters}`,
  )

  console.log(
    `REGISTERED_CANDIDATES=${result.registeredCandidates}`,
  )
}


async function commandStoreTranscript() {
  const admin =
    await localAdmin()

  const election =
    await current()


  if (!election) {
    throw new Error(
      "No current election exists",
    )
  }


  if (
    election.status !==
      "registration"
  ) {
    throw new Error(
      `Cannot store DKG transcript while election status is ${election.status}`,
    )
  }


  const file =
    resolve(
      process.cwd(),
      "..",
      "crypto",
      ".local",
      "wp6-elections",
      String(
        election.electionId,
      ),
      "public",
      "dkg-public-transcript.json",
    )


  const transcript =
    JSON.parse(
      await readFile(
        file,
        "utf8",
      ),
    )


  const result =
    await storeElectionTrusteeTranscript({
      electionId:
        election.electionId,

      transcript,

      adminAddress:
        admin,
    })


  console.log(
    "TRUSTEE_TRANSCRIPT_STORE=PASS",
  )

  console.log(
    `ELECTION_ID=${result.election.electionId}`,
  )

  console.log(
    `TRANSCRIPT_HASH=${result.transcriptHash}`,
  )

  console.log(
    `PUBLIC_KEY_X=${result.Yx}`,
  )

  console.log(
    `PUBLIC_KEY_Y=${result.Yy}`,
  )
}


async function commandPreflight() {
  const admin =
    await localAdmin()

  const election =
    await current()


  if (!election) {
    throw new Error(
      "No current election exists",
    )
  }


  const result =
    await counts(election)


  console.log(
    `ELECTION_ID=${election.electionId}`,
  )

  console.log(
    `ELECTION_STATUS=${election.status}`,
  )

  console.log(
    `ELIGIBLE_VOTERS=${result.eligibleVoters}`,
  )

  console.log(
    `REGISTERED_CANDIDATES=${result.registeredCandidates}`,
  )

  console.log(
    `TRUSTEE_TRANSCRIPT=${election.trusteeTranscriptHash ? "READY" : "NOT_READY"}`,
  )

  console.log(
    `ADMIN=${admin}`,
  )


  const ready =
    election.status ===
      "registration" &&
    result.eligibleVoters >
      0 &&
    result.registeredCandidates >
      0 &&
    Boolean(
      election
        .trusteeTranscriptHash,
    ) &&
    Boolean(
      election
        .trusteeTranscript,
    )


  console.log(
    `START_PREFLIGHT=${ready ? "PASS" : "BLOCKED"}`,
  )


  if (!ready) {
    if (
      result.eligibleVoters <
        1
    ) {
      console.log(
        "BLOCK_REASON=NO_ELIGIBLE_VOTERS",
      )
    }

    if (
      result.registeredCandidates <
        1
    ) {
      console.log(
        "BLOCK_REASON=NO_REGISTERED_CANDIDATES",
      )
    }

    if (
      !election
        .trusteeTranscriptHash
    ) {
      console.log(
        "BLOCK_REASON=NO_DKG_TRANSCRIPT",
      )
    }

    process.exitCode =
      20
  }
}


async function commandStart() {
  await localAdmin()

  const election =
    await current()


  if (!election) {
    throw new Error(
      "No current election exists",
    )
  }


  const result =
    await counts(election)


  if (
    result.eligibleVoters <
      1
  ) {
    throw new Error(
      "Refusing to start: no eligible WP5 voters exist",
    )
  }


  if (
    result.registeredCandidates <
      1
  ) {
    throw new Error(
      "Refusing to start: no registered candidates exist",
    )
  }


  if (
    !election
      .trusteeTranscriptHash ||
    !election
      .trusteeTranscript
  ) {
    throw new Error(
      "Refusing to start: verified DKG transcript is missing",
    )
  }


  const started =
    await startElectionLifecycle({
      electionId:
        election.electionId,
    })


  console.log(
    "ELECTION_START=PASS",
  )

  console.log(
    JSON.stringify(
      started,
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
    case "create":
      await commandCreate()
      break

    case "status":
      await commandStatus()
      break

    case "store-transcript":
      await commandStoreTranscript()
      break

    case "preflight":
      await commandPreflight()
      break

    case "start":
      await commandStart()
      break

    default:
      throw new Error(
        "Usage: node scripts/local-election-admin.mjs create|status|store-transcript|preflight|start",
      )
  }
} catch (error) {
  console.error(
    "LOCAL_ELECTION_ADMIN_ERROR=" +
    (
      error?.message ||
      String(error)
    ),
  )

  process.exitCode =
    process.exitCode ||
    1
} finally {
  await mongoose
    .disconnect()
    .catch(
      () => {},
    )
}
