
import {
  getAddress,
} from "ethers"

import Election
  from "../../models/Election.js"

import {
  claimRuntimeElection,
  getRuntimeElection,
  runtimePointerModeEnabled,
} from "./electionRuntimeService.js"

import {
  getContract,
  getProvider,
} from "../../utils/contract.js"

import {
  reconcileCurrentElection,
} from "./electionReconciliationService.js"

const CURRENT_STATUSES = [
  "registration",
  "starting",
  "active",
  "ended",
]

function electionInProgressError() {
  const error =
    new Error(
      "An unfinished election already exists",
    )

  error.code =
    "ELECTION_IN_PROGRESS"

  return error
}

export async function
getCurrentElection() {
  await reconcileCurrentElection()

  return getRuntimeElection({
    statuses:
      CURRENT_STATUSES,
  })
}


export async function
getRegistrationState() {
  const election =
    await getCurrentElection()

  if (!election) {
    return {
      open:
        true,

      election:
        null,
    }
  }

  return {
    open:
      election.status ===
      "registration",

    election,
  }
}

export async function
createElectionRecord({
  adminAddress,
}) {
  function creationError(
    code,
    message,
  ) {
    const error =
      new Error(
        message,
      )

    error.code =
      code

    return error
  }


  const pointerMode =
    await runtimePointerModeEnabled()


  if (!pointerMode) {
    await Election.updateMany(
      {
        lifecycleSlot:
          "current",

        status: {
          $in: [
            "finalized",
            "failed",
            "orphaned",
          ],
        },
      },
      {
        $unset: {
          lifecycleSlot:
            1,
        },
      },
    )
  }


  const current =
    await getCurrentElection()


  if (current) {
    throw electionInProgressError()
  }


  let authenticatedAdmin

  try {
    authenticatedAdmin =
      getAddress(
        String(
          adminAddress,
        ),
      )
  } catch {
    throw creationError(
      "INVALID_ELECTION_ADMIN",
      "A valid authenticated election administrator address is required",
    )
  }


  const provider =
    getProvider()

  const network =
    await provider
      .getNetwork()

  const contract =
    getContract()

  const contractAddress =
    await contract
      .getAddress()

  const contractCode =
    await provider
      .getCode(
        contractAddress,
      )


  if (
    !contractCode ||
    contractCode ===
      "0x"
  ) {
    throw creationError(
      "REGISTRATION_CONTRACT_NOT_DEPLOYED",
      "The configured ZKLocalVoting contract is not deployed on the connected chain",
    )
  }


  let chainElectionId
  let chainAdmin

  try {
    [
      chainElectionId,
      chainAdmin,
    ] =
      await Promise.all([
        contract
          .electionId(),

        contract
          .electionCommission(),
      ])
  } catch {
    throw creationError(
      "REGISTRATION_CONTRACT_INVALID",
      "The configured contract does not expose the expected ZKLocalVoting registration interface",
    )
  }


  let electionId

  try {
    electionId =
      BigInt(
        chainElectionId,
      )
        .toString()
  } catch {
    throw creationError(
      "INVALID_CONTRACT_ELECTION_ID",
      "ZKLocalVoting returned an invalid election identifier",
    )
  }


  if (
    BigInt(
      electionId,
    ) ===
    0n
  ) {
    throw creationError(
      "INVALID_CONTRACT_ELECTION_ID",
      "ZKLocalVoting electionId must be non-zero",
    )
  }


  let deployedAdmin

  try {
    deployedAdmin =
      getAddress(
        String(
          chainAdmin,
        ),
      )
  } catch {
    throw creationError(
      "INVALID_CONTRACT_ADMIN",
      "ZKLocalVoting returned an invalid Election Commission address",
    )
  }


  if (
    authenticatedAdmin !==
    deployedAdmin
  ) {
    throw creationError(
      "ELECTION_ADMIN_MISMATCH",
      "The authenticated administrator does not match ZKLocalVoting.electionCommission()",
    )
  }


  const alreadyExists =
    await Election.exists({
      electionId,
    })


  if (alreadyExists) {
    throw creationError(
      "ELECTION_ID_ALREADY_EXISTS",
      "The deployed ZKLocalVoting electionId is already bound to an election record",
    )
  }


  const payload = {
    electionId,

    status:
      "registration",

    chainId:
      network.chainId
        .toString(),

    adminAddress:
      deployedAdmin,
  }


  if (!pointerMode) {
    payload.lifecycleSlot =
      "current"
  }


  let election

  try {
    election =
      await Election.create(
        payload,
      )
  } catch (error) {
    if (
      !pointerMode &&
      error?.code ===
        11000 &&
      error?.keyPattern
        ?.lifecycleSlot
    ) {
      throw electionInProgressError()
    }


    if (
      error?.code ===
        11000 &&
      error?.keyPattern
        ?.electionId
    ) {
      throw creationError(
        "ELECTION_ID_ALREADY_EXISTS",
        "The deployed ZKLocalVoting electionId already exists in MongoDB",
      )
    }


    throw error
  }


  if (!pointerMode) {
    return election
  }


  let claimed

  try {
    claimed =
      await claimRuntimeElection(
        election,
      )
  } catch (error) {
    await Election.deleteOne({
      _id:
        election._id,

      status:
        "registration",
    })

    throw error
  }


  if (!claimed) {
    await Election.deleteOne({
      _id:
        election._id,

      status:
        "registration",
    })

    throw electionInProgressError()
  }


  return election
}
