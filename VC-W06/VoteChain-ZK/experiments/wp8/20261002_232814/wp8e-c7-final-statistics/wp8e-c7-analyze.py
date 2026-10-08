import csv
import json
import math
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path

raw_path = Path(sys.argv[1])
postvalidation_path = Path(sys.argv[2])
out_dir = Path(sys.argv[3])

out_dir.mkdir(
    parents=True,
    exist_ok=True,
)

SCALES = [
    25,
    50,
    75,
    100,
    150,
]

EXPECTED_MEASURED_ROWS = {
    25: 125,
    50: 250,
    75: 375,
    100: 500,
    150: 750,
}

EXPECTED_WARMUP_ROWS = {
    25: 25,
    50: 50,
    75: 75,
    100: 100,
    150: 150,
}


def nearest_rank_p95(values):
    if not values:
        raise ValueError(
            "empty values"
        )

    ordered = sorted(values)

    rank = math.ceil(
        0.95 * len(ordered)
    )

    return ordered[
        rank - 1
    ]


def describe(values):
    values = list(values)

    if not values:
        raise ValueError(
            "cannot describe empty list"
        )

    return {
        "n":
            len(values),
        "mean":
            statistics.mean(values),
        "median":
            statistics.median(values),
        "min":
            min(values),
        "max":
            max(values),
        "sample_sd":
            (
                statistics.stdev(
                    values
                )
                if len(values) >= 2
                else None
            ),
        "p95_nearest_rank":
            nearest_rank_p95(
                values
            ),
    }


def f6(value):
    if value is None:
        return ""

    return f"{float(value):.6f}"


def f3(value):
    if value is None:
        return ""

    return f"{float(value):.3f}"


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
    postvalidation_path,
    encoding="utf-8",
) as f:
    postvalidation = json.load(f)


if len(rows) != 2400:
    raise RuntimeError(
        f"raw rows {len(rows)} != 2400"
    )


warmup = [
    r
    for r in rows
    if r["kind"] == "warmup"
]

measured = [
    r
    for r in rows
    if r["kind"] == "measured"
]


if len(warmup) != 400:
    raise RuntimeError(
        f"warmup rows {len(warmup)} != 400"
    )


if len(measured) != 2000:
    raise RuntimeError(
        f"measured rows {len(measured)} != 2000"
    )


identities = {
    (
        r["repetition_id"],
        r["ballot_id"],
    )
    for r in rows
}


if len(identities) != 2400:
    raise RuntimeError(
        "observation identity count != 2400"
    )


for r in rows:

    r["scale"] = int(
        r["scale"]
    )

    r["ballot_position"] = int(
        r["ballot_position"]
    )

    r["candidate_index"] = int(
        r["candidate_index"]
    )

    r["gas_used"] = int(
        r["gas_used"]
    )

    r["calldata_bytes"] = int(
        r["calldata_bytes"]
    )

    r["latency_ms"] = float(
        r["latency_ms"]
    )

    if r["receipt_status"] != "1":
        raise RuntimeError(
            "non-success receipt row"
        )

    if r["calldata_bytes"] != 2340:
        raise RuntimeError(
            "calldata byte mismatch"
        )


warmup = [
    r
    for r in rows
    if r["kind"] == "warmup"
]

measured = [
    r
    for r in rows
    if r["kind"] == "measured"
]


warmup_counts = Counter(
    r["scale"]
    for r in warmup
)

measured_counts = Counter(
    r["scale"]
    for r in measured
)


if dict(warmup_counts) != EXPECTED_WARMUP_ROWS:
    raise RuntimeError(
        f"warmup scale counts "
        f"{dict(warmup_counts)}"
    )


if dict(measured_counts) != EXPECTED_MEASURED_ROWS:
    raise RuntimeError(
        f"measured scale counts "
        f"{dict(measured_counts)}"
    )


measured_reps = {
    r["repetition_id"]
    for r in measured
}


if len(measured_reps) != 25:
    raise RuntimeError(
        "measured repetition count != 25"
    )


# ---------------------------------------------------------------------
# Transaction-level statistics by scale.
# ---------------------------------------------------------------------

transaction_rows = []

for scale in SCALES:

    group = [
        r
        for r in measured
        if r["scale"] == scale
    ]

    reps = {
        r["repetition_id"]
        for r in group
    }

    if len(reps) != 5:
        raise RuntimeError(
            f"scale {scale}: "
            "measured election count != 5"
        )

    gas = [
        r["gas_used"]
        for r in group
    ]

    latency = [
        r["latency_ms"]
        for r in group
    ]

    gas_stats = describe(
        gas
    )

    latency_stats = describe(
        latency
    )

    transaction_rows.append({
        "scale":
            scale,
        "measured_elections":
            len(reps),
        "measured_transactions":
            len(group),

        "gas_mean":
            gas_stats["mean"],
        "gas_median":
            gas_stats["median"],
        "gas_min":
            gas_stats["min"],
        "gas_max":
            gas_stats["max"],
        "gas_sample_sd":
            gas_stats["sample_sd"],
        "gas_p95_nearest_rank":
            gas_stats[
                "p95_nearest_rank"
            ],

        "latency_mean_ms":
            latency_stats["mean"],
        "latency_median_ms":
            latency_stats["median"],
        "latency_min_ms":
            latency_stats["min"],
        "latency_max_ms":
            latency_stats["max"],
        "latency_sample_sd_ms":
            latency_stats["sample_sd"],
        "latency_p95_nearest_rank_ms":
            latency_stats[
                "p95_nearest_rank"
            ],

        "calldata_bytes":
            2340,
    })


transaction_table = (
    out_dir
    / "C7_TRANSACTION_LEVEL_BY_SCALE.tsv"
)

with open(
    transaction_table,
    "w",
    encoding="utf-8",
    newline="",
) as f:

    fieldnames = [
        "scale",
        "measured_elections",
        "measured_transactions",
        "gas_mean",
        "gas_median",
        "gas_min",
        "gas_max",
        "gas_sample_sd",
        "gas_p95_nearest_rank",
        "latency_mean_ms",
        "latency_median_ms",
        "latency_min_ms",
        "latency_max_ms",
        "latency_sample_sd_ms",
        "latency_p95_nearest_rank_ms",
        "calldata_bytes",
    ]

    writer = csv.DictWriter(
        f,
        fieldnames=fieldnames,
        delimiter="\t",
        lineterminator="\n",
    )

    writer.writeheader()

    for x in transaction_rows:

        writer.writerow({
            **x,
            "gas_mean":
                f6(
                    x["gas_mean"]
                ),
            "gas_median":
                f6(
                    x["gas_median"]
                ),
            "gas_sample_sd":
                f6(
                    x["gas_sample_sd"]
                ),
            "latency_mean_ms":
                f6(
                    x["latency_mean_ms"]
                ),
            "latency_median_ms":
                f6(
                    x["latency_median_ms"]
                ),
            "latency_sample_sd_ms":
                f6(
                    x[
                        "latency_sample_sd_ms"
                    ]
                ),
            "latency_p95_nearest_rank_ms":
                f6(
                    x[
                        "latency_p95_nearest_rank_ms"
                    ]
                ),
        })


# ---------------------------------------------------------------------
# Per-independent-election summary.
# ---------------------------------------------------------------------

by_rep = defaultdict(
    list
)

for r in measured:
    by_rep[
        r["repetition_id"]
    ].append(r)


rep_rows = []

for rep, group in sorted(
    by_rep.items()
):

    scales = {
        r["scale"]
        for r in group
    }

    if len(scales) != 1:
        raise RuntimeError(
            f"{rep}: multiple scales"
        )

    scale = next(
        iter(scales)
    )

    if len(group) != scale:
        raise RuntimeError(
            f"{rep}: "
            f"{len(group)} tx != scale {scale}"
        )

    gas_stats = describe(
        r["gas_used"]
        for r in group
    )

    latency_stats = describe(
        r["latency_ms"]
        for r in group
    )

    round_values = {
        int(
            r["measured_round"]
        )
        for r in group
    }

    if len(round_values) != 1:
        raise RuntimeError(
            f"{rep}: mixed rounds"
        )

    rep_rows.append({
        "repetition_id":
            rep,
        "measured_round":
            next(
                iter(
                    round_values
                )
            ),
        "scale":
            scale,
        "transactions":
            len(group),

        "gas_mean":
            gas_stats["mean"],
        "gas_median":
            gas_stats["median"],
        "gas_min":
            gas_stats["min"],
        "gas_max":
            gas_stats["max"],
        "gas_sample_sd":
            gas_stats["sample_sd"],
        "gas_p95_nearest_rank":
            gas_stats[
                "p95_nearest_rank"
            ],

        "latency_mean_ms":
            latency_stats["mean"],
        "latency_median_ms":
            latency_stats["median"],
        "latency_min_ms":
            latency_stats["min"],
        "latency_max_ms":
            latency_stats["max"],
        "latency_sample_sd_ms":
            latency_stats["sample_sd"],
        "latency_p95_nearest_rank_ms":
            latency_stats[
                "p95_nearest_rank"
            ],
    })


rep_table = (
    out_dir
    / "C7_MEASURED_ELECTION_SUMMARIES.tsv"
)

with open(
    rep_table,
    "w",
    encoding="utf-8",
    newline="",
) as f:

    fieldnames = [
        "repetition_id",
        "measured_round",
        "scale",
        "transactions",
        "gas_mean",
        "gas_median",
        "gas_min",
        "gas_max",
        "gas_sample_sd",
        "gas_p95_nearest_rank",
        "latency_mean_ms",
        "latency_median_ms",
        "latency_min_ms",
        "latency_max_ms",
        "latency_sample_sd_ms",
        "latency_p95_nearest_rank_ms",
    ]

    writer = csv.DictWriter(
        f,
        fieldnames=fieldnames,
        delimiter="\t",
        lineterminator="\n",
    )

    writer.writeheader()

    for x in rep_rows:

        writer.writerow({
            **x,
            "gas_mean":
                f6(
                    x["gas_mean"]
                ),
            "gas_median":
                f6(
                    x["gas_median"]
                ),
            "gas_sample_sd":
                f6(
                    x["gas_sample_sd"]
                ),
            "latency_mean_ms":
                f6(
                    x["latency_mean_ms"]
                ),
            "latency_median_ms":
                f6(
                    x["latency_median_ms"]
                ),
            "latency_sample_sd_ms":
                f6(
                    x[
                        "latency_sample_sd_ms"
                    ]
                ),
            "latency_p95_nearest_rank_ms":
                f6(
                    x[
                        "latency_p95_nearest_rank_ms"
                    ]
                ),
        })


# ---------------------------------------------------------------------
# Statistics across the five independent election means per scale.
# This keeps the election as an explicit replication unit.
# ---------------------------------------------------------------------

rep_scale_rows = []

for scale in SCALES:

    group = [
        r
        for r in rep_rows
        if r["scale"] == scale
    ]

    if len(group) != 5:
        raise RuntimeError(
            f"scale {scale}: "
            f"{len(group)} election summaries != 5"
        )

    gas_means = [
        r["gas_mean"]
        for r in group
    ]

    latency_means = [
        r["latency_mean_ms"]
        for r in group
    ]

    g = describe(
        gas_means
    )

    l = describe(
        latency_means
    )

    rep_scale_rows.append({
        "scale":
            scale,
        "independent_measured_elections":
            5,

        "election_mean_gas_mean":
            g["mean"],
        "election_mean_gas_median":
            g["median"],
        "election_mean_gas_min":
            g["min"],
        "election_mean_gas_max":
            g["max"],
        "election_mean_gas_sample_sd":
            g["sample_sd"],
        "election_mean_gas_p95_nearest_rank":
            g[
                "p95_nearest_rank"
            ],

        "election_mean_latency_mean_ms":
            l["mean"],
        "election_mean_latency_median_ms":
            l["median"],
        "election_mean_latency_min_ms":
            l["min"],
        "election_mean_latency_max_ms":
            l["max"],
        "election_mean_latency_sample_sd_ms":
            l["sample_sd"],
        "election_mean_latency_p95_nearest_rank_ms":
            l[
                "p95_nearest_rank"
            ],
    })


rep_scale_table = (
    out_dir
    / "C7_REPETITION_LEVEL_BY_SCALE.tsv"
)

with open(
    rep_scale_table,
    "w",
    encoding="utf-8",
    newline="",
) as f:

    fieldnames = list(
        rep_scale_rows[0].keys()
    )

    writer = csv.DictWriter(
        f,
        fieldnames=fieldnames,
        delimiter="\t",
        lineterminator="\n",
    )

    writer.writeheader()

    for x in rep_scale_rows:

        writer.writerow({
            k:
                (
                    f6(v)
                    if isinstance(
                        v,
                        float,
                    )
                    else v
                )
            for k, v in x.items()
        })


# ---------------------------------------------------------------------
# Position-level descriptive table.
# Five measured observations exist at each state position within a scale.
# This table supports later state-growth plots without adding an inferential
# model or changing the preregistered campaign.
# ---------------------------------------------------------------------

position_table = (
    out_dir
    / "C7_POSITION_LEVEL_BY_SCALE.tsv"
)

with open(
    position_table,
    "w",
    encoding="utf-8",
    newline="",
) as f:

    fieldnames = [
        "scale",
        "ballot_position",
        "n",
        "gas_mean",
        "gas_median",
        "gas_min",
        "gas_max",
        "gas_sample_sd",
        "gas_p95_nearest_rank",
        "latency_mean_ms",
        "latency_median_ms",
        "latency_min_ms",
        "latency_max_ms",
        "latency_sample_sd_ms",
        "latency_p95_nearest_rank_ms",
    ]

    writer = csv.DictWriter(
        f,
        fieldnames=fieldnames,
        delimiter="\t",
        lineterminator="\n",
    )

    writer.writeheader()

    position_row_count = 0

    for scale in SCALES:

        for position in range(
            1,
            scale + 1,
        ):

            group = [
                r
                for r in measured
                if (
                    r["scale"] == scale
                    and
                    r[
                        "ballot_position"
                    ] == position
                )
            ]

            if len(group) != 5:
                raise RuntimeError(
                    f"scale={scale} "
                    f"position={position}: "
                    f"{len(group)} != 5"
                )

            g = describe(
                r["gas_used"]
                for r in group
            )

            l = describe(
                r["latency_ms"]
                for r in group
            )

            writer.writerow({
                "scale":
                    scale,
                "ballot_position":
                    position,
                "n":
                    5,

                "gas_mean":
                    f6(g["mean"]),
                "gas_median":
                    f6(g["median"]),
                "gas_min":
                    g["min"],
                "gas_max":
                    g["max"],
                "gas_sample_sd":
                    f6(
                        g["sample_sd"]
                    ),
                "gas_p95_nearest_rank":
                    g[
                        "p95_nearest_rank"
                    ],

                "latency_mean_ms":
                    f6(l["mean"]),
                "latency_median_ms":
                    f6(l["median"]),
                "latency_min_ms":
                    f6(l["min"]),
                "latency_max_ms":
                    f6(l["max"]),
                "latency_sample_sd_ms":
                    f6(
                        l["sample_sd"]
                    ),
                "latency_p95_nearest_rank_ms":
                    f6(
                        l[
                            "p95_nearest_rank"
                        ]
                    ),
            })

            position_row_count += 1


if position_row_count != 400:
    raise RuntimeError(
        f"position rows "
        f"{position_row_count} != 400"
    )


# ---------------------------------------------------------------------
# Overall measured statistics.
# ---------------------------------------------------------------------

overall_gas = describe(
    r["gas_used"]
    for r in measured
)

overall_latency = describe(
    r["latency_ms"]
    for r in measured
)


overall = {
    "allRawRows":
        2400,
    "warmupRowsExcludedFromStatistics":
        400,
    "measuredRowsIncluded":
        2000,
    "measuredIndependentElections":
        25,
    "silentOutlierDeletion":
        False,
    "calldataBytesPerVote":
        2340,
    "gas":
        overall_gas,
    "latencyMs":
        overall_latency,
    "postvalidationTrailingDiagnosticReceipts":
        postvalidation.get(
            "receiptFilesWithTrailingDiagnostic"
        ),
}


overall_path = (
    out_dir
    / "C7_OVERALL_MEASURED_SUMMARY.json"
)

with open(
    overall_path,
    "w",
    encoding="utf-8",
    newline="\n",
) as f:
    json.dump(
        overall,
        f,
        indent=2,
    )
    f.write("\n")


# ---------------------------------------------------------------------
# Human-readable Markdown report tables.
# ---------------------------------------------------------------------

report_path = (
    out_dir
    / "C7_REPORT_TABLES.md"
)

with open(
    report_path,
    "w",
    encoding="utf-8",
    newline="\n",
) as f:

    f.write(
        "# WP8E C7 Final Statistical Tables\n\n"
    )

    f.write(
        "Final campaign: `20261002_224441`\n\n"
    )

    f.write(
        "Only the 2,000 preregistered measured transactions are "
        "included in benchmark statistics. The 400 warm-up "
        "transactions are preserved but excluded. No outlier "
        "observations were deleted.\n\n"
    )

    f.write(
        "p95 uses the preregistered nearest-rank definition.\n\n"
    )

    f.write(
        "## Transaction-level statistics by accepted-ballot scale\n\n"
    )

    f.write(
        "| N | Measured tx | Gas mean | Gas median | "
        "Gas SD | Gas p95 | Latency mean (ms) | "
        "Latency median (ms) | Latency SD (ms) | "
        "Latency p95 (ms) |\n"
    )

    f.write(
        "|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n"
    )

    for x in transaction_rows:

        f.write(
            f"| {x['scale']} "
            f"| {x['measured_transactions']} "
            f"| {f3(x['gas_mean'])} "
            f"| {f3(x['gas_median'])} "
            f"| {f3(x['gas_sample_sd'])} "
            f"| {x['gas_p95_nearest_rank']} "
            f"| {f3(x['latency_mean_ms'])} "
            f"| {f3(x['latency_median_ms'])} "
            f"| {f3(x['latency_sample_sd_ms'])} "
            f"| {f3(x['latency_p95_nearest_rank_ms'])} |\n"
        )

    f.write(
        "\n## Independent-election mean statistics by scale\n\n"
    )

    f.write(
        "Each scale has five independent measured fresh-chain elections.\n\n"
    )

    f.write(
        "| N | Elections | Mean of election-mean gas | "
        "SD of election-mean gas | p95 election-mean gas | "
        "Mean of election-mean latency (ms) | "
        "SD of election-mean latency (ms) | "
        "p95 election-mean latency (ms) |\n"
    )

    f.write(
        "|---:|---:|---:|---:|---:|---:|---:|---:|\n"
    )

    for x in rep_scale_rows:

        f.write(
            f"| {x['scale']} "
            f"| {x['independent_measured_elections']} "
            f"| {f3(x['election_mean_gas_mean'])} "
            f"| {f3(x['election_mean_gas_sample_sd'])} "
            f"| {f3(x['election_mean_gas_p95_nearest_rank'])} "
            f"| {f3(x['election_mean_latency_mean_ms'])} "
            f"| {f3(x['election_mean_latency_sample_sd_ms'])} "
            f"| {f3(x['election_mean_latency_p95_nearest_rank_ms'])} |\n"
        )

    f.write(
        "\n## Overall measured observations\n\n"
    )

    f.write(
        f"- Measured transactions: {len(measured)}\n"
    )

    f.write(
        f"- Independent measured elections: {len(measured_reps)}\n"
    )

    f.write(
        f"- Overall gas mean: {f3(overall_gas['mean'])}\n"
    )

    f.write(
        f"- Overall gas median: {f3(overall_gas['median'])}\n"
    )

    f.write(
        f"- Overall gas sample SD: {f3(overall_gas['sample_sd'])}\n"
    )

    f.write(
        f"- Overall gas nearest-rank p95: "
        f"{overall_gas['p95_nearest_rank']}\n"
    )

    f.write(
        f"- Overall latency mean: "
        f"{f3(overall_latency['mean'])} ms\n"
    )

    f.write(
        f"- Overall latency median: "
        f"{f3(overall_latency['median'])} ms\n"
    )

    f.write(
        f"- Overall latency sample SD: "
        f"{f3(overall_latency['sample_sd'])} ms\n"
    )

    f.write(
        f"- Overall latency nearest-rank p95: "
        f"{f3(overall_latency['p95_nearest_rank'])} ms\n"
    )


print(
    "RAW_ROWS_TOTAL=2400"
)

print(
    "WARMUP_ROWS_PRESERVED=400"
)

print(
    "WARMUP_ROWS_INCLUDED_IN_FINAL_STATS=0"
)

print(
    "MEASURED_ROWS_INCLUDED=2000"
)

print(
    "MEASURED_INDEPENDENT_ELECTIONS=25"
)

print(
    "SILENT_OUTLIER_DELETION=NO"
)

print(
    "P95_DEFINITION=NEAREST_RANK"
)

print(
    "POSITION_LEVEL_ROWS=400"
)

print(
    "TRAILING_DIAGNOSTIC_RECEIPTS="
    + str(
        postvalidation.get(
            "receiptFilesWithTrailingDiagnostic"
        )
    )
)

print()
print(
    "=== TRANSACTION-LEVEL BY SCALE ==="
)

for x in transaction_rows:

    print(
        "SCALE="
        + str(x["scale"])
        + " TX="
        + str(
            x[
                "measured_transactions"
            ]
        )
        + " GAS_MEAN="
        + f3(
            x["gas_mean"]
        )
        + " GAS_MEDIAN="
        + f3(
            x["gas_median"]
        )
        + " GAS_SD="
        + f3(
            x["gas_sample_sd"]
        )
        + " GAS_P95="
        + str(
            x[
                "gas_p95_nearest_rank"
            ]
        )
        + " LAT_MEAN_MS="
        + f3(
            x["latency_mean_ms"]
        )
        + " LAT_MEDIAN_MS="
        + f3(
            x["latency_median_ms"]
        )
        + " LAT_SD_MS="
        + f3(
            x[
                "latency_sample_sd_ms"
            ]
        )
        + " LAT_P95_MS="
        + f3(
            x[
                "latency_p95_nearest_rank_ms"
            ]
        )
    )


print()
print(
    "=== REPETITION-LEVEL BY SCALE ==="
)

for x in rep_scale_rows:

    print(
        "SCALE="
        + str(x["scale"])
        + " ELECTIONS=5"
        + " ELECTION_MEAN_GAS="
        + f3(
            x[
                "election_mean_gas_mean"
            ]
        )
        + " ELECTION_MEAN_GAS_SD="
        + f3(
            x[
                "election_mean_gas_sample_sd"
            ]
        )
        + " ELECTION_MEAN_LAT_MS="
        + f3(
            x[
                "election_mean_latency_mean_ms"
            ]
        )
        + " ELECTION_MEAN_LAT_SD_MS="
        + f3(
            x[
                "election_mean_latency_sample_sd_ms"
            ]
        )
    )


print()
print(
    "=== OVERALL MEASURED ==="
)

print(
    "OVERALL_MEASURED_TX=2000"
)

print(
    "OVERALL_GAS_MEAN="
    + f3(
        overall_gas["mean"]
    )
)

print(
    "OVERALL_GAS_MEDIAN="
    + f3(
        overall_gas["median"]
    )
)

print(
    "OVERALL_GAS_MIN="
    + str(
        overall_gas["min"]
    )
)

print(
    "OVERALL_GAS_MAX="
    + str(
        overall_gas["max"]
    )
)

print(
    "OVERALL_GAS_SAMPLE_SD="
    + f3(
        overall_gas["sample_sd"]
    )
)

print(
    "OVERALL_GAS_P95="
    + str(
        overall_gas[
            "p95_nearest_rank"
        ]
    )
)

print(
    "OVERALL_LATENCY_MEAN_MS="
    + f3(
        overall_latency["mean"]
    )
)

print(
    "OVERALL_LATENCY_MEDIAN_MS="
    + f3(
        overall_latency["median"]
    )
)

print(
    "OVERALL_LATENCY_MIN_MS="
    + f3(
        overall_latency["min"]
    )
)

print(
    "OVERALL_LATENCY_MAX_MS="
    + f3(
        overall_latency["max"]
    )
)

print(
    "OVERALL_LATENCY_SAMPLE_SD_MS="
    + f3(
        overall_latency["sample_sd"]
    )
)

print(
    "OVERALL_LATENCY_P95_MS="
    + f3(
        overall_latency[
            "p95_nearest_rank"
        ]
    )
)

print()
print(
    "STATISTICAL_ANALYSIS=PASS"
)
