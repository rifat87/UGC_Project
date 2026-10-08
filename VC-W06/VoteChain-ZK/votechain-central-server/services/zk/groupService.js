import { getContract } from '../../utils/contract.js'
import { loadSemaphoreRuntime } from './semaphoreRuntime.js'
import { reconstructGroupFromRecords } from './groupCore.js'
import { commitmentRecordsFromRegistrationEvents } from './groupEvents.js'

export async function reconstructElectionGroup({ runtime, contract, fromBlock } = {}) {
  const semaphoreRuntime = runtime || await loadSemaphoreRuntime()
  const zkContract = contract || getContract()
  const startBlock = fromBlock ?? Number(process.env.ZK_CONTRACT_DEPLOYMENT_BLOCK || 0)

  if (!Number.isSafeInteger(Number(startBlock)) || Number(startBlock) < 0) {
    throw new Error('ZK_CONTRACT_DEPLOYMENT_BLOCK must be a non-negative safe integer when configured')
  }

  if (!zkContract.filters?.VoterCommitmentRegistered || typeof zkContract.queryFilter !== 'function') {
    throw new Error('ZK contract event-query interface is required for deterministic group reconstruction')
  }

  // ZKLocalVoting is itself the Semaphore group admin and exposes no update/remove
  // membership operation. Therefore its successful registration events form the
  // authoritative append-only member ordering for this election group.
  const filter = zkContract.filters.VoterCommitmentRegistered()
  const events = await zkContract.queryFilter(filter, Number(startBlock), 'latest')
  const voterRecords = commitmentRecordsFromRegistrationEvents(events)

  const [chainSize, chainRoot] = await Promise.all([
    zkContract.getGroupSize(),
    zkContract.getGroupRoot(),
  ])

  return reconstructGroupFromRecords({
    runtime: semaphoreRuntime,
    voterRecords,
    chainSize,
    chainRoot,
  })
}
