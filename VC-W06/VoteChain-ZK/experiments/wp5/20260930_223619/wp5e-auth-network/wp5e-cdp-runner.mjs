import fs from "node:fs"

const [
  ,
  ,
  cdpBase,
  outputPath,
] = process.argv

const sleep =
  ms =>
    new Promise(
      resolve =>
        setTimeout(
          resolve,
          ms,
        ),
    )

let target

for (
  let attempt = 0;
  attempt < 120;
  attempt += 1
) {
  const response =
    await fetch(
      `${cdpBase}/json/list`,
    )

  const targets =
    await response.json()

  target =
    targets.find(
      item =>
        item.type ===
          "page" &&
        String(
          item.url,
        ).includes(
          "wp5e-runtime.html",
        ),
    )

  if (target) break

  await sleep(500)
}

if (!target) {
  throw new Error(
    "WP5E browser target missing",
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
            "CDP websocket failed",
          ),
        ),
      {
        once: true,
      },
    )
  },
)

let nextId = 0

const pending =
  new Map()

ws.addEventListener(
  "message",
  event => {
    const message =
      JSON.parse(
        typeof event.data ===
          "string"
          ? event.data
          : Buffer.from(
              event.data,
            ).toString(
              "utf8",
            ),
      )

    if (
      !message.id ||
      !pending.has(
        message.id,
      )
    ) {
      return
    }

    const item =
      pending.get(
        message.id,
      )

    pending.delete(
      message.id,
    )

    if (message.error) {
      item.reject(
        new Error(
          JSON.stringify(
            message.error,
          ),
        ),
      )
    } else {
      item.resolve(
        message.result,
      )
    }
  },
)

function send(
  method,
  params = {},
) {
  const id =
    ++nextId

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
  const result =
    await send(
      "Runtime.evaluate",
      {
        expression,
        returnByValue:
          true,
      },
    )

  return result.result.value
}

await send(
  "Runtime.enable",
)

let status =
  "RUNNING"

for (
  let iteration = 0;
  iteration < 600;
  iteration += 1
) {
  status =
    await evaluate(`
      document.body
        ? (
            document.body.dataset.wp5eStatus ||
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
    break
  }

  await sleep(1000)
}

const encoded =
  await evaluate(`
    document.body.dataset.wp5eResult || ""
  `)

if (!encoded) {
  throw new Error(
    `WP5E result missing; terminal status=${status}`,
  )
}

const result =
  JSON.parse(
    Buffer.from(
      encoded,
      "base64",
    ).toString(
      "utf8",
    ),
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
  result.status !==
  "PASS"
) {
  console.log(
    `BROWSER_RESULT_ERROR=${result.error}`,
  )

  ws.close()

  process.exitCode = 3
} else {
  console.log(
    "BACKEND_HTTP_TO_BROWSER_WORKER=PASS",
  )

  console.log(
    `BACKEND_AUTHORIZATION_MS=${result.authorizationMs}`,
  )

  console.log(
    `BROWSER_LOCAL_PRIVACY_MS=${result.privacyMs}`,
  )

  ws.close()
}
