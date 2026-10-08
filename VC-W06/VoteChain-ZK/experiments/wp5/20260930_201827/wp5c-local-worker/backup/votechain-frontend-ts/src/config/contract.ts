import { Contract, JsonRpcProvider, type ContractRunner, type Signer } from "ethers"
import zkLocalVotingAbi from "@/abi/ZKLocalVoting.json"

export const contractAddress = (import.meta.env.VITE_CONTRACT_ADDRESS || "").trim()
export const rpcUrl = (import.meta.env.VITE_RPC_URL || "").trim()
export const contractABI = zkLocalVotingAbi

function requireContractAddress() {
  if (!contractAddress) throw new Error("VITE_CONTRACT_ADDRESS is not configured")
  return contractAddress
}

export function createContract(runner: ContractRunner | Signer) {
  return new Contract(requireContractAddress(), contractABI, runner)
}

export function getProvider() {
  if (!rpcUrl) throw new Error("VITE_RPC_URL is not configured")
  return new JsonRpcProvider(rpcUrl)
}

export function createReadOnlyContract() {
  return createContract(getProvider())
}
