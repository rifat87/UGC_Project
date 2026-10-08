import fs from "node:fs"

const source =
  fs.readFileSync(
    process.argv[2],
    "utf8",
  )

const bufferImport =
  source.indexOf(
    'from "buffer"',
  )

const globalAssignment =
  source.indexOf(
    ".Buffer = Buffer",
  )

const circomDynamic =
  source.indexOf(
    'await import(\n    "circomlibjs"',
  )

const snarkDynamic =
  source.indexOf(
    'await import(\n    "snarkjs"',
  )

if (
  bufferImport < 0 ||
  globalAssignment < 0 ||
  circomDynamic < 0 ||
  snarkDynamic < 0
) {
  throw new Error(
    "Expected Buffer/dynamic-import bootstrap not found",
  )
}

if (
  !(
    bufferImport <
      globalAssignment &&
    globalAssignment <
      circomDynamic &&
    globalAssignment <
      snarkDynamic
  )
) {
  throw new Error(
    "Buffer is not initialized before crypto modules",
  )
}

if (
  /from\s+["']circomlibjs["']/.test(
    source,
  )
) {
  throw new Error(
    "Static circomlibjs import remains",
  )
}

if (
  /from\s+["']snarkjs["']/.test(
    source,
  )
) {
  throw new Error(
    "Static snarkjs import remains",
  )
}

console.log(
  "BUFFER_INITIALIZED_BEFORE_CRYPTO_IMPORTS=PASS",
)

console.log(
  "STATIC_CIRCOMLIBJS_IMPORT=NO",
)

console.log(
  "STATIC_SNARKJS_IMPORT=NO",
)
