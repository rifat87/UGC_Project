import fs from "node:fs";

const pkg =
    await import("circomlibjs");

const pc =
    pkg.poseidonContract ??
    pkg.default?.poseidonContract;

if (
    !pc ||
    typeof pc.createCode !== "function" ||
    typeof pc.generateABI !== "function"
) {
    throw new Error(
        "circomlibjs poseidonContract API unavailable"
    );
}

const [
    ,,
    binaryPath,
    abiPath
] = process.argv;

const code =
    pc.createCode(5);

if (
    typeof code !== "string"
) {
    throw new Error(
        "Unexpected Poseidon creation-code type"
    );
}

const hex =
    code.startsWith("0x")
        ? code.slice(2)
        : code;

if (
    hex.length === 0 ||
    hex.length % 2 !== 0
) {
    throw new Error(
        "Invalid Poseidon creation bytecode"
    );
}

fs.writeFileSync(
    binaryPath,
    Buffer.from(
        hex,
        "hex"
    )
);

fs.writeFileSync(
    abiPath,
    JSON.stringify(
        pc.generateABI(5),
        null,
        2
    ) + "\n"
);

console.log(
    `POSEIDON5_CREATION_BYTES=${hex.length / 2}`
);

console.log(
    "POSEIDON5_GENERATION=PASS"
);
