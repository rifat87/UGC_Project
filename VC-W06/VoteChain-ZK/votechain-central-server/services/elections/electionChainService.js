import {
  readFileSync,
} from "node:fs"

import {
  Contract,
  ContractFactory,
  ZeroHash,
  getAddress,
} from "ethers"

import Election from "../../models/Election.js"

import {
  getWp5ContractArtifact,
  getWp5Provider,
} from "../../utils/wp5Contract.js"

import {
  wp5Hash,
} from "../zk/wp5PrivacyService.js"

const verifierArtifact =
  JSON.parse(
    readFileSync(
      new URL(
        "../../../contracts/wp4-foundry/out/VoteChainVoteDirectVerifier.sol/VoteChainVoteDirectVerifier.json",
        import.meta.url,
      ),
      "utf8",
    ),
  )

const appProfile =
  JSON.parse(
    readFileSync(
      new URL(
        "../../../crypto/config/wp5-application-profile.json",
        import.meta.url,
      ),
      "utf8",
    ),
  )

const wp3Profile =
  JSON.parse(
    readFileSync(
      new URL(
        "../../../crypto/config/wp3-build-profile.json",
        import.meta.url,
      ),
      "utf8",
    ),
  )

function lifecycleError(
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

function artifactBytecode(
  artifact,
  label,
) {
  const bytecode =
    artifact
      ?.bytecode
      ?.object

  if (
    !bytecode ||
    bytecode === "0x"
  ) {
    throw lifecycleError(
      "DEPLOYMENT_ARTIFACT_MISSING",
      `${label} deployment bytecode is unavailable`,
    )
  }

  return bytecode
}

async function requireCode(
  provider,
  address,
  label,
) {
  const code =
    await provider
      .getCode(
        address,
      )

  if (
    !code ||
    code === "0x"
  ) {
    throw lifecycleError(
      "CHAIN_STATE_LOST",
      `${label} address exists in MongoDB but has no bytecode on the connected chain`,
    )
  }
}

function requireSnapshot(
  election,
) {
  if (
    !election.eligibleRoot ||
    !election.candidateManifestHash ||
    !Number.isSafeInteger(
      Number(
        election.candidateCount,
      ),
    ) ||
    Number(
      election.candidateCount,
    ) < 1
  ) {
    throw lifecycleError(
      "SNAPSHOT_NOT_READY",
      "Election snapshot is not ready for contract configuration",
    )
  }

  if (
    !election.trusteeTranscript ||
    !election.trusteeTranscriptHash ||
    !election.Yx ||
    !election.Yy
  ) {
    throw lifecycleError(
      "TRUSTEE_TRANSCRIPT_REQUIRED",
      "A verified WP6 trustee transcript is required before election activation",
    )
  }
}

function contractDomain() {
  const raw =
    wp3Profile
      .testContractDomain ??
    wp3Profile
      .devContractDomain

  if (
    raw === undefined ||
    raw === null
  ) {
    throw lifecycleError(
      "WP5_PROFILE_INVALID",
      "WP5 contract domain is missing from the build profile",
    )
  }

  return BigInt(
    raw,
  )
}

function electionContextDomain() {
  const raw =
    appProfile
      ?.domains
      ?.electionContext ??
    wp3Profile
      ?.domains
      ?.electionContext

  if (
    raw === undefined ||
    raw === null
  ) {
    throw lifecycleError(
      "WP5_PROFILE_INVALID",
      "WP5 election-context domain is missing from the profile",
    )
  }

  return BigInt(
    raw,
  )
}

async function ensureDeployments({
  election,
  provider,
  signer,
}) {
  const directArtifact =
    getWp5ContractArtifact()

  if (
    election.verifierAddress
  ) {
    await requireCode(
      provider,
      election.verifierAddress,
      "WP5 verifier",
    )
  } else {
    const verifierFactory =
      new ContractFactory(
        verifierArtifact.abi,
        artifactBytecode(
          verifierArtifact,
          "WP5 verifier",
        ),
        signer,
      )

    const verifier =
      await verifierFactory
        .deploy()

    await verifier
      .waitForDeployment()

    election.verifierAddress =
      await verifier
        .getAddress()

    await election.save()
  }

  if (
    election.directContractAddress
  ) {
    await requireCode(
      provider,
      election.directContractAddress,
      "VoteChainDirect",
    )
  } else {
    const directFactory =
      new ContractFactory(
        directArtifact.abi,
        artifactBytecode(
          directArtifact,
          "VoteChainDirect",
        ),
        signer,
      )

    const direct =
      await directFactory
        .deploy(
          election
            .verifierAddress,
        )

    await direct
      .waitForDeployment()

    election.directContractAddress =
      await direct
        .getAddress()

    election.startStage =
      "deployed"

    await election.save()
  }

  return new Contract(
    election.directContractAddress,
    directArtifact.abi,
    signer,
  )
}

async function verifyConfiguredState({
  direct,
  config,
}) {
  const [
    eligibleRoot,
    electionId,
    manifest,
    count,
    domain,
    Yx,
    Yy,
    contextHash,
  ] =
    await Promise.all([
      direct.eligibleRoot(),
      direct.electionId(),
      direct.candidateManifestHash(),
      direct.candidateCount(),
      direct.contractDomain(),
      direct.Yx(),
      direct.Yy(),
      direct.electionContextHash(),
    ])

  const actual = [
    eligibleRoot,
    electionId,
    manifest,
    count,
    domain,
    Yx,
    Yy,
    contextHash,
  ].map(
    value =>
      BigInt(
        value,
      ),
  )

  const expected =
    config.map(
      value =>
        BigInt(
          value,
        ),
    )

  for (
    let index = 0;
    index <
      expected.length;
    index += 1
  ) {
    if (
      actual[index] !==
      expected[index]
    ) {
      throw lifecycleError(
        "CONTRACT_CONFIG_MISMATCH",
        `VoteChainDirect configuration mismatch at tuple index ${index}`,
      )
    }
  }
}

export async function activateElectionOnChain(
  election,
) {
  requireSnapshot(
    election,
  )

  const provider =
    getWp5Provider()

  try {
    const network =
      await provider
        .getNetwork()

    if (
      election.chainId &&
      String(
        network.chainId,
      ) !==
        String(
          election.chainId,
        )
    ) {
      throw lifecycleError(
        "CHAIN_ID_MISMATCH",
        "Election chainId does not match the connected RPC network",
      )
    }

    const signer =
      await provider
        .getSigner(
          0,
        )

    const signerAddress =
      getAddress(
        await signer
          .getAddress(),
      )

    const expectedAdmin =
      getAddress(
        election.adminAddress,
      )

    if (
      signerAddress !==
      expectedAdmin
    ) {
      throw lifecycleError(
        "DEPLOYER_ADMIN_MISMATCH",
        "RPC signer 0 is not the administrator that created this election",
      )
    }

    const direct =
      await ensureDeployments({
        election,
        provider,
        signer,
      })

    const directAdmin =
      getAddress(
        await direct.admin(),
      )

    if (
      directAdmin !==
      expectedAdmin
    ) {
      throw lifecycleError(
        "DIRECT_ADMIN_MISMATCH",
        "VoteChainDirect admin does not match the election administrator",
      )
    }

    const verifierAddress =
      getAddress(
        await direct.verifier(),
      )

    if (
      verifierAddress !==
      getAddress(
        election
          .verifierAddress,
      )
    ) {
      throw lifecycleError(
        "DIRECT_VERIFIER_MISMATCH",
        "VoteChainDirect points to an unexpected verifier",
      )
    }

    const domain =
      contractDomain()

    const D_CTX =
      electionContextDomain()

    const contextHash =
      await wp5Hash([
        D_CTX,
        BigInt(
          election.electionId,
        ),
        BigInt(
          election
            .candidateManifestHash,
        ),
        BigInt(
          election.candidateCount,
        ),
        domain,
        BigInt(
          election.Yx,
        ),
        BigInt(
          election.Yy,
        ),
      ])

    const config = [
      String(
        election.eligibleRoot,
      ),
      String(
        election.electionId,
      ),
      String(
        election
          .candidateManifestHash,
      ),
      String(
        election.candidateCount,
      ),
      domain.toString(),
      String(
        election.Yx,
      ),
      String(
        election.Yy,
      ),
      contextHash.toString(),
    ]

    election.contractDomain =
      domain.toString()

    election.electionContextHash =
      contextHash.toString()

    await election.save()

    const configured =
      Boolean(
        await direct
          .configured(),
      )

    if (!configured) {
      const tx =
        await direct
          .configure(
            config,
          )

      await tx.wait()
    }

    await verifyConfiguredState({
      direct,
      config,
    })

    election.startStage =
      "configured"

    await election.save()

    const expectedTranscriptHash =
      String(
        election
          .trusteeTranscriptHash,
      )
        .toLowerCase()

    const pinned =
      String(
        await direct
          .trusteeTranscriptHash(),
      )
        .toLowerCase()

    if (
      pinned ===
      ZeroHash.toLowerCase()
    ) {
      const tx =
        await direct
          .setTrusteeTranscriptHash(
            expectedTranscriptHash,
          )

      await tx.wait()
    } else if (
      pinned !==
      expectedTranscriptHash
    ) {
      throw lifecycleError(
        "TRUSTEE_TRANSCRIPT_MISMATCH",
        "VoteChainDirect already has a different trustee transcript hash",
      )
    }

    election.startStage =
      "trustees_pinned"

    await election.save()

    const phaseBefore =
      Number(
        await direct
          .phase(),
      )

    if (
      phaseBefore === 0
    ) {
      const tx =
        await direct
          .activate()

      await tx.wait()
    } else if (
      phaseBefore !== 1
    ) {
      throw lifecycleError(
        "DIRECT_PHASE_INVALID",
        `Cannot activate VoteChainDirect from phase ${phaseBefore}`,
      )
    }

    const phaseAfter =
      Number(
        await direct
          .phase(),
      )

    if (
      phaseAfter !== 1
    ) {
      throw lifecycleError(
        "DIRECT_ACTIVATION_FAILED",
        "VoteChainDirect did not enter Active phase",
      )
    }

    election.status =
      "active"

    election.startStage =
      "active"

    if (
      !election.startedAt
    ) {
      election.startedAt =
        new Date()
    }

    election.failureReason =
      undefined

    await election.save()

    return {
      electionId:
        election.electionId,

      status:
        election.status,

      startStage:
        election.startStage,

      verifierAddress:
        election.verifierAddress,

      directContractAddress:
        election
          .directContractAddress,

      eligibleRoot:
        election.eligibleRoot,

      eligibleVoterCount:
        election
          .eligibleVoterCount,

      candidateManifestHash:
        election
          .candidateManifestHash,

      candidateCount:
        election.candidateCount,

      trusteeTranscriptHash:
        election
          .trusteeTranscriptHash,

      contractDomain:
        election.contractDomain,

      Yx:
        election.Yx,

      Yy:
        election.Yy,

      electionContextHash:
        election
          .electionContextHash,
    }
  } catch (error) {
    election.failureReason =
      error.message

    await election.save()

    throw error
  }
}
