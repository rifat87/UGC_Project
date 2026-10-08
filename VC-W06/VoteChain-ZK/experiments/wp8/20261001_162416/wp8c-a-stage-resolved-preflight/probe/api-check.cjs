const path = require("path");
const { createRequire } = require("module");

const front = process.argv[2];

const req = createRequire(
    path.join(
        front,
        "package.json",
    )
);

const snarkjs = req("snarkjs");

const result = {
    snarkjsKeys: Object.keys(snarkjs).sort(),
    wtnsKeys: Object.keys(snarkjs.wtns || {}).sort(),
    groth16Keys: Object.keys(snarkjs.groth16 || {}).sort(),
    hasWtnsCalculate:
        typeof snarkjs?.wtns?.calculate === "function",
    hasGroth16Prove:
        typeof snarkjs?.groth16?.prove === "function",
    hasGroth16Verify:
        typeof snarkjs?.groth16?.verify === "function",
};

console.log(
    JSON.stringify(
        result,
        null,
        2,
    )
);

if (
    !result.hasWtnsCalculate
    || !result.hasGroth16Prove
    || !result.hasGroth16Verify
) {
    process.exit(2);
}
