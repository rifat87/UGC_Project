const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

async function main() {
    const [
        front,
        inputFile,
        wasmFile,
        zkeyFile,
        vkeyFile,
        outDir,
    ] = process.argv.slice(2);

    console.log(`FRONT=${front}`);
    console.log(`INPUT=${inputFile}`);
    console.log(`WASM=${wasmFile}`);
    console.log(`ZKEY=${zkeyFile}`);
    console.log(`VKEY=${vkeyFile}`);
    console.log(`OUT=${outDir}`);

    for (const [label, file] of [
        ["INPUT", inputFile],
        ["WASM", wasmFile],
        ["ZKEY", zkeyFile],
        ["VKEY", vkeyFile],
    ]) {
        console.log(
            `${label}_EXISTS=${fs.existsSync(file)}`
        );
    }

    const req = createRequire(
        path.join(
            front,
            "package.json",
        )
    );

    const snarkjs = req("snarkjs");

    const input = JSON.parse(
        fs.readFileSync(
            inputFile,
            "utf8",
        )
    );

    const vkey = JSON.parse(
        fs.readFileSync(
            vkeyFile,
            "utf8",
        )
    );

    fs.mkdirSync(
        outDir,
        {
            recursive: true,
        }
    );

    const witnessFile = path.join(
        outDir,
        "probe.wtns",
    );

    console.log("STAGE=WITNESS_BEGIN");

    await snarkjs.wtns.calculate(
        input,
        wasmFile,
        witnessFile,
    );

    console.log("STAGE=WITNESS_PASS");

    console.log("STAGE=PROVE_BEGIN");

    const result =
        await snarkjs.groth16.prove(
            zkeyFile,
            witnessFile,
        );

    console.log("STAGE=PROVE_PASS");

    console.log("STAGE=VERIFY_BEGIN");

    const verified =
        await snarkjs.groth16.verify(
            vkey,
            result.publicSignals,
            result.proof,
        );

    console.log(
        `PROBE_VERIFY=${verified ? "PASS" : "FAIL"}`
    );

    console.log(
        `PUBLIC_SIGNAL_COUNT=${result.publicSignals.length}`
    );

    fs.writeFileSync(
        path.join(
            outDir,
            "proof.json",
        ),
        JSON.stringify(
            result.proof,
            null,
            2,
        ) + "\n",
    );

    fs.writeFileSync(
        path.join(
            outDir,
            "public.json",
        ),
        JSON.stringify(
            result.publicSignals,
            null,
            2,
        ) + "\n",
    );

    if (!verified) {
        process.exit(3);
    }
}

main().catch((error) => {
    console.error(
        "PROBE_ERROR="
        + (
            error?.stack
            || error?.message
            || String(error)
        )
    );

    process.exit(2);
});
