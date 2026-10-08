import { useCallback, useEffect, useRef, useState } from "react"
import { ethers } from "ethers"
import { createContract } from "@/config/contract"
import { useWallet } from "@/components/ui/wallet-provider"
import type { ElectionState, SemaphoreProofPayload } from "@/services/api"

const ELECTION_STATES: Record<number, ElectionState> = {
  0: "Registration",
  1: "Active",
  2: "Ended",
}

function toElectionState(value: bigint | number): ElectionState {
  const state = ELECTION_STATES[Number(value)]
  if (!state) throw new Error(`Unknown election state: ${value.toString()}`)
  return state
}

export function useContract() {
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { isConnected, signer, address } = useWallet()
  const lastAddress = useRef<string | null>(null)

  useEffect(() => {
    if (!isConnected || !address || !signer) {
      setContract(null)
      setIsInitialized(false)
      setIsAdmin(false)
      setIsLoading(false)
      lastAddress.current = null
      return
    }

    if (lastAddress.current === address) return
    lastAddress.current = address
    setIsLoading(true)
    setError(null)

    const initializeContract = async () => {
      try {
        const contractInstance = createContract(signer)
        const commission = await contractInstance.electionCommission()
        setContract(contractInstance)
        setIsInitialized(commission !== ethers.ZeroAddress)
        setIsAdmin(address.toLowerCase() === commission.toLowerCase())
      } catch (initializationError) {
        setError(initializationError as Error)
        setContract(null)
        setIsInitialized(false)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    void initializeContract()
  }, [isConnected, signer, address])

  const requireContract = useCallback(() => {
    if (!contract) throw new Error("Contract not initialized")
    return contract
  }, [contract])

  const registerCandidate = useCallback(async (candidateId: number) => {
    const instance = requireContract()
    const tx = await instance.registerCandidate(candidateId)
    const receipt = await tx.wait()
    if (receipt?.status === 0) throw new Error("Candidate registration transaction failed")
    return receipt
  }, [requireContract])

  const registerVoterCommitment = useCallback(async (identityCommitment: string) => {
    if (!/^\d+$/.test(identityCommitment)) throw new Error("Invalid Semaphore identity commitment")
    const instance = requireContract()
    const tx = await instance.registerVoterCommitment(BigInt(identityCommitment))
    const receipt = await tx.wait()
    if (receipt?.status === 0) throw new Error("Voter commitment registration transaction failed")
    return receipt
  }, [requireContract])

  const castVote = useCallback(async (candidateId: number, proof: SemaphoreProofPayload) => {
    if (!Number.isSafeInteger(candidateId) || candidateId <= 0) throw new Error("Invalid candidate ID")
    if (BigInt(proof.message) !== BigInt(candidateId)) throw new Error("Proof is not bound to selected candidate")
    if (!Array.isArray(proof.points) || proof.points.length !== 8) throw new Error("Invalid Semaphore proof")

    const instance = requireContract()
    const tx = await instance.castVote(candidateId, proof)
    const receipt = await tx.wait()
    if (receipt?.status === 0) throw new Error("Vote transaction failed")
    return receipt
  }, [requireContract])

  const startElection = useCallback(async () => {
    const instance = requireContract()
    const tx = await instance.startElection()
    return tx.wait()
  }, [requireContract])

  const endElection = useCallback(async () => {
    const instance = requireContract()
    const tx = await instance.endElection()
    return tx.wait()
  }, [requireContract])

  const getElectionState = useCallback(async () => {
    const instance = requireContract()
    return toElectionState(await instance.getElectionState())
  }, [requireContract])

  const getVoteCount = useCallback(async (candidateId: number) => {
    const instance = requireContract()
    return Number(await instance.getVoteCount(candidateId))
  }, [requireContract])

  return {
    contract,
    isLoading,
    error,
    isInitialized,
    isAdmin,
    registerCandidate,
    registerVoterCommitment,
    castVote,
    startElection,
    endElection,
    getElectionState,
    getVoteCount,
  }
}
