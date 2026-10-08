import csv
import json
import statistics
import sys
from collections import defaultdict
from pathlib import Path

tx_table = Path(sys.argv[1])
rep_table = Path(sys.argv[2])
position_table = Path(sys.argv[3])
raw_path = Path(sys.argv[4])
postvalidation_path = Path(sys.argv[5])
out_json = Path(sys.argv[6])
out_txt = Path(sys.argv[7])

SCALES = [25, 50, 75, 100, 150]


def load_tsv(path):
    with open(
        path,
        encoding="utf-8",
        newline="",
    ) as f:
        return list(
            csv.DictReader(
                f,
                delimiter="\t",
            )
        )


tx_rows = load_tsv(
    tx_table
)

rep_rows = load_tsv(
    rep_table
)

position_rows = load_tsv(
    position_table
)

raw_rows = load_tsv(
    raw_path
)

with open(
    postvalidation_path,
    encoding="utf-8",
) as f:
    post = json.load(f)


if len(tx_rows) != 5:
    raise RuntimeError(
        f"transaction scale rows {len(tx_rows)} != 5"
    )

if len(rep_rows) != 25:
    raise RuntimeError(
        f"measured election rows {len(rep_rows)} != 25"
    )

if len(position_rows) != 400:
    raise RuntimeError(
        f"position rows {len(position_rows)} != 400"
    )

if len(raw_rows) != 2400:
    raise RuntimeError(
        f"raw rows {len(raw_rows)} != 2400"
    )


tx = {}

for r in tx_rows:

    scale = int(
        r["scale"]
    )

    tx[scale] = {
        "n":
            int(
                r[
                    "measured_transactions"
                ]
            ),
        "gas_mean":
            float(
                r["gas_mean"]
            ),
        "gas_median":
            float(
                r["gas_median"]
            ),
        "gas_sd":
            float(
                r["gas_sample_sd"]
            ),
        "gas_p95":
            float(
                r[
                    "gas_p95_nearest_rank"
                ]
            ),
        "lat_mean":
            float(
                r["latency_mean_ms"]
            ),
        "lat_median":
            float(
                r["latency_median_ms"]
            ),
        "lat_sd":
            float(
                r[
                    "latency_sample_sd_ms"
                ]
            ),
        "lat_p95":
            float(
                r[
                    "latency_p95_nearest_rank_ms"
                ]
            ),
    }


def pct_change(a, b):
    return (
        (b - a)
        / a
        * 100.0
    )


scale_review = {
    "gasMeanN25":
        tx[25]["gas_mean"],
    "gasMeanN150":
        tx[150]["gas_mean"],
    "gasMeanDelta":
        (
            tx[150]["gas_mean"]
            - tx[25]["gas_mean"]
        ),
    "gasMeanPctChange25To150":
        pct_change(
            tx[25]["gas_mean"],
            tx[150]["gas_mean"],
        ),

    "gasMedianAcrossScaleMin":
        min(
            tx[s]["gas_median"]
            for s in SCALES
        ),
    "gasMedianAcrossScaleMax":
        max(
            tx[s]["gas_median"]
            for s in SCALES
        ),

    "gasP95AcrossScaleMin":
        min(
            tx[s]["gas_p95"]
            for s in SCALES
        ),
    "gasP95AcrossScaleMax":
        max(
            tx[s]["gas_p95"]
            for s in SCALES
        ),

    "latencyMeanAcrossScaleMin":
        min(
            tx[s]["lat_mean"]
            for s in SCALES
        ),
    "latencyMeanAcrossScaleMax":
        max(
            tx[s]["lat_mean"]
            for s in SCALES
        ),
    "latencyMeanN25":
        tx[25]["lat_mean"],
    "latencyMeanN150":
        tx[150]["lat_mean"],
    "latencyMeanPctChange25To150":
        pct_change(
            tx[25]["lat_mean"],
            tx[150]["lat_mean"],
        ),

    "latencyP95AcrossScaleMin":
        min(
            tx[s]["lat_p95"]
            for s in SCALES
        ),
    "latencyP95AcrossScaleMax":
        max(
            tx[s]["lat_p95"]
            for s in SCALES
        ),
}


positions = defaultdict(
    list
)

for r in position_rows:

    scale = int(
        r["scale"]
    )

    positions[scale].append({
        "position":
            int(
                r["ballot_position"]
            ),
        "n":
            int(r["n"]),
        "gas_mean":
            float(
                r["gas_mean"]
            ),
        "gas_median":
            float(
                r["gas_median"]
            ),
        "gas_min":
            float(
                r["gas_min"]
            ),
        "gas_max":
            float(
                r["gas_max"]
            ),
        "gas_sd":
            float(
                r["gas_sample_sd"]
            ),
        "lat_mean":
            float(
                r["latency_mean_ms"]
            ),
        "lat_median":
            float(
                r["latency_median_ms"]
            ),
        "lat_min":
            float(
                r["latency_min_ms"]
            ),
        "lat_max":
            float(
                r["latency_max_ms"]
            ),
        "lat_sd":
            float(
                r[
                    "latency_sample_sd_ms"
                ]
            ),
    })


position_review = {}

for scale in SCALES:

    group = sorted(
        positions[scale],
        key=lambda x: x["position"],
    )

    if len(group) != scale:
        raise RuntimeError(
            f"scale {scale}: "
            f"position rows {len(group)} != {scale}"
        )

    if any(
        x["n"] != 5
        for x in group
    ):
        raise RuntimeError(
            f"scale {scale}: "
            "position n != 5"
        )

    first = group[0]
    second = group[1]
    last = group[-1]

    later = group[1:]

    later_gas_mean = (
        statistics.mean(
            x["gas_mean"]
            for x in later
        )
    )

    later_lat_mean = (
        statistics.mean(
            x["lat_mean"]
            for x in later
        )
    )

    gas_max_row = max(
        group,
        key=lambda x: x["gas_mean"],
    )

    gas_min_row = min(
        group,
        key=lambda x: x["gas_mean"],
    )

    lat_max_row = max(
        group,
        key=lambda x: x["lat_mean"],
    )

    lat_min_row = min(
        group,
        key=lambda x: x["lat_mean"],
    )

    position_review[str(scale)] = {
        "position1GasMean":
            first["gas_mean"],
        "position2GasMean":
            second["gas_mean"],
        "lastPositionGasMean":
            last["gas_mean"],
        "positions2ToNMeanGas":
            later_gas_mean,
        "position1GasPremiumVs2ToN":
            (
                first["gas_mean"]
                - later_gas_mean
            ),
        "position1GasPremiumPctVs2ToN":
            pct_change(
                later_gas_mean,
                first["gas_mean"],
            ),
        "maxMeanGasPosition":
            gas_max_row["position"],
        "maxMeanGas":
            gas_max_row["gas_mean"],
        "minMeanGasPosition":
            gas_min_row["position"],
        "minMeanGas":
            gas_min_row["gas_mean"],

        "position1LatencyMeanMs":
            first["lat_mean"],
        "position2LatencyMeanMs":
            second["lat_mean"],
        "lastPositionLatencyMeanMs":
            last["lat_mean"],
        "positions2ToNMeanLatencyMs":
            later_lat_mean,
        "maxMeanLatencyPosition":
            lat_max_row["position"],
        "maxMeanLatencyMs":
            lat_max_row["lat_mean"],
        "minMeanLatencyPosition":
            lat_min_row["position"],
        "minMeanLatencyMs":
            lat_min_row["lat_mean"],
    }


rep_by_scale = defaultdict(
    list
)

for r in rep_rows:

    scale = int(
        r["scale"]
    )

    rep_by_scale[scale].append({
        "repetition_id":
            r["repetition_id"],
        "round":
            int(
                r["measured_round"]
            ),
        "gas_mean":
            float(
                r["gas_mean"]
            ),
        "lat_mean":
            float(
                r["latency_mean_ms"]
            ),
    })


rep_review = {}

for scale in SCALES:

    group = rep_by_scale[
        scale
    ]

    if len(group) != 5:
        raise RuntimeError(
            f"scale {scale}: "
            f"rep rows {len(group)} != 5"
        )

    gas_values = [
        x["gas_mean"]
        for x in group
    ]

    lat_values = [
        x["lat_mean"]
        for x in group
    ]

    rep_review[str(scale)] = {
        "gasMeanMin":
            min(gas_values),
        "gasMeanMax":
            max(gas_values),
        "gasMeanRange":
            (
                max(gas_values)
                - min(gas_values)
            ),
        "gasMeansIdentical":
            (
                len(
                    set(gas_values)
                )
                == 1
            ),
        "latencyMeanMinMs":
            min(lat_values),
        "latencyMeanMaxMs":
            max(lat_values),
        "latencyMeanRangeMs":
            (
                max(lat_values)
                - min(lat_values)
            ),
        "latencyElectionMeansMs":
            lat_values,
    }


raw_by_identity = {
    (
        r["repetition_id"],
        r["ballot_id"],
    ): r
    for r in raw_rows
}


trailing = (
    post.get(
        "trailingDiagnosticReceipts"
    )
    or []
)


if len(trailing) != 2:
    raise RuntimeError(
        f"trailing diagnostic count "
        f"{len(trailing)} != 2"
    )


diagnostic_review = []

for item in trailing:

    rep = item[
        "repetitionId"
    ]

    ballot = item[
        "ballotId"
    ]

    key = (
        rep,
        ballot,
    )

    if key not in raw_by_identity:
        raise RuntimeError(
            f"diagnostic identity "
            f"{key} missing from raw"
        )

    r = raw_by_identity[
        key
    ]

    diagnostic_review.append({
        "repetitionId":
            rep,
        "ballotId":
            ballot,
        "scale":
            int(r["scale"]),
        "ballotPosition":
            int(
                r[
                    "ballot_position"
                ]
            ),
        "gasUsed":
            int(
                r["gas_used"]
            ),
        "latencyMs":
            float(
                r["latency_ms"]
            ),
        "trailingBytes":
            item.get(
                "trailingBytes"
            ),
    })


measured_raw = [
    r
    for r in raw_rows
    if r["kind"] == "measured"
]


overall_latency_max = max(
    float(
        r["latency_ms"]
    )
    for r in measured_raw
)


overall_latency_max_rows = [
    {
        "repetitionId":
            r["repetition_id"],
        "ballotId":
            r["ballot_id"],
        "scale":
            int(r["scale"]),
        "ballotPosition":
            int(
                r["ballot_position"]
            ),
        "latencyMs":
            float(
                r["latency_ms"]
            ),
    }
    for r in measured_raw
    if float(
        r["latency_ms"]
    ) == overall_latency_max
]


diagnostic_identities = {
    (
        x["repetitionId"],
        x["ballotId"],
    )
    for x in diagnostic_review
}


max_latency_is_diagnostic = any(
    (
        x["repetitionId"],
        x["ballotId"],
    )
    in diagnostic_identities
    for x in overall_latency_max_rows
)


audit = {
    "status":
        "PASS",

    "scaleLevelReview":
        scale_review,

    "positionLevelReview":
        position_review,

    "independentElectionReview":
        rep_review,

    "trailingDiagnosticObservationCount":
        len(
            diagnostic_review
        ),

    "trailingDiagnosticObservations":
        diagnostic_review,

    "overallMeasuredLatencyMaxMs":
        overall_latency_max,

    "overallMeasuredLatencyMaxObservations":
        overall_latency_max_rows,

    "overallLatencyMaxHasTrailingDiagnostic":
        max_latency_is_diagnostic,

    "interpretationGuardrails": [
        (
            "Do not interpret a decline in pooled "
            "mean gas across N as evidence that "
            "larger election state intrinsically "
            "reduces castVote cost without first "
            "considering the position-1 effect."
        ),
        (
            "Median gas and nearest-rank p95 are "
            "preferred companions to the pooled mean "
            "for describing typical per-vote gas."
        ),
        (
            "Zero between-repetition gas-mean spread "
            "reflects deterministic execution of the "
            "same frozen transaction/state sequence "
            "on fresh deterministic local chains; "
            "it is not a claim of zero deployment "
            "uncertainty."
        ),
        (
            "Latency is local cast-send-start to "
            "receipt-return process/RPC wall-clock "
            "latency, not Groth16 proving time and "
            "not public-network confirmation latency."
        ),
        (
            "Both trailing-diagnostic observations "
            "remain included; no observation is "
            "deleted or reconstructed."
        ),
    ],
}


with open(
    out_json,
    "w",
    encoding="utf-8",
    newline="\n",
) as f:
    json.dump(
        audit,
        f,
        indent=2,
    )
    f.write("\n")


lines = []

lines.append(
    "WP8E C7B FINAL STATISTICAL INTERPRETATION AUDIT"
)

lines.append(
    "================================================"
)

lines.append("")

lines.append(
    "SCALE-LEVEL GAS"
)

lines.append(
    "---------------"
)

lines.append(
    "GAS_MEAN_N25="
    + f"{scale_review['gasMeanN25']:.3f}"
)

lines.append(
    "GAS_MEAN_N150="
    + f"{scale_review['gasMeanN150']:.3f}"
)

lines.append(
    "GAS_MEAN_PCT_CHANGE_25_TO_150="
    + f"{scale_review['gasMeanPctChange25To150']:.6f}%"
)

lines.append(
    "GAS_MEDIAN_SCALE_RANGE="
    + f"{scale_review['gasMedianAcrossScaleMin']:.3f}"
    + ".."
    + f"{scale_review['gasMedianAcrossScaleMax']:.3f}"
)

lines.append(
    "GAS_P95_SCALE_RANGE="
    + f"{scale_review['gasP95AcrossScaleMin']:.3f}"
    + ".."
    + f"{scale_review['gasP95AcrossScaleMax']:.3f}"
)

lines.append("")

lines.append(
    "SCALE-LEVEL LATENCY"
)

lines.append(
    "-------------------"
)

lines.append(
    "LAT_MEAN_N25_MS="
    + f"{scale_review['latencyMeanN25']:.3f}"
)

lines.append(
    "LAT_MEAN_N150_MS="
    + f"{scale_review['latencyMeanN150']:.3f}"
)

lines.append(
    "LAT_MEAN_PCT_CHANGE_25_TO_150="
    + f"{scale_review['latencyMeanPctChange25To150']:.6f}%"
)

lines.append(
    "LAT_MEAN_SCALE_RANGE_MS="
    + f"{scale_review['latencyMeanAcrossScaleMin']:.3f}"
    + ".."
    + f"{scale_review['latencyMeanAcrossScaleMax']:.3f}"
)

lines.append(
    "LAT_P95_SCALE_RANGE_MS="
    + f"{scale_review['latencyP95AcrossScaleMin']:.3f}"
    + ".."
    + f"{scale_review['latencyP95AcrossScaleMax']:.3f}"
)

lines.append("")

lines.append(
    "POSITION-LEVEL GAS / LATENCY"
)

lines.append(
    "----------------------------"
)

for scale in SCALES:

    x = position_review[
        str(scale)
    ]

    lines.append(
        "SCALE="
        + str(scale)
        + " POS1_GAS="
        + f"{x['position1GasMean']:.3f}"
        + " POS2_TO_N_GAS_MEAN="
        + f"{x['positions2ToNMeanGas']:.3f}"
        + " POS1_PREMIUM_GAS="
        + f"{x['position1GasPremiumVs2ToN']:.3f}"
        + " POS1_PREMIUM_PCT="
        + f"{x['position1GasPremiumPctVs2ToN']:.6f}%"
        + " LAST_GAS="
        + f"{x['lastPositionGasMean']:.3f}"
        + " MAX_GAS_POSITION="
        + str(
            x[
                'maxMeanGasPosition'
            ]
        )
    )

    lines.append(
        "SCALE="
        + str(scale)
        + " POS1_LAT_MS="
        + f"{x['position1LatencyMeanMs']:.3f}"
        + " POS2_TO_N_LAT_MEAN_MS="
        + f"{x['positions2ToNMeanLatencyMs']:.3f}"
        + " LAST_LAT_MS="
        + f"{x['lastPositionLatencyMeanMs']:.3f}"
        + " MAX_LAT_POSITION="
        + str(
            x[
                'maxMeanLatencyPosition'
            ]
        )
        + " MAX_LAT_MEAN_MS="
        + f"{x['maxMeanLatencyMs']:.3f}"
    )


lines.append("")

lines.append(
    "INDEPENDENT-ELECTION REPRODUCIBILITY"
)

lines.append(
    "------------------------------------"
)

for scale in SCALES:

    x = rep_review[
        str(scale)
    ]

    lines.append(
        "SCALE="
        + str(scale)
        + " GAS_MEANS_IDENTICAL="
        + (
            "YES"
            if x[
                "gasMeansIdentical"
            ]
            else "NO"
        )
        + " GAS_MEAN_RANGE="
        + f"{x['gasMeanRange']:.6f}"
        + " LAT_ELECTION_MEAN_RANGE_MS="
        + f"{x['latencyMeanRangeMs']:.3f}"
    )


lines.append("")

lines.append(
    "TRAILING-DIAGNOSTIC OBSERVATIONS"
)

lines.append(
    "--------------------------------"
)

lines.append(
    "TRAILING_DIAGNOSTIC_COUNT="
    + str(
        len(
            diagnostic_review
        )
    )
)

for i, x in enumerate(
    diagnostic_review,
    start=1,
):

    lines.append(
        "DIAGNOSTIC_"
        + str(i)
        + "_IDENTITY="
        + x["repetitionId"]
        + "+"
        + x["ballotId"]
    )

    lines.append(
        "DIAGNOSTIC_"
        + str(i)
        + "_LATENCY_MS="
        + f"{x['latencyMs']:.6f}"
    )

    lines.append(
        "DIAGNOSTIC_"
        + str(i)
        + "_GAS_USED="
        + str(
            x["gasUsed"]
        )
    )


lines.append(
    "OVERALL_MEASURED_LATENCY_MAX_MS="
    + f"{overall_latency_max:.6f}"
)

lines.append(
    "OVERALL_LATENCY_MAX_HAS_TRAILING_DIAGNOSTIC="
    + (
        "YES"
        if max_latency_is_diagnostic
        else "NO"
    )
)

lines.append("")

lines.append(
    "INTERPRETATION GUARDRAILS"
)

lines.append(
    "-------------------------"
)

for i, text in enumerate(
    audit[
        "interpretationGuardrails"
    ],
    start=1,
):
    lines.append(
        f"{i}. {text}"
    )


lines.append("")

lines.append(
    "INTERPRETATION_AUDIT=PASS"
)


text = "\n".join(
    lines
) + "\n"


out_txt.write_text(
    text,
    encoding="utf-8",
    newline="\n",
)


print(text, end="")
