import fs from "node:fs"

const file =
  process.argv[2]

let source =
  fs.readFileSync(
    file,
    "utf8",
  )

const start =
  source.indexOf(
    "const {\n  buildBabyjub,"
  )

const marker =
  source.indexOf(
    "const MAX ="
  )

if (
  start < 0 ||
  marker < 0 ||
  marker <= start
) {
  throw new Error(
    "Expected current crypto-import block not found",
  )
}

const currentBlock =
  source.slice(
    start,
    marker,
  )

if (
  !currentBlock.includes(
    'await import('
  ) ||
  !currentBlock.includes(
    '"circomlibjs"'
  ) ||
  !currentBlock.includes(
    '"snarkjs"'
  )
) {
  throw new Error(
    "Current top-level dynamic-import block has unexpected shape",
  )
}

const replacement = `/*
 * Lazy browser crypto loading.
 *
 * Buffer is assigned above before either dependency is evaluated.
 * Keeping the dynamic imports inside async functions avoids
 * top-level await while preserving browser-first initialization.
 */
async function buildPoseidon() {
  const circomlib: any =
    await import(
      "circomlibjs"
    )

  return circomlib.buildPoseidon()
}

async function buildBabyjub() {
  const circomlib: any =
    await import(
      "circomlibjs"
    )

  return circomlib.buildBabyjub()
}

async function loadGroth16() {
  const snarkjs: any =
    await import(
      "snarkjs"
    )

  return snarkjs.groth16
}

const groth16: any = {
  async fullProve(
    ...args: any[]
  ) {
    const api =
      await loadGroth16()

    return api.fullProve(
      ...args
    )
  },

  async verify(
    ...args: any[]
  ) {
    const api =
      await loadGroth16()

    return api.verify(
      ...args
    )
  },

  async exportSolidityCallData(
    ...args: any[]
  ) {
    const api =
      await loadGroth16()

    return api.exportSolidityCallData(
      ...args
    )
  },
}

`

source =
  source.slice(
    0,
    start,
  ) +
  replacement +
  source.slice(
    marker,
  )

fs.writeFileSync(
  file,
  source,
)

console.log(
  "WORKER_NO_TOP_LEVEL_AWAIT_PATCH=PASS",
)
