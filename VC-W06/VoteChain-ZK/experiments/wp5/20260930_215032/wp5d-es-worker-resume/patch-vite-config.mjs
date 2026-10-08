import fs from "node:fs"

const file =
  process.argv[2]

let source =
  fs.readFileSync(
    file,
    "utf8",
  )

if (
  /worker\s*:\s*\{[\s\S]*?format\s*:\s*["']es["']/.test(
    source,
  )
) {
  console.log(
    "VITE_WORKER_FORMAT_PATCH=ALREADY_PRESENT",
  )

  process.exit(0)
}

/*
 * VoteChain frontend currently uses:
 *
 * defineConfig(({ mode }) => {
 *   ...
 *   return {
 *     plugins: ...
 *
 * Insert worker.format immediately after that return object opens.
 */
const anchor =
  /(\n\s*return\s*\{\s*\n)(\s*plugins\s*:)/

if (!anchor.test(source)) {
  throw new Error(
    "Callback-style Vite return-object anchor not found",
  )
}

source =
  source.replace(
    anchor,
    `$1    worker: {
      format: "es",
    },
$2`,
  )

fs.writeFileSync(
  file,
  source,
)

console.log(
  "VITE_WORKER_FORMAT_PATCH=PASS",
)
