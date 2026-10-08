import {
  Contract,
  JsonRpcProvider,
  type ContractRunner,
  type Signer,
} from "ethers"
import zkLocalVotingAbi from "@/abi/ZKLocalVoting.json"
import voteChainDirectAbi from "@/abi/VoteChainDirect.json"

export const contractAddress =
  (import.meta.env.VITE_CONTRACT_ADDRESS || "").trim()

export const wp5ContractAddress =
  (import.meta.env.VITE_WP5_CONTRACT_ADDRESS || "").trim()

export const rpcUrl =
  (import.meta.env.VITE_RPC_URL || "").trim()

export const contractABI =
  zkLocalVotingAbi

export const wp5ContractABI =
  voteChainDirectAbi

function requireContractAddress() {
  if (!contractAddress) {
    throw new Error(
      "VITE_CONTRACT_ADDRESS is not configured",
    )
  }

  return contractAddress
}

function requireWp5ContractAddress() {
  if (!wp5ContractAddress) {
    throw new Error(
      "VITE_WP5_CONTRACT_ADDRESS is not configured",
    )
  }

  return wp5ContractAddress
}

export function createContract(
  runner: ContractRunner | Signer,
) {
  return new Contract(
    requireContractAddress(),
    contractABI,
    runner,
  )
}

export function createWp5Contract(
  runner: ContractRunner | Signer,
) {
  return new Contract(
    requireWp5ContractAddress(),
    wp5ContractABI,
    runner,
  )
}

export function getProvider() {
  if (!rpcUrl) {
    throw new Error(
      "VITE_RPC_URL is not configured",
    )
  }

  return new JsonRpcProvider(
    rpcUrl,
  )
}
