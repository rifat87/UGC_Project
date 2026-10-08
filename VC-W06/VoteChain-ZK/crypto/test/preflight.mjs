import assert from "node:assert/strict";
import { buildBabyjub, buildPoseidon } from "circomlibjs";
import { PROFILE } from "../src/profile.mjs";

const poseidon = await buildPoseidon();
const F = poseidon.F;

const h = BigInt(F.toObject(poseidon([1n, 0n, 0n])).toString());

assert.equal(
  h.toString(),
  "16319005924338521988144249782199320915969277491928916027259324394544057385749"
);

const babyJub = await buildBabyjub();

assert.ok(babyJub.Base8);
assert.ok(babyJub.subOrder);
assert.equal(PROFILE.trusteeThreshold, 3);
assert.equal(PROFILE.trusteeCount, 5);

const G = babyJub.Base8;
const twoG = babyJub.mulPointEscalar(G, 2n);
const onePlusOne = babyJub.addPoint(G, G);

assert.ok(
  babyJub.F.eq(twoG[0], onePlusOne[0]) &&
  babyJub.F.eq(twoG[1], onePlusOne[1])
);

console.log("POSEIDON_REFERENCE_VECTOR=PASS");
console.log("BABYJUB_BASE8=PASS");
console.log("BABYJUB_POINT_ARITHMETIC=PASS");
console.log("THRESHOLD_PROFILE=3_OF_5");
console.log("WP2_CRYPTO_PREFLIGHT=PASS");
