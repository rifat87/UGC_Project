import fs from "node:fs";
import os from "node:os";

const [
    ,
    ,
    samplesPath,
    staticPath,
    aggregatedPath,
    bindingPath,
    environmentPath,
    nodeVersion,
    npmVersion,
    circomVersion,
    snarkjsVersion,
    circomlibjsVersion,
    circomlibVersion,
    gitHead,
    ptauSha,
    coreVectorSha,
    runId
] = process.argv;

function csv(text) {
    const lines =
        text
            .trim()
            .split(/\r?\n/);

    const header =
        lines[0].split(",");

    return lines
        .slice(1)
        .filter(Boolean)
        .map(line => {
            const values =
                line.split(",");

            return Object.fromEntries(
                header.map(
                    (name, i) =>
                        [
                            name,
                            values[i] ?? ""
                        ]
                )
            );
        });
}

function stats(values) {
    const xs =
        values
            .map(Number)
            .sort(
                (a, b) =>
                    a - b
            );

    const n =
        xs.length;

    const mean =
        xs.reduce(
            (a, b) =>
                a + b,
            0
        ) / n;

    let median;

    if (n % 2 === 1) {
        median =
            xs[
                Math.floor(
                    n / 2
                )
            ];
    } else {
        median =
            (
                xs[n / 2 - 1] +
                xs[n / 2]
            ) / 2;
    }

    const variance =
        n > 1
            ? xs.reduce(
                (sum, x) =>
                    sum +
                    (x - mean) ** 2,
                0
            ) /
            (n - 1)
            : 0;

    return {
        n,
        mean,
        median,
        min: xs[0],
        max: xs[n - 1],
        sampleStdDev:
            Math.sqrt(variance),
        p95:
            xs[
                Math.max(
                    0,
                    Math.ceil(
                        0.95 * n
                    ) - 1
                )
            ]
    };
}

const samples =
    csv(
        fs.readFileSync(
            samplesPath,
            "utf8"
        )
    );

const staticRows =
    csv(
        fs.readFileSync(
            staticPath,
            "utf8"
        )
    );

const byConfigStage =
    new Map();

for (const row of samples) {
    const key =
        `${row.config}|${row.stage}`;

    if (!byConfigStage.has(key))
        byConfigStage.set(
            key,
            []
        );

    byConfigStage
        .get(key)
        .push(
            Number(row.ms)
        );
}

function getStats(
    config,
    stage
) {
    const key =
        `${config}|${stage}`;

    const values =
        byConfigStage.get(key);

    if (!values)
        return null;

    return stats(values);
}

const aggregated = [];

for (const row of staticRows) {
    const witness =
        getStats(
            row.config,
            "witness_generation"
        );

    const prove =
        getStats(
            row.config,
            "groth16_proving"
        );

    const verify =
        getStats(
            row.config,
            "groth16_verification"
        );

    aggregated.push({
        ...row,

        witness_n:
            witness?.n ?? "",

        witness_mean_ms:
            witness?.mean ?? "",

        witness_median_ms:
            witness?.median ?? "",

        witness_min_ms:
            witness?.min ?? "",

        witness_max_ms:
            witness?.max ?? "",

        witness_sd_ms:
            witness?.sampleStdDev ?? "",

        witness_p95_ms:
            witness?.p95 ?? "",

        prove_n:
            prove?.n ?? "",

        prove_mean_ms:
            prove?.mean ?? "",

        prove_median_ms:
            prove?.median ?? "",

        prove_min_ms:
            prove?.min ?? "",

        prove_max_ms:
            prove?.max ?? "",

        prove_sd_ms:
            prove?.sampleStdDev ?? "",

        prove_p95_ms:
            prove?.p95 ?? "",

        verify_n:
            verify?.n ?? "",

        verify_mean_ms:
            verify?.mean ?? "",

        verify_median_ms:
            verify?.median ?? "",

        verify_min_ms:
            verify?.min ?? "",

        verify_max_ms:
            verify?.max ?? "",

        verify_sd_ms:
            verify?.sampleStdDev ?? "",

        verify_p95_ms:
            verify?.p95 ?? "",

        public_signal_field_bytes_estimate:
            Number(
                row.total_public_signals
            ) * 32
    });
}

function writeCsv(
    path,
    rows
) {
    if (rows.length === 0) {
        fs.writeFileSync(
            path,
            "\n"
        );

        return;
    }

    const header =
        Object.keys(
            rows[0]
        );

    const output = [
        header.join(",")
    ];

    for (const row of rows) {
        output.push(
            header
                .map(
                    key =>
                        String(
                            row[key] ?? ""
                        )
                        .replace(
                            /[\r\n]/g,
                            " "
                        )
                )
                .join(",")
        );
    }

    fs.writeFileSync(
        path,
        output.join("\n") +
        "\n"
    );
}

writeCsv(
    aggregatedPath,
    aggregated
);

const bindings = [];

for (
    const K
    of [
        "2",
        "4",
        "8",
        "16"
    ]
) {
    const direct =
        aggregated.find(
            row =>
                row.k === K &&
                row.binding ===
                    "DIRECT"
        );

    const digest =
        aggregated.find(
            row =>
                row.k === K &&
                row.binding ===
                    "POSEIDON_CHAIN"
        );

    if (
        !direct ||
        !digest
    )
        continue;

    bindings.push({
        k: K,

        direct_constraints:
            direct.constraints,

        digest_constraints:
            digest.constraints,

        direct_public_signals:
            direct.total_public_signals,

        digest_public_signals:
            digest.total_public_signals,

        direct_public_signal_field_bytes_estimate:
            direct.public_signal_field_bytes_estimate,

        digest_public_signal_field_bytes_estimate:
            digest.public_signal_field_bytes_estimate,

        direct_zkey_bytes:
            direct.zkey_bytes,

        digest_zkey_bytes:
            digest.zkey_bytes,

        direct_prove_mean_ms:
            direct.prove_mean_ms,

        digest_prove_mean_ms:
            digest.prove_mean_ms,

        direct_verify_mean_ms:
            direct.verify_mean_ms,

        digest_verify_mean_ms:
            digest.verify_mean_ms,

        final_binding_decision:
            "DEFERRED_PENDING_WP3_INTEGRATION_AND_WP4_EVM_GAS"
    });
}

writeCsv(
    bindingPath,
    bindings
);

const environment = {
    runId,
    timestampUtc:
        new Date().toISOString(),

    osPlatform:
        process.platform,

    osRelease:
        os.release(),

    arch:
        process.arch,

    cpuModel:
        os.cpus()?.[0]?.model ??
        "UNKNOWN",

    logicalCpuCount:
        os.cpus()?.length ??
        null,

    totalMemoryBytes:
        os.totalmem(),

    nodeVersion,
    npmVersion,
    circomVersion,
    snarkjsVersion,
    circomlibjsVersion,
    circomlibVersion,

    gitHead,
    ptauSha256:
        ptauSha,

    coreVectorSha256:
        coreVectorSha,

    experimentPolicy: {
        warmupsPerConfiguration:
            5,

        measuredRunsPerConfiguration:
            20,

        candidateMatrix:
            [2, 4, 8, 16],

        candidateBindingModes:
            [
                "DIRECT",
                "POSEIDON_CHAIN"
            ],

        eligibleSetMatrix:
            [
                {
                    N: 10,
                    depth: 4
                },
                {
                    N: 100,
                    depth: 7
                },
                {
                    N: 1000,
                    depth: 10
                },
                {
                    N: 10000,
                    depth: 14
                },
                {
                    N: 100000,
                    depth: 17
                }
            ],

        resultClass:
            "WP2_COMPONENT_PILOT_NOT_FINAL_WP8_CAMPAIGN"
    }
};

fs.writeFileSync(
    environmentPath,

    JSON.stringify(
        environment,
        null,
        2
    ) + "\n"
);

console.log(
    "PHASE_B_AGGREGATION=PASS"
);
