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

    await snarkjs.wtns.calculate(
        input,
        wasmFile,
        witnessFile,
    );

    const result =
        await snarkjs.groth16.prove(
            zkeyFile,
            witnessFile,
        );

    const verified =
        await snarkjs.groth16.verify(
            vkey,
            result.publicSignals,
            result.proof,
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

    console.log(
        `PROBE_VERIFY=${verified ? "PASS" : "FAIL"}`
    );

    console.log(
        `PUBLIC_SIGNAL_COUNT=${result.publicSignals.length}`
    );

    if (!verified) {
        process.exit(3);
    }
}

main().catch((error) => {
    console.error(
        error?.stack
        || error?.message
        || String(error)
    );

    process.exit(2);
});
