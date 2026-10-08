import fs from "node:fs"

const file =
  process.argv[2]

let source =
  fs.readFileSync(
    file,
    "utf8",
  )

/*
 * If an explicit worker.format already exists,
 * normalize it to ES.
 */
if (
  /worker\s*:\s*\{[\s\S]*?format\s*:/.test(
    source,
  )
) {
  source =
    source.replace(
      /(worker\s*:\s*\{[\s\S]*?format\s*:\s*)["'`](?:iife|es)["'`]/,
      '$1"es"',
    )

  fs.writeFileSync(
    file,
    source,
  )

  console.log(
    "VITE_WORKER_FORMAT_PATCH=UPDATED_EXISTING",
  )

  process.exit(0)
}

/*
 * Current VoteChain frontend uses defineConfig({...}).
 * Add the worker configuration at the top level.
 */
const match =
  source.match(
    /defineConfig\s*\(\s*\{/,
  )

if (!match) {
  throw new Error(
    "Unsupported vite.config shape. No source modification performed beyond backup.",
  )
}

const insertAt =
  match.index +
  match[0].length

source =
  source.slice(
    0,
    insertAt,
  ) +
  `
  worker: {
    format: "es",
  },
` +
  source.slice(
    insertAt,
  )

fs.writeFileSync(
  file,
  source,
)

console.log(
  "VITE_WORKER_FORMAT_PATCH=INSERTED",
)
