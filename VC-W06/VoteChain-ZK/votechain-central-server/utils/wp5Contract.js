import { readFileSync } from "node:fs"
import {
  Contract,
  JsonRpcProvider,
} from "ethers"

import Election from "../models/Election.js"

import {
  getRuntimeElection,
} from "../services/elections/electionRuntimeService.js"
import {
  getBlockchainConfig,
} from "../config/env.js"

const fallbackAbi =
  JSON.parse(
    readFileSync(
      new URL(
        "../abi/VoteChainDirect.json",
        import.meta.url,
      ),
      "utf8",
    ),
  )

let directArtifact = null

try {
  directArtifact =
    JSON.parse(
      readFileSync(
        new URL(
          "../../contracts/wp4-foundry/out/VoteChainWP4.sol/VoteChainDirect.json",
          import.meta.url,
        ),
        "utf8",
      ),
    )
} catch {
  directArtifact = null
}

const abi =
  Array.isArray(
    directArtifact?.abi,
  )
    ? directArtifact.abi
    : fallbackAbi

export function getWp5Provider() {
  const {
    rpcUrl,
  } =
    getBlockchainConfig()

  return new JsonRpcProvider(
    rpcUrl,
  )
}

export function getWp5Contract(
  address =
    process.env
      .WP5_CONTRACT_ADDRESS
      ?.trim(),
) {
  if (!address) {
    throw new Error(
      "A WP5 Direct contract address is required",
    )
  }

  return new Contract(
    address,
    abi,
    getWp5Provider(),
  )
}

export async function getActiveWp5Contract() {
  const election =
    await getRuntimeElection({
      statuses: [
        "active",
      ],
    })

  if (
    !election ||
    !election
      .directContractAddress
      ?.trim()
  ) {
    throw new Error(
      "No active election Direct contract is available",
    )
  }

  const provider =
    getWp5Provider()

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
    throw new Error(
      "Active election chainId does not match the connected RPC network",
    )
  }

  const address =
    election
      .directContractAddress
      .trim()

  const code =
    await provider
      .getCode(
        address,
      )

  if (
    !code ||
    code === "0x"
  ) {
    throw new Error(
      "The active election Direct contract is not deployed on the connected chain",
    )
  }

  return {
    election,

    contract:
      new Contract(
        address,
        abi,
        provider,
      ),
  }
}

export function getWp5ContractAbi() {
  return abi
}

export function getWp5ContractArtifact() {
  if (
    !directArtifact ||
    !Array.isArray(
      directArtifact.abi,
    ) ||
    !directArtifact
      .bytecode
      ?.object
  ) {
    throw new Error(
      "VoteChainDirect Foundry artifact is unavailable",
    )
  }

  return directArtifact
}
