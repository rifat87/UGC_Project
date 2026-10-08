import fs from "node:fs"

const source =
  fs.readFileSync(
    process.argv[2],
    "utf8",
  )

const matches =
  source.match(
    /worker\s*:\s*\{[\s\S]*?format\s*:\s*["']es["']/g,
  ) ?? []

console.log(
  `ES_WORKER_CONFIG_MATCHES=${matches.length}`,
)

if (
  matches.length !== 1
) {
  throw new Error(
    "Expected exactly one worker.format='es' configuration",
  )
}

console.log(
  "VITE_ES_WORKER_FORMAT=PASS",
)
