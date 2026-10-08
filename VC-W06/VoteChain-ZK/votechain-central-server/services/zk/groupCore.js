export function reconstructGroupFromRecords({ runtime, voterRecords, chainSize, chainRoot }) {
  if (!runtime?.Group) throw new Error('Semaphore Group runtime is required')
  const voters = [...voterRecords].sort((left, right) => left.zkGroupIndex - right.zkGroupIndex)

  voters.forEach((voter, index) => {
    if (voter.zkGroupIndex !== index) {
      throw new Error(`Registered voter group ordering is inconsistent at index ${index}`)
    }
    if (!/^\d+$/.test(String(voter.zkIdentityCommitment || ''))) {
      throw new Error(`Registered voter at index ${index} has an invalid identity commitment`)
    }
  })

  const commitments = voters.map((voter) => BigInt(voter.zkIdentityCommitment))
  const group = new runtime.Group(commitments)
  const normalizedChainSize = Number(chainSize)
  const normalizedChainRoot = BigInt(chainRoot)

  if (normalizedChainSize !== commitments.length) {
    throw new Error(`Semaphore group is stale: backend reconstructed ${commitments.length} registered members but chain has ${normalizedChainSize}`)
  }
  if (BigInt(group.root) !== normalizedChainRoot) {
    throw new Error('Semaphore group root mismatch between backend reconstruction and blockchain')
  }

  return { group, voters, commitments, chainSize: normalizedChainSize, chainRoot: normalizedChainRoot }
}
