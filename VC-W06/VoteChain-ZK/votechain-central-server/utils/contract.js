import { readFileSync } from 'node:fs'
import { Contract, JsonRpcProvider } from 'ethers'
import { getBlockchainConfig } from '../config/env.js'

const artifactUrl = new URL('../abi/ZKLocalVoting.json', import.meta.url)
const contractABI = JSON.parse(readFileSync(artifactUrl, 'utf8'))

export function getProvider() {
  const { rpcUrl } = getBlockchainConfig()
  return new JsonRpcProvider(rpcUrl)
}

export function getContract() {
  const { contractAddress } = getBlockchainConfig()
  return new Contract(contractAddress, contractABI, getProvider())
}

export function getContractAbi() {
  return contractABI
}
