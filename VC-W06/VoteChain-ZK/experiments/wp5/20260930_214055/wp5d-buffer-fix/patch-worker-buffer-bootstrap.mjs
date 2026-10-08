import fs from "node:fs"

const file =
  process.argv[2]

let source =
  fs.readFileSync(
    file,
    "utf8",
  )

const marker =
  "const MAX ="

const markerIndex =
  source.indexOf(
    marker,
  )

if (markerIndex < 0) {
  throw new Error(
    "Worker MAX marker not found",
  )
}

if (
  !source.startsWith(
    '/// <reference lib="webworker" />',
  )
) {
  throw new Error(
    "Unexpected worker prelude",
  )
}

const rest =
  source.slice(
    markerIndex,
  )

const prelude = `/// <reference lib="webworker" />

import {
  Buffer,
} from "buffer"

import appProfile from "./wp5-application-profile.json"

import type {
  Wp5Authorization,
  Wp5PublicConfig,
} from "../services/api"

/*
 * circomlibjs/ffjavascript still exercise Buffer-backed code
 * in the browser bundle.
 *
 * This assignment MUST happen before circomlibjs/snarkjs are
 * evaluated, so those packages are loaded dynamically below.
 */
;(globalThis as any).Buffer = Buffer

const {
  buildBabyjub,
  buildPoseidon,
} =
  await import(
    "circomlibjs"
  )

const {
  groth16,
} =
  await import(
    "snarkjs"
  )

`

source =
  prelude +
  rest

fs.writeFileSync(
  file,
  source,
)

console.log(
  "WORKER_BUFFER_BOOTSTRAP_PATCH=PASS",
)
