import {
  getAddress,
} from "ethers"

import Candidate
  from "../../models/Candidate.js"

import Election
  from "../../models/Election.js"

import {
  getRuntimeElection,
} from "../elections/electionRuntimeService.js"

import Voter
  from "../../models/Voter.js"

import {
  getContract,
  getProvider,
} from "../../utils/contract.js"


function reconciliationError(
  status,
  code,
  message,
) {
  const error =
    new Error(message)

  error.status =
    status

  error.code =
    code

  return error
}


function normalizeTransactionHash(
  value,
) {
  const hash =
    String(
      value || "",
    )
      .trim()

  if (
    !/^0x[0-9a-fA-F]{64}$/
      .test(hash)
  ) {
    throw reconciliationError(
      400,
      "INVALID_TRANSACTION_HASH",
      "A valid registration transaction hash is required",
    )
  }

  return hash
}


async function
currentRegistrationContext() {
  const election =
    await getRuntimeElection({
      statuses: [
        "registration",
      ],
    })

  if (!election) {
    throw reconciliationError(
      409,
      "REGISTRATION_CLOSED",
      "No current election is open for registration",
    )
  }

  const provider =
    getProvider()

  const contract =
    getContract()

  const [
    network,
    contractAddress,
    contractElectionId,
    contractState,
    commission,
  ] =
    await Promise.all([
      provider.getNetwork(),

      contract.getAddress(),

      contract.electionId(),

      contract.state(),

      contract.electionCommission(),
    ])

  if (
    election.chainId &&
    String(
      election.chainId,
    ) !==
      String(
        network.chainId,
      )
  ) {
    throw reconciliationError(
      409,
      "CHAIN_ID_MISMATCH",
      "Registration transaction chain does not match the current election",
    )
  }

  if (
    BigInt(
      contractElectionId,
    ) !==
    BigInt(
      election.electionId,
    )
  ) {
    throw reconciliationError(
      409,
      "ELECTION_ID_MISMATCH",
      "Registration contract does not belong to the current election",
    )
  }

  if (
    Number(
      contractState,
    ) !== 0
  ) {
    throw reconciliationError(
      409,
      "REGISTRATION_CONTRACT_CLOSED",
      "The registration contract is no longer in Registration state",
    )
  }

  if (
    election.adminAddress &&
    getAddress(
      election.adminAddress,
    ) !==
      getAddress(
        commission,
      )
  ) {
    throw reconciliationError(
      409,
      "REGISTRATION_ADMIN_MISMATCH",
      "Registration contract administrator does not match the current election",
    )
  }

  return {
    election,
    provider,
    contract,

    contractAddress:
      getAddress(
        contractAddress,
      ),

    commission:
      getAddress(
        commission,
      ),
  }
}


async function
confirmedRegistrationReceipt({
  transactionHash,
  expectedEvent,
  expectedValue,
}) {
  const hash =
    normalizeTransactionHash(
      transactionHash,
    )

  const context =
    await currentRegistrationContext()

  const receipt =
    await context
      .provider
      .getTransactionReceipt(
        hash,
      )

  if (!receipt) {
    throw reconciliationError(
      409,
      "TRANSACTION_NOT_CONFIRMED",
      "Registration transaction is not confirmed on the current chain",
    )
  }

  if (
    Number(
      receipt.status,
    ) !== 1
  ) {
    throw reconciliationError(
      409,
      "TRANSACTION_REVERTED",
      "Registration transaction reverted",
    )
  }

  if (
    !receipt.to ||
    getAddress(
      receipt.to,
    ) !==
      context.contractAddress
  ) {
    throw reconciliationError(
      409,
      "WRONG_REGISTRATION_CONTRACT",
      "Transaction was not sent to the current registration contract",
    )
  }

  if (
    getAddress(
      receipt.from,
    ) !==
      context.commission
  ) {
    throw reconciliationError(
      409,
      "WRONG_REGISTRATION_SENDER",
      "Registration transaction was not sent by the Election Commission",
    )
  }

  let matchingEvent =
    false

  for (
    const log
    of receipt.logs
  ) {
    if (
      getAddress(
        log.address,
      ) !==
      context.contractAddress
    ) {
      continue
    }

    try {
      const parsed =
        context
          .contract
          .interface
          .parseLog(log)

      if (
        !parsed ||
        parsed.name !==
          expectedEvent
      ) {
        continue
      }

      const value =
        parsed.args[0]

      if (
        BigInt(value) ===
        BigInt(
          expectedValue,
        )
      ) {
        matchingEvent =
          true

        break
      }
    } catch {
      // Ignore unrelated logs.
    }
  }

  if (!matchingEvent) {
    throw reconciliationError(
      409,
      "REGISTRATION_EVENT_MISMATCH",
      `Transaction does not contain the expected ${expectedEvent} event`,
    )
  }

  return {
    ...context,
    receipt,
    transactionHash:
      hash,
  }
}


export async function
reconcileCandidateRegistration({
  candidateId,
  transactionHash,
}) {
  const normalizedCandidateId =
    Number(
      candidateId,
    )

  if (
    !Number.isSafeInteger(
      normalizedCandidateId,
    ) ||
    normalizedCandidateId < 1
  ) {
    throw reconciliationError(
      400,
      "INVALID_CANDIDATE_ID",
      "candidateId must be a positive safe integer",
    )
  }

  const context =
    await confirmedRegistrationReceipt({
      transactionHash,

      expectedEvent:
        "CandidateRegistered",

      expectedValue:
        normalizedCandidateId,
    })

  const candidate =
    await Candidate
      .findOne({
        candidateId:
          normalizedCandidateId,

        electionId:
          String(
            context.election.electionId,
          ),
      })

  if (!candidate) {
    throw reconciliationError(
      404,
      "CANDIDATE_NOT_FOUND",
      "Candidate metadata record was not found in the current registration election",
    )
  }

  const chainCandidate =
    await context
      .contract
      .candidates(
        BigInt(
          normalizedCandidateId,
        ),
      )

  const exists =
    Boolean(
      chainCandidate.exists ??
      chainCandidate[0],
    )

  if (!exists) {
    throw reconciliationError(
      409,
      "CANDIDATE_NOT_REGISTERED",
      "Candidate registration event exists but current contract state does not confirm the candidate",
    )
  }

  candidate.registrationStatus =
    "registered"

  candidate.registrationTxHash =
    context.transactionHash

  candidate.registrationContractAddress =
    context.contractAddress

  candidate.registrationConfirmedAt =
    new Date()

  await candidate.save()

  return {
    candidateId:
      candidate.candidateId,

    electionId:
      candidate.electionId,

    registrationStatus:
      candidate.registrationStatus,

    transactionHash:
      candidate.registrationTxHash,
  }
}

export async function
reconcileVoterRegistration({
  identityCommitment,
  transactionHash,
}) {
  const commitment =
    String(
      identityCommitment ||
      "",
    )
      .trim()

  if (
    !/^\d+$/
      .test(commitment) ||
    BigInt(commitment) === 0n
  ) {
    throw reconciliationError(
      400,
      "INVALID_IDENTITY_COMMITMENT",
      "A valid identity commitment is required",
    )
  }

  const voter =
    await Voter
      .findOne({
        zkIdentityCommitment:
          commitment,
      })

  if (!voter) {
    throw reconciliationError(
      404,
      "VOTER_NOT_FOUND",
      "Voter enrollment record was not found",
    )
  }

  const context =
    await confirmedRegistrationReceipt({
      transactionHash,

      expectedEvent:
        "VoterCommitmentRegistered",

      expectedValue:
        commitment,
    })

  const onChain =
    await context
      .contract
      .registeredCommitments(
        BigInt(
          commitment,
        ),
      )

  if (!onChain) {
    throw reconciliationError(
      409,
      "VOTER_NOT_REGISTERED",
      "Voter commitment event exists but current contract state does not confirm membership",
    )
  }

  const groupIndex =
    Number(
      await context
        .contract
        .getCommitmentIndex(
          BigInt(
            commitment,
          ),
        ),
    )

  voter.zkRegistrationStatus =
    "registered"

  voter.zkGroupIndex =
    groupIndex

  voter.zkRegistrationTxHash =
    context.transactionHash

  await voter.save()

  return {
    identityCommitment:
      voter.zkIdentityCommitment,

    registrationStatus:
      voter.zkRegistrationStatus,

    groupIndex:
      voter.zkGroupIndex,

    transactionHash:
      voter.zkRegistrationTxHash,
  }
}
