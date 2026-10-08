import fs from "node:fs"

const [
  ,
  ,
  cdpBaseUrl,
  targetUrlFragment,
  outputPath,
] = process.argv

const sleep =
  milliseconds =>
    new Promise(
      resolve =>
        setTimeout(
          resolve,
          milliseconds,
        ),
    )

async function findPageTarget() {
  for (
    let attempt = 0;
    attempt < 120;
    attempt += 1
  ) {
    try {
      const response =
        await fetch(
          `${cdpBaseUrl}/json/list`,
        )

      if (response.ok) {
        const targets =
          await response.json()

        const target =
          targets.find(
            item =>
              item.type ===
                "page" &&
              String(
                item.url,
              ).includes(
                targetUrlFragment,
              ),
          )

        if (target) {
          return target
        }
      }
    } catch {
      // Chrome may still be starting.
    }

    await sleep(500)
  }

  throw new Error(
    "WP5D browser page target not found",
  )
}

const target =
  await findPageTarget()

if (
  typeof WebSocket !==
  "function"
) {
  throw new Error(
    "Node global WebSocket unavailable",
  )
}

const ws =
  new WebSocket(
    target.webSocketDebuggerUrl,
  )

await new Promise(
  (
    resolve,
    reject,
  ) => {
    ws.addEventListener(
      "open",
      resolve,
      {
        once: true,
      },
    )

    ws.addEventListener(
      "error",
      () =>
        reject(
          new Error(
            "CDP WebSocket connection failed",
          ),
        ),
      {
        once: true,
      },
    )
  },
)

let messageId = 0

const pending =
  new Map()

ws.addEventListener(
  "message",
  event => {
    let text

    if (
      typeof event.data ===
      "string"
    ) {
      text =
        event.data
    } else {
      text =
        Buffer.from(
          event.data,
        ).toString(
          "utf8",
        )
    }

    const message =
      JSON.parse(text)

    if (
      !message.id ||
      !pending.has(
        message.id,
      )
    ) {
      return
    }

    const {
      resolve,
      reject,
    } =
      pending.get(
        message.id,
      )

    pending.delete(
      message.id,
    )

    if (message.error) {
      reject(
        new Error(
          JSON.stringify(
            message.error,
          ),
        ),
      )
    } else {
      resolve(
        message.result,
      )
    }
  },
)

function send(
  method,
  params = {},
) {
  messageId += 1

  const id =
    messageId

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      pending.set(
        id,
        {
          resolve,
          reject,
        },
      )

      ws.send(
        JSON.stringify({
          id,
          method,
          params,
        }),
      )
    },
  )
}

async function evaluate(
  expression,
) {
  const response =
    await send(
      "Runtime.evaluate",
      {
        expression,
        returnByValue:
          true,
        awaitPromise:
          true,
      },
    )

  if (
    response
      .exceptionDetails
  ) {
    throw new Error(
      "Runtime.evaluate exception",
    )
  }

  return response
    .result
    .value
}

await send(
  "Runtime.enable",
)

await send(
  "Page.enable",
)

let finalStatus =
  null

/*
 * Maximum browser wait:
 * 600 iterations × 1 second = 10 minutes.
 *
 * A Groth16 browser proof can take materially longer
 * than ordinary UI work, so do not use DOM-dump timing.
 */
for (
  let iteration = 0;
  iteration < 600;
  iteration += 1
) {
  const status =
    await evaluate(`
      document.body
        ? (
            document.body.dataset.wp5dStatus ||
            "MISSING"
          )
        : "NO_BODY"
    `)

  if (
    iteration % 10 === 0
  ) {
    console.log(
      `CDP_STATUS_${iteration}=${status}`,
    )
  }

  if (
    status === "PASS" ||
    status === "FAIL"
  ) {
    finalStatus =
      status
    break
  }

  await sleep(1000)
}

if (!finalStatus) {
  const bodyText =
    await evaluate(`
      document.body
        ? document.body.innerText
        : "NO_BODY"
    `)

  throw new Error(
    `Browser runtime timeout. Body: ${bodyText}`,
  )
}

const encoded =
  await evaluate(`
    document.body.dataset.wp5dResult || ""
  `)

if (!encoded) {
  throw new Error(
    "Browser reached terminal state without wp5dResult",
  )
}

const decoded =
  Buffer.from(
    encoded,
    "base64",
  ).toString(
    "utf8",
  )

const result =
  JSON.parse(
    decoded,
  )

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    result,
    null,
    2,
  ) + "\n",
)

console.log(
  `BROWSER_RESULT_STATUS=${result.status}`,
)

if (
  finalStatus !==
    "PASS" ||
  result.status !==
    "PASS"
) {
  console.log(
    `BROWSER_RESULT_ERROR=${result.error || "UNKNOWN"}`
  )

  ws.close()

  process.exitCode = 3
} else {
  console.log(
    "BROWSER_WORKER_RUNTIME=PASS",
  )

  console.log(
    `BROWSER_AUTHORIZATION_MS=${result.authorizationMs}`,
  )

  console.log(
    `BROWSER_LOCAL_PRIVACY_MS=${result.privacyMs}`,
  )

  console.log(
    `BROWSER_OVERALL_MS=${result.overallMs}`,
  )

  console.log(
    "CANDIDATE_PLAINTEXT_IN_BALLOT_OBJECT=FALSE",
  )

  ws.close()
}
