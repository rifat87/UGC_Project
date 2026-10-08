import fs from "node:fs";

const [
    ,,
    gasPath,
    outputPath
] = process.argv;

const lines =
    fs
        .readFileSync(
            gasPath,
            "utf8"
        )
        .trim()
        .split(/\r?\n/);

const header =
    lines[0]
        .split(",");

const rows =
    lines
        .slice(1)
        .filter(Boolean)
        .map(line => {
            const values =
                line.split(",");

            return Object.fromEntries(
                header.map(
                    (key, i) => [
                        key,
                        values[i] ?? ""
                    ]
                )
            );
        });

function metric(
    name,
    variant
) {
    const row =
        rows.find(
            r =>
                r.metric === name &&
                r.variant === variant
        );

    if (!row) {
        throw new Error(
            `Missing ${name}/${variant}`
        );
    }

    return Number(
        row.value
    );
}

const directVerifier =
    metric(
        "M12_VERIFIER_EXECUTION_GAS_PROXY",
        "DIRECT"
    );

const poseidonVerifier =
    metric(
        "M12_VERIFIER_EXECUTION_GAS_PROXY",
        "POSEIDON"
    );

const poseidonBinding =
    metric(
        "M13_BINDING_HASH_GAS_PROXY",
        "POSEIDON"
    );

const directCast =
    metric(
        "M14_CAST_EXECUTION_GAS_PROXY",
        "DIRECT"
    );

const poseidonCast =
    metric(
        "M14_CAST_EXECUTION_GAS_PROXY",
        "POSEIDON"
    );

const directBytes =
    metric(
        "M15_CALLDATA_BYTES",
        "DIRECT"
    );

const poseidonBytes =
    metric(
        "M15_CALLDATA_BYTES",
        "POSEIDON"
    );

const directCalldataGas =
    metric(
        "M15_CALLDATA_INTRINSIC_GAS",
        "DIRECT"
    );

const poseidonCalldataGas =
    metric(
        "M15_CALLDATA_INTRINSIC_GAS",
        "POSEIDON"
    );

const tallyGas =
    metric(
        "M18_TALLY_UPDATE_GAS_PROXY",
        "COMMON_BABYJUB"
    );

const directComposite =
    directCast +
    directCalldataGas;

const poseidonComposite =
    poseidonCast +
    poseidonCalldataGas;

const lower =
    directComposite <
    poseidonComposite
        ? "DIRECT"
        : poseidonComposite <
          directComposite
            ? "POSEIDON"
            : "TIE";

const delta =
    Math.abs(
        directComposite -
        poseidonComposite
    );

const base =
    Math.min(
        directComposite,
        poseidonComposite
    );

const deltaPct =
    base > 0
        ? (
            delta /
            base *
            100
        )
        : 0;

const result = {
    classification:
        "WP4_ENGINEERING_GAS_GATE_NOT_FINAL_WP8_BENCHMARK",

    directVerifierGasProxy:
        directVerifier,

    poseidonVerifierGasProxy:
        poseidonVerifier,

    poseidonBindingGasProxy:
        poseidonBinding,

    directCastExecutionGasProxy:
        directCast,

    poseidonCastExecutionGasProxy:
        poseidonCast,

    directCalldataBytes:
        directBytes,

    poseidonCalldataBytes:
        poseidonBytes,

    directCalldataIntrinsicGas:
        directCalldataGas,

    poseidonCalldataIntrinsicGas:
        poseidonCalldataGas,

    babyJubTallyUpdateGasProxy:
        tallyGas,

    directExecutionPlusCalldataProxy:
        directComposite,

    poseidonExecutionPlusCalldataProxy:
        poseidonComposite,

    measuredLowerCompositeProxy:
        lower,

    relativeDeltaPercent:
        deltaPct,

    finalBindingDecision:
        "REVIEW_REQUIRED_AFTER_WP4_GATE",

    finalPaperBenchmark:
        "DEFERRED_WP8"
};

fs.writeFileSync(
    outputPath,
    JSON.stringify(
        result,
        null,
        2
    ) + "\n"
);

console.log(
    "WP4_GAS_GATE_FINALIZATION=PASS"
);

console.log(
    `MEASURED_LOWER_COMPOSITE_PROXY=${lower}`
);

console.log(
    `RELATIVE_DELTA_PERCENT=${deltaPct.toFixed(2)}`
);
