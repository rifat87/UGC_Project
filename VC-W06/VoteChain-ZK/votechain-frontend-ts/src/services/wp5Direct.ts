import {
  BrowserProvider,
  Contract,
  getAddress,
} from "ethers"

import VoteChainDirectAbi
  from "@/abi/VoteChainDirect.json"

import {
  getWp5PublicConfig,
  type Wp5PublicConfig,
} from "@/services/api"


function sameBigInt(
  actual: unknown,
  expected: string,
  label: string,
) {
  if (
    BigInt(
      actual as bigint,
    ) !==
    BigInt(
      expected,
    )
  ) {
    throw new Error(
      `Current VoteChainDirect ${label} does not match the frozen election configuration`,
    )
  }
}


export async function getCurrentWp5DirectContract(): Promise<{
  contract: Contract
  config: Wp5PublicConfig
}> {
  const injected =
    (
      window as unknown as {
        ethereum?: unknown
      }
    ).ethereum


  if (!injected) {
    throw new Error(
      "A government-funded vote-submission wallet is required",
    )
  }


  /*
   * The backend current-election record is the authoritative
   * resolver for the per-election Direct deployment.
   */
  const config =
    await getWp5PublicConfig()


  if (
    !config ||
    !config.directContractAddress
  ) {
    throw new Error(
      "The active election does not expose a VoteChainDirect address",
    )
  }


  if (
    !config.configured ||
    Number(
      config.phase,
    ) !== 1
  ) {
    throw new Error(
      "The current election is not active for private voting",
    )
  }


  let directAddress: string

  try {
    directAddress =
      getAddress(
        config
          .directContractAddress,
      )
  } catch {
    throw new Error(
      "The active election returned an invalid VoteChainDirect address",
    )
  }


  const provider =
    new BrowserProvider(
      injected as never,
    )


  const code =
    await provider.getCode(
      directAddress,
    )


  if (
    !code ||
    code === "0x"
  ) {
    throw new Error(
      "VoteChainDirect is not deployed on the wallet's current network. Check the selected blockchain network.",
    )
  }


  const signer =
    await provider.getSigner()


  const contract =
    new Contract(
      directAddress,
      VoteChainDirectAbi,
      signer,
    )


  const [
    configured,
    phase,
    electionId,
    eligibleRoot,
    candidateManifestHash,
    candidateCount,
    contractDomain,
    Yx,
    Yy,
    electionContextHash,
    admin,
  ] =
    await Promise.all([
      contract.configured(),
      contract.phase(),
      contract.electionId(),
      contract.eligibleRoot(),
      contract.candidateManifestHash(),
      contract.candidateCount(),
      contract.contractDomain(),
      contract.Yx(),
      contract.Yy(),
      contract.electionContextHash(),
      contract.admin(),
    ])


  if (
    !configured ||
    Number(
      phase,
    ) !== 1
  ) {
    throw new Error(
      "The resolved VoteChainDirect contract is not active",
    )
  }


  sameBigInt(
    electionId,
    config.config.electionId,
    "electionId",
  )

  sameBigInt(
    eligibleRoot,
    config.config.eligibleRoot,
    "eligible root",
  )

  sameBigInt(
    candidateManifestHash,
    config
      .config
      .candidateManifestHash,
    "candidate manifest",
  )

  sameBigInt(
    candidateCount,
    config.config.candidateCount,
    "candidate count",
  )

  sameBigInt(
    contractDomain,
    config.config.contractDomain,
    "contract domain",
  )

  sameBigInt(
    Yx,
    config.config.Yx,
    "election public-key X",
  )

  sameBigInt(
    Yy,
    config.config.Yy,
    "election public-key Y",
  )

  sameBigInt(
    electionContextHash,
    config
      .config
      .electionContextHash,
    "election context",
  )


  /*
   * The Election Commission/admin account is not the ordinary
   * government-funded vote-submission account.
   */
  const signerAddress =
    getAddress(
      await signer.getAddress(),
    )


  const adminAddress =
    getAddress(
      String(
        admin,
      ),
    )


  if (
    signerAddress ===
      adminAddress
  ) {
    throw new Error(
      "Connect a non-admin government-funded vote-submission wallet before casting a vote",
    )
  }


  return {
    contract,
    config,
  }
}
