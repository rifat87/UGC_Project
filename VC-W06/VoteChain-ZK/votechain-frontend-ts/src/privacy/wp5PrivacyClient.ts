import type {
  Wp5Authorization,
  Wp5PublicConfig,
} from "@/services/api"

export interface Wp5EncryptedBallot {
  a: [string, string]
  b: [
    [string, string],
    [string, string],
  ]
  c: [string, string]
  nullifier: string
  rx: string[]
  ry: string[]
  sx: string[]
  sy: string[]
}

type WorkerResponse = {
  id: number
  ok: boolean
  result?: unknown
  error?: string
}

let worker:
  Worker | null =
    null

let requestId = 0

const pending =
  new Map<
    number,
    {
      resolve:
        (value: unknown) =>
          void
      reject:
        (reason?: unknown) =>
          void
    }
  >()

function getWorker() {
  if (worker) {
    return worker
  }

  worker =
    new Worker(
      new URL(
        "./wp5Privacy.worker.ts",
        import.meta.url,
      ),
      {
        type: "module",
        name:
          "votechain-wp5-privacy",
      },
    )

  worker.onmessage =
    (
      event:
        MessageEvent<WorkerResponse>,
    ) => {
      const message =
        event.data

      const request =
        pending.get(
          message.id,
        )

      if (!request) {
        return
      }

      pending.delete(
        message.id,
      )

      if (message.ok) {
        request.resolve(
          message.result,
        )
      } else {
        request.reject(
          new Error(
            message.error ||
            "WP5 privacy worker failed",
          ),
        )
      }
    }

  worker.onerror =
    event => {
      const error =
        new Error(
          event.message ||
          "WP5 privacy worker crashed",
        )

      for (
        const request
        of pending.values()
      ) {
        request.reject(
          error,
        )
      }

      pending.clear()

      worker?.terminate()
      worker = null
    }

  return worker
}

function callWorker<T>(
  message:
    Record<string, unknown>,
) {
  const activeWorker =
    getWorker()

  requestId += 1

  const id =
    requestId

  return new Promise<T>(
    (
      resolve,
      reject,
    ) => {
      pending.set(
        id,
        {
          resolve:
            value =>
              resolve(
                value as T,
              ),
          reject,
        },
      )

      activeWorker.postMessage({
        id,
        ...message,
      })
    },
  )
}

export async function beginWp5Authorization() {
  return callWorker<{
    credentialPublicKey:
      JsonWebKey
  }>({
    type:
      "BEGIN_AUTH",
  })
}

export async function prepareWp5EncryptedBallot(
  candidateId: number,
  authorization:
    Wp5Authorization,
  publicConfig:
    Wp5PublicConfig,
) {
  return callWorker<Wp5EncryptedBallot>({
    type:
      "PREPARE_BALLOT",
    candidateId,
    authorization,
    publicConfig,
  })
}

export function resetWp5PrivacySession() {
  if (!worker) {
    return
  }

  worker.terminate()
  worker = null

  const error =
    new Error(
      "WP5 privacy session cleared",
    )

  for (
    const request
    of pending.values()
  ) {
    request.reject(
      error,
    )
  }

  pending.clear()
}
