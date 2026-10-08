const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

function ms(start, end) {
    return Number(end - start) / 1e6;
}

function rssBytes() {
    return process.memoryUsage().rss;
}

function maxRssKiB() {
    try {
        const x = process.resourceUsage().maxRSS;
        return Number.isFinite(x) ? x : null;
    } catch {
        return null;
    }
}

function compactBytes(value) {
    return Buffer.byteLength(
        JSON.stringify(value),
        "utf8",
    );
}

async function main() {
    const [
        front,
        inputFile,
        wasmFile,
        zkeyFile,
        vkeyFile,
        outputRoot,
        campaignId,
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
        outputRoot,
        {
            recursive: true,
        }
    );

    const schedule = [
        {
            trialIndex: 1,
            warmup: true,
        },
        {
            trialIndex: 2,
            warmup: false,
        },
        {
            trialIndex: 3,
            warmup: false,
        },
        {
            trialIndex: 4,
            warmup: false,
        },
    ];

    const bits = Array.isArray(input.bit)
        ? input.bit.map(Number)
        : [];

    const selectedSlots = bits
        .map((v, i) => v === 1 ? i : -1)
        .filter((v) => v >= 0);

    const candidateSlot =
        selectedSlots.length === 1
            ? selectedSlots[0]
            : null;

    const candidateCount =
        Number(input.candidateCount);

    const depth =
        Array.isArray(input.siblings)
            ? input.siblings.length
            : null;

    const rows = [];

    for (const trial of schedule) {
        const dir = path.join(
            outputRoot,
            `trial-${String(trial.trialIndex).padStart(2, "0")}`,
        );

        fs.mkdirSync(
            dir,
            {
                recursive: true,
            }
        );

        const witnessFile = path.join(
            dir,
            "witness.wtns",
        );

        console.log("");
        console.log(
            "------------------------------------------------------------"
        );

        console.log(
            `TRIAL=${trial.trialIndex}`
        );

        console.log(
            `WARMUP=${trial.warmup ? "YES" : "NO"}`
        );

        if (global.gc) {
            global.gc();
        }

        const rssStart = rssBytes();

        console.log("STAGE=WITNESS_BEGIN");

        const witnessStart =
            process.hrtime.bigint();

        await snarkjs.wtns.calculate(
            input,
            wasmFile,
            witnessFile,
        );

        const witnessEnd =
            process.hrtime.bigint();

        const witnessMs =
            ms(
                witnessStart,
                witnessEnd,
            );

        const rssAfterWitness =
            rssBytes();

        console.log(
            `STAGE=WITNESS_PASS MS=${witnessMs.toFixed(3)}`
        );

        console.log("STAGE=PROVE_BEGIN");

        const proveStart =
            process.hrtime.bigint();

        const result =
            await snarkjs.groth16.prove(
                zkeyFile,
                witnessFile,
            );

        const proveEnd =
            process.hrtime.bigint();

        const proveMs =
            ms(
                proveStart,
                proveEnd,
            );

        const rssAfterProve =
            rssBytes();

        console.log(
            `STAGE=PROVE_PASS MS=${proveMs.toFixed(3)}`
        );

        console.log("STAGE=VERIFY_BEGIN");

        const verifyStart =
            process.hrtime.bigint();

        const verified =
            await snarkjs.groth16.verify(
                vkey,
                result.publicSignals,
                result.proof,
            );

        const verifyEnd =
            process.hrtime.bigint();

        const verifyMs =
            ms(
                verifyStart,
                verifyEnd,
            );

        const rssAfterVerify =
            rssBytes();

        console.log(
            `STAGE=VERIFY_${verified ? "PASS" : "FAIL"} MS=${verifyMs.toFixed(3)}`
        );

        if (!verified) {
            throw new Error(
                `Groth16 verification failed in trial ${trial.trialIndex}`
            );
        }

        if (result.publicSignals.length !== 73) {
            throw new Error(
                `Expected 73 public signals, got ${result.publicSignals.length}`
            );
        }

        const proofCompactJsonBytes =
            compactBytes(
                result.proof
            );

        const publicCompactJsonBytes =
            compactBytes(
                result.publicSignals
            );

        /*
         * Groth16 verifier proof payload:
         * pi_a = 2 words
         * pi_b = 4 words
         * pi_c = 2 words
         * total = 8 x 32-byte field words = 256 bytes.
         *
         * This is the canonical coordinate payload only,
         * not the complete castVote calldata.
         */
        const proofCoordinateCount = 8;
        const proofCoordinatePayloadBytes =
            proofCoordinateCount * 32;

        const witnessBytes =
            fs.statSync(
                witnessFile
            ).size;

        const proofPath = path.join(
            dir,
            "proof.json",
        );

        const publicPath = path.join(
            dir,
            "public.json",
        );

        fs.writeFileSync(
            proofPath,
            JSON.stringify(
                result.proof,
                null,
                2,
            ) + "\n",
        );

        fs.writeFileSync(
            publicPath,
            JSON.stringify(
                result.publicSignals,
                null,
                2,
            ) + "\n",
        );

        const totalStageMs =
            witnessMs
            + proveMs
            + verifyMs;

        const rssSampleHighWaterBytes =
            Math.max(
                rssStart,
                rssAfterWitness,
                rssAfterProve,
                rssAfterVerify,
            );

        const row = {
            campaignId,
            trialIndex: trial.trialIndex,
            warmup: trial.warmup,
            classification:
                "WP8C_B_STAGE_TIMING_PILOT",
            fixturePolicy:
                "FIXED_VALIDATED_SYNTHETIC_INPUT",
            candidateCount,
            depth,
            candidateSlot,
            witnessMs,
            proveMs,
            verifyMs,
            totalStageMs,
            witnessBytes,
            publicSignalCount:
                result.publicSignals.length,
            proofCompactJsonBytes,
            publicCompactJsonBytes,
            proofCoordinateCount,
            proofCoordinatePayloadBytes,
            rssStartBytes: rssStart,
            rssAfterWitnessBytes:
                rssAfterWitness,
            rssAfterProveBytes:
                rssAfterProve,
            rssAfterVerifyBytes:
                rssAfterVerify,
            rssSampleHighWaterBytes,
            nodeResourceMaxRssKiB:
                maxRssKiB(),
            verified,
            result: "PASS",
        };

        rows.push(row);

        fs.writeFileSync(
            path.join(
                dir,
                "trial.json",
            ),
            JSON.stringify(
                row,
                null,
                2,
            ) + "\n",
        );

        console.log(
            `PUBLIC_SIGNAL_COUNT=${row.publicSignalCount}`
        );

        console.log(
            `PROOF_COORDINATE_PAYLOAD_BYTES=${row.proofCoordinatePayloadBytes}`
        );

        console.log(
            `PROOF_COMPACT_JSON_BYTES=${row.proofCompactJsonBytes}`
        );

        console.log(
            `WITNESS_BYTES=${row.witnessBytes}`
        );

        console.log(
            `RSS_SAMPLE_HIGH_WATER_BYTES=${row.rssSampleHighWaterBytes}`
        );

        console.log(
            `TOTAL_STAGE_MS=${row.totalStageMs.toFixed(3)}`
        );
    }

    fs.writeFileSync(
        path.join(
            outputRoot,
            "all-trials.json",
        ),
        JSON.stringify(
            rows,
            null,
            2,
        ) + "\n",
    );

    console.log("");
    console.log("STAGE_TIMING_RUNNER=PASS");
    console.log(
        `TOTAL_TRIALS=${rows.length}`
    );

    console.log(
        `MEASURED_TRIALS=${
            rows.filter(
                (x) => !x.warmup
            ).length
        }`
    );
}

main().catch((error) => {
    console.error(
        "RUNNER_ERROR="
        + (
            error?.stack
            || error?.message
            || String(error)
        )
    );

    process.exit(2);
});
