import fs from "node:fs"

const source =
  fs.readFileSync(
    process.argv[2],
    "utf8",
  )

const bufferAssignment =
  source.indexOf(
    ".Buffer = Buffer",
  )

const lazyPoseidon =
  source.indexOf(
    "async function buildPoseidon()",
  )

const lazyBabyjub =
  source.indexOf(
    "async function buildBabyjub()",
  )

const lazyGroth16 =
  source.indexOf(
    "async function loadGroth16()",
  )

const maxMarker =
  source.indexOf(
    "const MAX =",
  )

if (
  bufferAssignment < 0 ||
  lazyPoseidon < 0 ||
  lazyBabyjub < 0 ||
  lazyGroth16 < 0
) {
  throw new Error(
    "Expected lazy crypto bootstrap missing",
  )
}

if (
  !(
    bufferAssignment <
      lazyPoseidon &&
    bufferAssignment <
      lazyBabyjub &&
    bufferAssignment <
      lazyGroth16
  )
) {
  throw new Error(
    "Buffer assignment does not precede crypto loaders",
  )
}

/*
 * Everything before const MAX is module initialization.
 * It may contain async function bodies, but there must no longer
 * be destructuring assignment from top-level await import().
 */
const prelude =
  source.slice(
    0,
    maxMarker,
  )

if (
  /\}\s*=\s*await\s+import\s*\(/m.test(
    prelude,
  )
) {
  throw new Error(
    "Top-level await-import assignment remains",
  )
}

if (
  /from\s+["']circomlibjs["']/.test(
    source,
  ) ||
  /from\s+["']snarkjs["']/.test(
    source,
  )
) {
  throw new Error(
    "Static crypto import returned",
  )
}

console.log(
  "BUFFER_BEFORE_CRYPTO_LOADERS=PASS",
)

console.log(
  "TOP_LEVEL_AWAIT_CRYPTO_IMPORTS=0",
)

console.log(
  "STATIC_CIRCOMLIBJS_IMPORT=NO",
)

console.log(
  "STATIC_SNARKJS_IMPORT=NO",
)

console.log(
  "LAZY_CRYPTO_IMPORTS=PASS",
)
