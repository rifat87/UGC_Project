export const ELECTION_STATES = Object.freeze({
  0: 'Registration',
  1: 'Active',
  2: 'Ended',
})

export function mapElectionState(value) {
  const numericState = Number(value)
  const state = ELECTION_STATES[numericState]
  if (!state) {
    throw new Error(`Unknown election state: ${value}`)
  }
  return state
}
