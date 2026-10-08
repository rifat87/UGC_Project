import Election
  from "../../models/Election.js"

import ElectionRuntimeState
  from "../../models/ElectionRuntimeState.js"


const RUNTIME_STATE_ID =
  "current"


function runtimeError(
  code,
  message,
) {
  const error =
    new Error(
      message,
    )

  error.code =
    code

  return error
}


export async function
runtimePointerModeEnabled() {
  const state =
    await ElectionRuntimeState
      .exists({
        _id:
          RUNTIME_STATE_ID,
      })

  return Boolean(
    state,
  )
}


export async function
getRuntimeElectionContext({
  statuses =
    undefined,

  electionId =
    undefined,

  lean =
    false,
} = {}) {
  const state =
    await ElectionRuntimeState
      .findById(
        RUNTIME_STATE_ID,
      )
      .lean()


  if (state) {
    if (
      !state.currentElection
    ) {
      return {
        mode:
          "pointer",

        state,

        election:
          null,
      }
    }


    let query =
      Election.findById(
        state.currentElection,
      )


    if (lean) {
      query =
        query.lean()
    }


    const election =
      await query


    if (!election) {
      throw runtimeError(
        "RUNTIME_POINTER_DANGLING",
        "The election runtime pointer references a missing election",
      )
    }


    if (
      electionId !==
        undefined &&
      electionId !==
        null &&
      String(
        election.electionId,
      ) !==
        String(
          electionId,
        )
    ) {
      return {
        mode:
          "pointer",

        state,

        election:
          null,
      }
    }


    if (
      Array.isArray(
        statuses,
      ) &&
      statuses.length >
        0 &&
      !statuses.includes(
        election.status,
      )
    ) {
      return {
        mode:
          "pointer",

        state,

        election:
          null,
      }
    }


    return {
      mode:
        "pointer",

      state,

      election,
    }
  }


  const filter = {
    lifecycleSlot:
      "current",
  }


  if (
    electionId !==
      undefined &&
    electionId !==
      null
  ) {
    filter.electionId =
      String(
        electionId,
      )
  }


  if (
    Array.isArray(
      statuses,
    ) &&
    statuses.length >
      0
  ) {
    filter.status = {
      $in:
        statuses,
    }
  }


  let query =
    Election
      .findOne(
        filter,
      )
      .sort({
        createdAt:
          -1,
      })


  if (lean) {
    query =
      query.lean()
  }


  return {
    mode:
      "legacy",

    state:
      null,

    election:
      await query,
  }
}


export async function
getRuntimeElection(
  options = {},
) {
  const {
    election,
  } =
    await getRuntimeElectionContext(
      options,
    )

  return election
}


export async function
claimRuntimeElection(
  election,
) {
  if (
    !election?._id
  ) {
    throw runtimeError(
      "INVALID_RUNTIME_ELECTION",
      "A persisted election is required before claiming the runtime pointer",
    )
  }


  const state =
    await ElectionRuntimeState
      .findOneAndUpdate(
        {
          _id:
            RUNTIME_STATE_ID,

          currentElection:
            null,
        },
        {
          $set: {
            currentElection:
              election._id,
          },
        },
        {
          new:
            true,
        },
      )


  if (!state) {
    const pointerMode =
      await runtimePointerModeEnabled()


    if (!pointerMode) {
      throw runtimeError(
        "RUNTIME_POINTER_NOT_INITIALIZED",
        "The election runtime pointer has not been initialized",
      )
    }


    return false
  }


  return true
}


export async function
clearRuntimeElectionIfMatches(
  election,
) {
  if (
    !election?._id
  ) {
    return false
  }


  const result =
    await ElectionRuntimeState
      .updateOne(
        {
          _id:
            RUNTIME_STATE_ID,

          currentElection:
            election._id,
        },
        {
          $set: {
            currentElection:
              null,

            updatedAt:
              new Date(),
          },
        },
      )


  return (
    result.matchedCount ===
      1
  )
}
