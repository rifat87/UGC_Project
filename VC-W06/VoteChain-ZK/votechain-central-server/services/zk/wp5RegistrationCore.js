export function isWp5GroupIndexDuplicate(
  error,
) {
  return Boolean(
    error &&
    Number(error.code) ===
      11000 &&
    error.keyPattern &&
    Object.prototype
      .hasOwnProperty
      .call(
        error.keyPattern,
        'wp5GroupIndex',
      ),
  )
}

/*
 * Allocation itself is intentionally side-effect free.
 *
 * The database unique index is the serialization point. If two concurrent
 * requests observe the same next index, one insert wins and the loser
 * retries from the newly committed maximum. Failed inserts therefore do
 * not reserve an index and cannot create Merkle gaps.
 */
export async function saveVoterWithWp5IndexRetry({
  allocateIndex,
  saveAtIndex,
  maxAttempts = 32,
}) {
  if (
    typeof allocateIndex !==
      'function' ||
    typeof saveAtIndex !==
      'function'
  ) {
    throw new Error(
      'WP5 registration retry callbacks are required',
    )
  }

  if (
    !Number.isSafeInteger(
      maxAttempts,
    ) ||
    maxAttempts < 1 ||
    maxAttempts > 128
  ) {
    throw new Error(
      'Invalid WP5 registration retry limit',
    )
  }

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt += 1
  ) {
    const index =
      await allocateIndex()

    try {
      return await saveAtIndex(
        index,
      )
    } catch (error) {
      if (
        !isWp5GroupIndexDuplicate(
          error,
        )
      ) {
        throw error
      }

      if (
        attempt ===
        maxAttempts
      ) {
        throw new Error(
          'WP5 registration index allocation remained contended',
        )
      }
    }
  }

  throw new Error(
    'WP5 registration index allocation failed',
  )
}
