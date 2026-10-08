function toNumericString(value, label) {
  try {
    return BigInt(value).toString()
  } catch {
    throw new Error(`Invalid Semaphore ${label}`)
  }
}

export function normalizeSemaphoreProof(proof) {
  if (!proof || !Array.isArray(proof.points) || proof.points.length !== 8) {
    throw new Error('Invalid Semaphore proof shape')
  }

  return {
    merkleTreeDepth: Number(proof.merkleTreeDepth),
    merkleTreeRoot: toNumericString(proof.merkleTreeRoot, 'Merkle root'),
    nullifier: toNumericString(proof.nullifier, 'nullifier'),
    message: toNumericString(proof.message, 'message'),
    scope: toNumericString(proof.scope, 'scope'),
    points: proof.points.map((point) => toNumericString(point, 'proof point')),
  }
}
