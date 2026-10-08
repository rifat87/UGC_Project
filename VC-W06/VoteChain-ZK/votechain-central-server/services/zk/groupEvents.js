function eventPosition(event) {
  return [
    Number(event.blockNumber ?? 0),
    Number(event.index ?? event.logIndex ?? 0),
  ]
}

function compareEvents(left, right) {
  const [leftBlock, leftIndex] = eventPosition(left)
  const [rightBlock, rightIndex] = eventPosition(right)
  return leftBlock - rightBlock || leftIndex - rightIndex
}

export function commitmentRecordsFromRegistrationEvents(events) {
  const ordered = [...events].sort(compareEvents)
  return ordered.map((event, index) => {
    const rawCommitment = event?.args?.identityCommitment ?? event?.args?.[0]
    if (rawCommitment === undefined || rawCommitment === null) {
      throw new Error(`VoterCommitmentRegistered event at group index ${index} is missing identityCommitment`)
    }

    return {
      zkGroupIndex: index,
      zkIdentityCommitment: BigInt(rawCommitment).toString(),
    }
  })
}
