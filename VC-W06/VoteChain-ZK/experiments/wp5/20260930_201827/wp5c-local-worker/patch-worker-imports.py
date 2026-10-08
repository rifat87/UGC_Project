from pathlib import Path
import sys

p = Path(sys.argv[1])
s = p.read_text(encoding="utf-8")

old_imports = '''import * as circomlibjs from "circomlibjs"
import * as snarkjs from "snarkjs"
'''

new_imports = '''import {
  buildBabyjub,
  buildPoseidon,
} from "circomlibjs"
import {
  groth16,
} from "snarkjs"
'''

if old_imports in s:
    s = s.replace(
        old_imports,
        new_imports,
        1,
    )
elif new_imports not in s:
    raise SystemExit(
        "Expected crypto import block not found"
    )

old_runtime = '''const buildPoseidon =
  (circomlibjs as any).buildPoseidon ??
  (circomlibjs as any).default?.buildPoseidon

const buildBabyjub =
  (circomlibjs as any).buildBabyjub ??
  (circomlibjs as any).default?.buildBabyjub

const groth16 =
  (snarkjs as any).groth16 ??
  (snarkjs as any).default?.groth16

if (
  !buildPoseidon ||
  !buildBabyjub ||
  !groth16
) {
  throw new Error(
    "WP5 crypto runtime is unavailable",
  )
}

'''

if old_runtime in s:
    s = s.replace(
        old_runtime,
        "",
        1,
    )
elif ".default?.buildPoseidon" in s or ".default?.groth16" in s:
    raise SystemExit(
        "Unexpected fallback-runtime shape"
    )

p.write_text(
    s,
    encoding="utf-8",
)

print(
    "WORKER_NAMED_IMPORT_PATCH=PASS"
)
