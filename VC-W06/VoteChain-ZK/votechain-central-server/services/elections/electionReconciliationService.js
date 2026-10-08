
import {
  Contract,
  getAddress,
  isAddress,
} from "ethers"

import Election
  from "../../models/Election.js"

import {
  clearRuntimeElectionIfMatches,
  getRuntimeElectionContext,
} from "./electionRuntimeService.js"

import {
  getWp5ContractArtifact,
  getWp5Provider,
} from "../../utils/wp5Contract.js"

const TERMINAL =
  new Set([
    "finalized",
    "failed",
    "orphaned",
  ])

const DIRECT_STAGES =
  new Set([
    "deployed",
    "configured",
    "trustees_pinned",
    "active",
  ])

function expectsDirect(
  election,
) {
  return (
    election.status ===
      "active" ||
    election.status ===
      "ended" ||
    DIRECT_STAGES.has(
      election.startStage,
    )
  )
}

async function saveHealth(
  election,
  health,
  reason = undefined,
) {
  election.chainHealth =
    health

  election.chainHealthReason =
    reason

  election.lastChainReconciledAt =
    new Date()

  await election.save()

  return election
}

async function releaseRuntimeSelection(
  election,
  runtimeMode,
) {
  if (
    runtimeMode ===
      "pointer"
  ) {
    const cleared =
      await clearRuntimeElectionIfMatches(
        election,
      )

    if (!cleared) {
      throw new Error(
        "Election runtime pointer changed during reconciliation",
      )
    }

    return
  }

  election.lifecycleSlot =
    undefined
}


async function orphanElection(
  election,
  reason,
  runtimeMode,
) {
  election.status =
    "orphaned"

  election.chainHealth =
    "orphaned"

  election.chainHealthReason =
    reason

  election.orphanedAt =
    new Date()

  election.lastChainReconciledAt =
    new Date()

  await releaseRuntimeSelection(
    election,
    runtimeMode,
  )

  await election.save()

  console.warn(
    `[ElectionReconcile] election ${election.electionId} archived as orphaned: ${reason}`,
  )

  return election
}


export async function
reconcileCurrentElection() {
  const runtime =
    await getRuntimeElectionContext()

  const election =
    runtime.election

  const runtimeMode =
    runtime.mode

  if (!election) {
    return null
  }

  if (
    TERMINAL.has(
      election.status,
    )
  ) {
    await releaseRuntimeSelection(
      election,
      runtimeMode,
    )

    if (
      runtimeMode ===
        "legacy"
    ) {
      await election.save()
    }

    return election
  }

  const provider =
    getWp5Provider()

  let network

  try {
    network =
      await provider
        .getNetwork()
  } catch {
    return saveHealth(
      election,
      "unreachable",
      "Blockchain RPC is currently unreachable",
    )
  }

  if (
    election.chainId &&
    String(
      election.chainId,
    ) !==
      String(
        network.chainId,
      )
  ) {
    return saveHealth(
      election,
      "mismatch",
      `Connected chainId ${network.chainId.toString()} differs from election chainId ${election.chainId}`,
    )
  }

  /*
   * Registration or snapshot-only election legitimately has no Direct yet.
   */
  if (
    !expectsDirect(
      election,
    )
  ) {
    return saveHealth(
      election,
      "healthy",
    )
  }

  if (
    !election
      .directContractAddress ||
    !election
      .verifierAddress
  ) {
    return orphanElection(
      election,
      "Election expects deployed WP5 contracts but deployment addresses are missing",
      runtimeMode,
    )
  }

  let directCode
  let verifierCode

  try {
    [
      directCode,
      verifierCode,
    ] =
      await Promise.all([
        provider.getCode(
          election
            .directContractAddress,
        ),

        provider.getCode(
          election
            .verifierAddress,
        ),
      ])
  } catch {
    return saveHealth(
      election,
      "unreachable",
      "Unable to inspect deployed election contracts",
    )
  }

  if (
    !directCode ||
    directCode === "0x" ||
    !verifierCode ||
    verifierCode === "0x"
  ) {
    return orphanElection(
      election,
      "Persisted WP5 deployment is absent from the reachable chain; chain state was reset or replaced",
      runtimeMode,
    )
  }

  try {
    const artifact =
      getWp5ContractArtifact()

    const direct =
      new Contract(
        election
          .directContractAddress,
        artifact.abi,
        provider,
      )

    const [
      admin,
      verifier,
      chainElectionId,
      configured,
      phase,
    ] =
      await Promise.all([
        direct.admin(),
        direct.verifier(),
        direct.electionId(),
        direct.configured(),
        direct.phase(),
      ])

    if (
      election.adminAddress &&
      isAddress(
        election.adminAddress,
      ) &&
      getAddress(admin) !==
        getAddress(
          election.adminAddress,
        )
    ) {
      return orphanElection(
        election,
        "VoteChainDirect administrator does not match the persisted election",
        runtimeMode,
      )
    }

    if (
      getAddress(verifier) !==
      getAddress(
        election.verifierAddress,
      )
    ) {
      return orphanElection(
        election,
        "VoteChainDirect verifier does not match the persisted election",
        runtimeMode,
      )
    }

    if (
      BigInt(
        chainElectionId,
      ) !==
      BigInt(
        election.electionId,
      )
    ) {
      return orphanElection(
        election,
        "VoteChainDirect electionId does not match the persisted election",
        runtimeMode,
      )
    }

    if (
      Boolean(configured) &&
      election.eligibleRoot &&
      election.candidateManifestHash &&
      election.candidateCount !==
        undefined &&
      election.candidateCount !==
        null
    ) {
      const [
        root,
        manifest,
        count,
      ] =
        await Promise.all([
          direct
            .eligibleRoot(),

          direct
            .candidateManifestHash(),

          direct
            .candidateCount(),
        ])

      if (
        BigInt(root) !==
          BigInt(
            election
              .eligibleRoot,
          ) ||
        BigInt(manifest) !==
          BigInt(
            election
              .candidateManifestHash,
          ) ||
        BigInt(count) !==
          BigInt(
            election
              .candidateCount,
          )
      ) {
        return orphanElection(
          election,
          "VoteChainDirect frozen root/manifest/count do not match the persisted election",
          runtimeMode,
        )
      }
    }

    const numericPhase =
      Number(phase)

    /*
     * Chain may have advanced successfully while Mongo's final write
     * was interrupted. Reconcile forward, never backward.
     */
    if (
      numericPhase === 1 &&
      election.status ===
        "starting"
    ) {
      election.status =
        "active"

      election.startStage =
        "active"

      election.startedAt =
        election.startedAt ||
        new Date()
    }

    if (
      numericPhase === 2 &&
      election.status ===
        "active"
    ) {
      election.status =
        "ended"

      election.endedAt =
        election.endedAt ||
        new Date()
    }

    if (
      numericPhase === 3
    ) {
      election.status =
        "finalized"

      election.finalizedAt =
        election.finalizedAt ||
        new Date()

      await releaseRuntimeSelection(
        election,
        runtimeMode,
      )
    }

    return saveHealth(
      election,
      "healthy",
    )
  } catch (error) {
    /*
     * Bytecode exists, but a state read failed. Do not silently delete
     * lifecycle history and do not assume a network outage.
     */
    return saveHealth(
      election,
      "mismatch",
      `WP5 contract state could not be reconciled: ${error.message}`,
    )
  }
}
