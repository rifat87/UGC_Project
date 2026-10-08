import csv
import json
import math
import statistics
import sys
from collections import Counter
from pathlib import Path


campaign = Path(sys.argv[1])
postvalidation_path = Path(sys.argv[2])
out_dir = Path(sys.argv[3])

raw_path = (
    campaign
    / "raw-microbenchmark.tsv"
)

complete_path = (
    campaign
    / "microbenchmark-complete.json"
)


with open(
    raw_path,
    encoding="utf-8",
    newline="",
) as f:
    rows = list(
        csv.DictReader(
            f,
            delimiter="\t",
        )
    )


with open(
    complete_path,
    encoding="utf-8",
) as f:
    complete = json.load(f)


with open(
    postvalidation_path,
    encoding="utf-8",
) as f:
    postvalidation = json.load(f)


if len(rows) != 25:
    raise RuntimeError(
        f"raw rows {len(rows)} != 25"
    )


kind_counts = Counter(
    r["kind"]
    for r in rows
)


if kind_counts != Counter({
    "warmup": 5,
    "measured": 20,
}):
    raise RuntimeError(
        f"unexpected kind counts "
        f"{dict(kind_counts)}"
    )


if complete.get(
    "status"
) != "PASS":
    raise RuntimeError(
        "complete status != PASS"
    )


if complete.get(
    "warmupIterations"
) != 5:
    raise RuntimeError(
        "complete warmupIterations != 5"
    )


if complete.get(
    "measuredIterations"
) != 20:
    raise RuntimeError(
        "complete measuredIterations != 20"
    )


if complete.get(
    "totalIterations"
) != 25:
    raise RuntimeError(
        "complete totalIterations != 25"
    )


if postvalidation.get(
    "status"
) != "PASS":
    raise RuntimeError(
        "postvalidation status != PASS"
    )


if postvalidation.get(
    "failureFiles"
) != 0:
    raise RuntimeError(
        "postvalidation failureFiles != 0"
    )


if postvalidation.get(
    "abortedCampaignReused"
) is not False:
    raise RuntimeError(
        "aborted campaign reuse flag invalid"
    )


if postvalidation.get(
    "pilotReused"
) is not False:
    raise RuntimeError(
        "pilot reuse flag invalid"
    )


expected_order = (
    [
        (
            "warmup",
            i,
            f"warmup-{i:02d}",
        )
        for i in range(
            1,
            6,
        )
    ]
    +
    [
        (
            "measured",
            i,
            f"measured-{i:02d}",
        )
        for i in range(
            1,
            21,
        )
    ]
)


actual_order = [
    (
        r["kind"],
        int(
            r["iteration"]
        ),
        r["repetition_id"],
    )
    for r in rows
]


if actual_order != expected_order:
    raise RuntimeError(
        "raw observation order mismatch"
    )


for row in rows:

    if row["receipt_status"] != "1":
        raise RuntimeError(
            f"{row['repetition_id']}: "
            "receipt_status != 1"
        )

    if row["ballot_id"] != "001":
        raise RuntimeError(
            f"{row['repetition_id']}: "
            "ballot_id != 001"
        )

    if row["candidate_index"] != "0":
        raise RuntimeError(
            f"{row['repetition_id']}: "
            "candidate_index != 0"
        )

    if row["calldata_bytes"] != "2340":
        raise RuntimeError(
            f"{row['repetition_id']}: "
            "calldata_bytes != 2340"
        )

    if int(
        row["gas_used"]
    ) <= 0:
        raise RuntimeError(
            f"{row['repetition_id']}: "
            "invalid gas"
        )

    latency = float(
        row["latency_ms"]
    )

    if (
        not math.isfinite(
            latency
        )
        or latency <= 0
    ):
        raise RuntimeError(
            f"{row['repetition_id']}: "
            "invalid latency"
        )


warmups = [
    r
    for r in rows
    if r["kind"] == "warmup"
]

measured = [
    r
    for r in rows
    if r["kind"] == "measured"
]


if len(warmups) != 5:
    raise RuntimeError(
        "warmup count != 5"
    )


if len(measured) != 20:
    raise RuntimeError(
        "measured count != 20"
    )


def nearest_rank_p95(values):

    ordered = sorted(
        values
    )

    rank = math.ceil(
        0.95
        * len(
            ordered
        )
    )

    return ordered[
        rank - 1
    ]


def summarize(values):

    values = list(
        values
    )

    if len(values) < 2:
        raise RuntimeError(
            "summary requires n >= 2"
        )

    return {
        "n":
            len(values),
        "mean":
            statistics.mean(
                values
            ),
        "median":
            statistics.median(
                values
            ),
        "min":
            min(
                values
            ),
        "max":
            max(
                values
            ),
        "sampleSd":
            statistics.stdev(
                values
            ),
        "nearestRankP95":
            nearest_rank_p95(
                values
            ),
    }


warmup_gas = [
    int(
        r["gas_used"]
    )
    for r in warmups
]

warmup_latency = [
    float(
        r["latency_ms"]
    )
    for r in warmups
]

measured_gas = [
    int(
        r["gas_used"]
    )
    for r in measured
]

measured_latency = [
    float(
        r["latency_ms"]
    )
    for r in measured
]


warmup_summary = {
    "gas":
        summarize(
            warmup_gas
        ),
    "latencyMs":
        summarize(
            warmup_latency
        ),
}


measured_summary = {
    "gas":
        summarize(
            measured_gas
        ),
    "latencyMs":
        summarize(
            measured_latency
        ),
}


if len(
    set(
        measured_gas
    )
) != 1:
    gas_deterministic = False
else:
    gas_deterministic = True


if measured_summary[
    "gas"
][
    "sampleSd"
] != 0:
    raise RuntimeError(
        "measured gas SD expected 0 "
        "for identical fresh-chain state"
    )


if measured_summary[
    "gas"
][
    "min"
] != measured_summary[
    "gas"
][
    "max"
]:
    raise RuntimeError(
        "measured gas min/max mismatch"
    )


if measured_summary[
    "gas"
][
    "mean"
] != 1866414:
    raise RuntimeError(
        "measured gas mean != 1866414"
    )


measured_table_path = (
    out_dir
    / "C8B_R4_MEASURED_OBSERVATIONS.tsv"
)


with open(
    measured_table_path,
    "w",
    encoding="utf-8",
    newline="",
) as f:

    fields = [
        "iteration",
        "repetition_id",
        "tx_hash",
        "receipt_status",
        "gas_used",
        "calldata_bytes",
        "latency_ms",
    ]

    w = csv.DictWriter(
        f,
        fieldnames=fields,
        delimiter="\t",
        lineterminator="\n",
    )

    w.writeheader()

    for row in measured:
        w.writerow({
            key:
                row[key]
            for key in fields
        })


warmup_table_path = (
    out_dir
    / "C8B_R4_WARMUP_OBSERVATIONS.tsv"
)


with open(
    warmup_table_path,
    "w",
    encoding="utf-8",
    newline="",
) as f:

    fields = [
        "iteration",
        "repetition_id",
        "tx_hash",
        "receipt_status",
        "gas_used",
        "calldata_bytes",
        "latency_ms",
    ]

    w = csv.DictWriter(
        f,
        fieldnames=fields,
        delimiter="\t",
        lineterminator="\n",
    )

    w.writeheader()

    for row in warmups:
        w.writerow({
            key:
                row[key]
            for key in fields
        })


summary = {
    "status":
        "PASS",
    "classification":
        (
            "FINAL_READ_ONLY_"
            "MICROBENCHMARK_"
            "STATISTICAL_ANALYSIS"
        ),
    "finalCampaignRun":
        "20261003_015120",
    "rawRows":
        25,
    "warmupRows":
        5,
    "measuredRows":
        20,
    "warmupsIncludedInFinalStatistics":
        False,
    "pilotIncludedInFinalStatistics":
        False,
    "abortedCampaignIncludedInFinalStatistics":
        False,
    "silentOutlierDeletion":
        False,
    "latencyReconstruction":
        False,
    "p95Method":
        "nearest-rank",
    "standardDeviation":
        "sample",
    "freshChainPerIteration":
        True,
    "ballotId":
        "001",
    "candidateIndex":
        0,
    "calldataBytes":
        2340,
    "timedInterval":
        "cast-send-start-to-receipt-return",
    "setupInsideTimedInterval":
        False,
    "postReceiptChecksInsideTimedInterval":
        False,
    "measuredGasDeterministic":
        gas_deterministic,
    "warmupSummary":
        warmup_summary,
    "measuredSummary":
        measured_summary,
    "diagnosticsFromFinalPostvalidation": {
        "verifierDeployTrailingDiagnosticCount":
            postvalidation.get(
                "verifierDeployTrailingDiagnosticCount"
            ),
        "verifierDeployTrailingDiagnosticRepetitions":
            postvalidation.get(
                "verifierDeployTrailingDiagnosticRepetitions"
            ),
        "directDeployTrailingDiagnosticCount":
            postvalidation.get(
                "directDeployTrailingDiagnosticCount"
            ),
        "directDeployTrailingDiagnosticRepetitions":
            postvalidation.get(
                "directDeployTrailingDiagnosticRepetitions"
            ),
        "receiptTrailingDiagnosticCount":
            postvalidation.get(
                "receiptTrailingDiagnosticCount"
            ),
        "receiptTrailingDiagnosticRepetitions":
            postvalidation.get(
                "receiptTrailingDiagnosticRepetitions"
            ),
    },
}


summary_json_path = (
    out_dir
    / "C8B_R4_FINAL_STATISTICS.json"
)


summary_json_path.write_text(
    json.dumps(
        summary,
        indent=2,
    )
    + "\n",
    encoding="utf-8",
    newline="\n",
)


report = f"""# WP8E C8B-R4 Final Fresh-Chain Microbenchmark Statistics

## Final analysis population

The final campaign contains 25 fresh-chain iterations:

- 5 warm-up iterations;
- 20 measured iterations.

Only the 20 measured iterations are used for final reported statistics.

The 5 warm-ups are preserved separately and excluded from final statistics.

The earlier pilot observations and the aborted 20261003_012934 campaign are
excluded from final statistics.

No silent outlier deletion was performed.

No missing latency was reconstructed or imputed.

## Metric definition

Each measured iteration starts from a completely fresh Anvil chain and uses
the same frozen ballot-001 fixture.

Deployment, configure, activate, fixture loading, and post-receipt correctness
checks are outside the timed interval.

Latency is measured from immediately before local `cast send` invocation until
the process returns with receipt output.

This is a local Foundry/Anvil process-and-RPC metric. It is not Groth16 proving
time, public Ethereum confirmation latency, biometric latency, or end-to-end
voter interaction time.

## Final measured gas statistics

n = {measured_summary["gas"]["n"]}

mean = {measured_summary["gas"]["mean"]:.3f} gas

median = {measured_summary["gas"]["median"]:.3f} gas

min = {measured_summary["gas"]["min"]} gas

max = {measured_summary["gas"]["max"]} gas

sample SD = {measured_summary["gas"]["sampleSd"]:.3f} gas

nearest-rank p95 = {measured_summary["gas"]["nearestRankP95"]} gas

All 20 measured fresh-chain votes consume exactly 1,866,414 gas.

The zero sample standard deviation reflects deterministic execution of the
same frozen first-vote transaction/state transition on independent fresh local
chains. It must not be generalized to claim zero deployment, network, or
production-environment variability.

## Final measured local cast-to-receipt latency statistics

n = {measured_summary["latencyMs"]["n"]}

mean = {measured_summary["latencyMs"]["mean"]:.3f} ms

median = {measured_summary["latencyMs"]["median"]:.3f} ms

min = {measured_summary["latencyMs"]["min"]:.3f} ms

max = {measured_summary["latencyMs"]["max"]:.3f} ms

sample SD = {measured_summary["latencyMs"]["sampleSd"]:.3f} ms

nearest-rank p95 = {measured_summary["latencyMs"]["nearestRankP95"]:.3f} ms

## Relationship to accepted-ballot scaling experiment

This fresh-chain microbenchmark isolates repeatability of the first accepted
vote under the frozen 4-candidate, 16-slot DIRECT profile.

Its 1,866,414-gas result corresponds to the first-position cost observed in the
accepted-ballot accumulation experiment.

It does not replace the accepted-ballot scaling experiment, candidate-count
matrix, or eligible-set-size matrix.

## Diagnostic handling

The final campaign postvalidation recorded:

- verifier deployment trailing diagnostics:
  {postvalidation.get("verifierDeployTrailingDiagnosticCount")};

- DIRECT deployment trailing diagnostics:
  {postvalidation.get("directDeployTrailingDiagnosticCount")};

- receipt trailing diagnostics:
  {postvalidation.get("receiptTrailingDiagnosticCount")}.

These diagnostics were preserved and handled by the versioned parser. No
observation was deleted because of them.
"""


report_path = (
    out_dir
    / "C8B_R4_FINAL_STATISTICAL_REPORT.md"
)


report_path.write_text(
    report,
    encoding="utf-8",
    newline="\n",
)


print(
    "FINAL_RAW_ROWS=25"
)

print(
    "FINAL_WARMUP_ROWS=5"
)

print(
    "FINAL_MEASURED_ROWS=20"
)

print(
    "WARMUPS_INCLUDED_IN_FINAL_STATS=NO"
)

print(
    "PILOTS_INCLUDED_IN_FINAL_STATS=NO"
)

print(
    "ABORTED_CAMPAIGN_INCLUDED_IN_FINAL_STATS=NO"
)

print(
    "OUTLIER_DELETION=NO"
)

print(
    "LATENCY_RECONSTRUCTION=NO"
)

print(
    "P95_METHOD=NEAREST_RANK"
)

print(
    "SD_METHOD=SAMPLE"
)

print()
print(
    "=== FINAL MEASURED GAS STATISTICS ==="
)

print(
    "MEASURED_GAS_N="
    + str(
        measured_summary[
            "gas"
        ][
            "n"
        ]
    )
)

print(
    "MEASURED_GAS_MEAN="
    + f"{measured_summary['gas']['mean']:.3f}"
)

print(
    "MEASURED_GAS_MEDIAN="
    + f"{measured_summary['gas']['median']:.3f}"
)

print(
    "MEASURED_GAS_MIN="
    + str(
        measured_summary[
            "gas"
        ][
            "min"
        ]
    )
)

print(
    "MEASURED_GAS_MAX="
    + str(
        measured_summary[
            "gas"
        ][
            "max"
        ]
    )
)

print(
    "MEASURED_GAS_SAMPLE_SD="
    + f"{measured_summary['gas']['sampleSd']:.3f}"
)

print(
    "MEASURED_GAS_P95_NEAREST_RANK="
    + str(
        measured_summary[
            "gas"
        ][
            "nearestRankP95"
        ]
    )
)

print(
    "MEASURED_GAS_ALL_IDENTICAL="
    + (
        "YES"
        if gas_deterministic
        else "NO"
    )
)

print()
print(
    "=== FINAL MEASURED LOCAL LATENCY STATISTICS ==="
)

print(
    "MEASURED_LATENCY_N="
    + str(
        measured_summary[
            "latencyMs"
        ][
            "n"
        ]
    )
)

print(
    "MEASURED_LATENCY_MEAN_MS="
    + f"{measured_summary['latencyMs']['mean']:.3f}"
)

print(
    "MEASURED_LATENCY_MEDIAN_MS="
    + f"{measured_summary['latencyMs']['median']:.3f}"
)

print(
    "MEASURED_LATENCY_MIN_MS="
    + f"{measured_summary['latencyMs']['min']:.3f}"
)

print(
    "MEASURED_LATENCY_MAX_MS="
    + f"{measured_summary['latencyMs']['max']:.3f}"
)

print(
    "MEASURED_LATENCY_SAMPLE_SD_MS="
    + f"{measured_summary['latencyMs']['sampleSd']:.3f}"
)

print(
    "MEASURED_LATENCY_P95_NEAREST_RANK_MS="
    + f"{measured_summary['latencyMs']['nearestRankP95']:.3f}"
)

print()
print(
    "VERIFIER_DEPLOY_TRAILING_DIAGNOSTICS="
    + str(
        postvalidation.get(
            "verifierDeployTrailingDiagnosticCount"
        )
    )
)

print(
    "DIRECT_DEPLOY_TRAILING_DIAGNOSTICS="
    + str(
        postvalidation.get(
            "directDeployTrailingDiagnosticCount"
        )
    )
)

print(
    "RECEIPT_TRAILING_DIAGNOSTICS="
    + str(
        postvalidation.get(
            "receiptTrailingDiagnosticCount"
        )
    )
)

print(
    "FINAL_MICROBENCHMARK_STATISTICAL_ANALYSIS=PASS"
)
