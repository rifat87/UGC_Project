import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt


tx_path = Path(sys.argv[1])
rep_path = Path(sys.argv[2])
position_path = Path(sys.argv[3])
audit_path = Path(sys.argv[4])
figure_dir = Path(sys.argv[5])
caption_path = Path(sys.argv[6])
data_path = Path(sys.argv[7])

figure_dir.mkdir(
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
    tx_path
)

rep_rows = load_tsv(
    rep_path
)

position_rows = load_tsv(
    position_path
)

with open(
    audit_path,
    encoding="utf-8",
) as f:
    audit = json.load(f)


if len(tx_rows) != 5:
    raise RuntimeError(
        "expected five transaction-scale rows"
    )

if len(rep_rows) != 25:
    raise RuntimeError(
        "expected 25 measured election rows"
    )

if len(position_rows) != 400:
    raise RuntimeError(
        "expected 400 position rows"
    )

if audit.get("status") != "PASS":
    raise RuntimeError(
        "C7B interpretation audit not PASS"
    )


tx = {}

for r in tx_rows:

    n = int(
        r["scale"]
    )

    tx[n] = {
        "median_gas":
            float(
                r["gas_median"]
            ),
        "p95_gas":
            float(
                r[
                    "gas_p95_nearest_rank"
                ]
            ),
        "mean_gas":
            float(
                r["gas_mean"]
            ),
        "mean_latency":
            float(
                r["latency_mean_ms"]
            ),
        "median_latency":
            float(
                r["latency_median_ms"]
            ),
        "p95_latency":
            float(
                r[
                    "latency_p95_nearest_rank_ms"
                ]
            ),
    }


position_150 = []

for r in position_rows:

    if int(
        r["scale"]
    ) == 150:

        position_150.append({
            "position":
                int(
                    r["ballot_position"]
                ),
            "gas_mean":
                float(
                    r["gas_mean"]
                ),
            "latency_mean":
                float(
                    r["latency_mean_ms"]
                ),
        })


position_150.sort(
    key=lambda x: x["position"]
)


if len(position_150) != 150:
    raise RuntimeError(
        "N=150 position table incomplete"
    )


repetition_latency = defaultdict(
    list
)

for r in rep_rows:

    n = int(
        r["scale"]
    )

    repetition_latency[n].append(
        float(
            r["latency_mean_ms"]
        )
    )


for n in SCALES:

    if len(
        repetition_latency[n]
    ) != 5:
        raise RuntimeError(
            f"N={n}: expected five repetition means"
        )


# -------------------------------------------------------------
# Figure 1:
# Typical per-vote gas by accepted-ballot scale.
# Median + nearest-rank p95 intentionally shown rather than
# pooled mean because C7B established the single first-vote
# initialization premium.
# -------------------------------------------------------------

fig, ax = plt.subplots(
    figsize=(7.2, 4.6)
)

ax.plot(
    SCALES,
    [
        tx[n]["median_gas"]
        for n in SCALES
    ],
    marker="o",
    label="Median gas",
)

ax.plot(
    SCALES,
    [
        tx[n]["p95_gas"]
        for n in SCALES
    ],
    marker="s",
    label="Nearest-rank p95 gas",
)

ax.set_xlabel(
    "Accepted ballots in fresh election (N)"
)

ax.set_ylabel(
    "Gas used per accepted castVote"
)

ax.set_title(
    "Typical castVote gas remains stable across accepted-ballot scale"
)

ax.ticklabel_format(
    axis="y",
    style="plain",
    useOffset=False,
)

ax.grid(
    True,
    axis="y",
    alpha=0.25,
)

ax.legend()

fig.tight_layout()

fig.savefig(
    figure_dir
    / "Figure_C7C_1_typical_gas_by_scale.png",
    dpi=300,
    bbox_inches="tight",
)

fig.savefig(
    figure_dir
    / "Figure_C7C_1_typical_gas_by_scale.svg",
    bbox_inches="tight",
)

plt.close(fig)


# -------------------------------------------------------------
# Figure 2:
# Position-level gas in N=150.
# This directly exposes the first-vote initialization effect.
# -------------------------------------------------------------

fig, ax = plt.subplots(
    figsize=(7.2, 4.6)
)

ax.plot(
    [
        x["position"]
        for x in position_150
    ],
    [
        x["gas_mean"]
        for x in position_150
    ],
)

ax.scatter(
    [1],
    [
        position_150[0][
            "gas_mean"
        ]
    ],
    marker="o",
    label="First accepted vote",
)

ax.set_xlabel(
    "Accepted-ballot position"
)

ax.set_ylabel(
    "Mean gas used across 5 measured elections"
)

ax.set_title(
    "N=150 position-level gas exposes the first-vote initialization premium"
)

ax.ticklabel_format(
    axis="y",
    style="plain",
    useOffset=False,
)

ax.grid(
    True,
    axis="y",
    alpha=0.25,
)

ax.legend()

fig.tight_layout()

fig.savefig(
    figure_dir
    / "Figure_C7C_2_position_gas_n150.png",
    dpi=300,
    bbox_inches="tight",
)

fig.savefig(
    figure_dir
    / "Figure_C7C_2_position_gas_n150.svg",
    bbox_inches="tight",
)

plt.close(fig)


# -------------------------------------------------------------
# Figure 3:
# Local wall-clock cast-to-receipt latency by scale.
# No regression/trend fit is added because C7B found a
# non-monotonic descriptive pattern.
# -------------------------------------------------------------

fig, ax = plt.subplots(
    figsize=(7.2, 4.6)
)

ax.plot(
    SCALES,
    [
        tx[n]["mean_latency"]
        for n in SCALES
    ],
    marker="o",
    label="Mean latency",
)

ax.plot(
    SCALES,
    [
        tx[n]["median_latency"]
        for n in SCALES
    ],
    marker="s",
    label="Median latency",
)

ax.plot(
    SCALES,
    [
        tx[n]["p95_latency"]
        for n in SCALES
    ],
    marker="^",
    label="Nearest-rank p95 latency",
)

ax.set_xlabel(
    "Accepted ballots in fresh election (N)"
)

ax.set_ylabel(
    "Local cast-to-receipt latency (ms)"
)

ax.set_title(
    "Local transaction latency is non-monotonic across accepted-ballot scale"
)

ax.grid(
    True,
    axis="y",
    alpha=0.25,
)

ax.legend()

fig.tight_layout()

fig.savefig(
    figure_dir
    / "Figure_C7C_3_local_latency_by_scale.png",
    dpi=300,
    bbox_inches="tight",
)

fig.savefig(
    figure_dir
    / "Figure_C7C_3_local_latency_by_scale.svg",
    bbox_inches="tight",
)

plt.close(fig)


# -------------------------------------------------------------
# Figure 4:
# Distribution of the five independent fresh-chain election
# mean latencies for each scale.
# -------------------------------------------------------------

fig, ax = plt.subplots(
    figsize=(7.2, 4.6)
)

data = [
    repetition_latency[n]
    for n in SCALES
]

ax.boxplot(
    data,
    tick_labels=[
        str(n)
        for n in SCALES
    ],
)

ax.set_xlabel(
    "Accepted ballots in fresh election (N)"
)

ax.set_ylabel(
    "Mean local latency per measured election (ms)"
)

ax.set_title(
    "Between-election variation in local cast-to-receipt latency"
)

ax.grid(
    True,
    axis="y",
    alpha=0.25,
)

fig.tight_layout()

fig.savefig(
    figure_dir
    / "Figure_C7C_4_election_mean_latency.png",
    dpi=300,
    bbox_inches="tight",
)

fig.savefig(
    figure_dir
    / "Figure_C7C_4_election_mean_latency.svg",
    bbox_inches="tight",
)

plt.close(fig)


# -------------------------------------------------------------
# Frozen plotted-data record.
# -------------------------------------------------------------

plotted = {
    "scales":
        SCALES,

    "figure1": {
        "medianGas": {
            str(n):
                tx[n]["median_gas"]
            for n in SCALES
        },
        "nearestRankP95Gas": {
            str(n):
                tx[n]["p95_gas"]
            for n in SCALES
        },
    },

    "figure2": {
        "scale":
            150,
        "positions":
            position_150,
        "position1Gas":
            position_150[0][
                "gas_mean"
            ],
        "c7bPosition1PremiumPct":
            audit[
                "positionLevelReview"
            ]["150"][
                "position1GasPremiumPctVs2ToN"
            ],
    },

    "figure3": {
        "meanLatencyMs": {
            str(n):
                tx[n]["mean_latency"]
            for n in SCALES
        },
        "medianLatencyMs": {
            str(n):
                tx[n]["median_latency"]
            for n in SCALES
        },
        "nearestRankP95LatencyMs": {
            str(n):
                tx[n]["p95_latency"]
            for n in SCALES
        },
    },

    "figure4": {
        "independentElectionMeanLatencyMs": {
            str(n):
                repetition_latency[n]
            for n in SCALES
        },
    },

    "trailingDiagnosticObservationCount":
        audit[
            "trailingDiagnosticObservationCount"
        ],

    "overallLatencyMaxHasTrailingDiagnostic":
        audit[
            "overallLatencyMaxHasTrailingDiagnostic"
        ],
}


with open(
    data_path,
    "w",
    encoding="utf-8",
    newline="\n",
) as f:
    json.dump(
        plotted,
        f,
        indent=2,
    )
    f.write("\n")


# -------------------------------------------------------------
# Publication-safe captions.
# -------------------------------------------------------------

captions = """# WP8E C7C Publication Figure Captions

## Figure 1 — Typical castVote gas by accepted-ballot scale

Median and nearest-rank p95 gas consumption for accepted `castVote` transactions
across fresh elections containing N = 25, 50, 75, 100, and 150 sequential accepted
ballots. Each scale contains five independent measured fresh-chain elections.
Median gas ranges only from 1,307,326 to 1,307,403 gas and nearest-rank p95 ranges
from 1,307,759 to 1,307,997 gas, indicating that typical accepted-vote execution
cost is nearly invariant over this accepted-ballot state-growth range for the
frozen 4-candidate, 16-slot DIRECT profile.

This figure evaluates accepted-ballot accumulation only; it does not substitute
for the separate candidate-count or eligible-set-size experimental dimensions.


## Figure 2 — Position-level gas at N=150

Mean gas consumption by sequential accepted-ballot position across the five
independent measured N=150 elections. The first accepted vote consumes
1,866,414 gas, while positions 2..150 remain near approximately 1.307 million
gas. The first vote is about 42.77% more expensive than the mean of positions
2..150 because it initializes previously empty persistent tally/nullifier state.
Consequently, the lower pooled mean gas at larger N is primarily a dilution of
this one-time first-vote initialization cost and should not be interpreted as
evidence that increasing election state intrinsically reduces per-vote gas.


## Figure 3 — Local cast-to-receipt latency by scale

Mean, median, and nearest-rank p95 wall-clock latency measured from local
`cast send` start until receipt return for accepted transactions. Latency is
non-monotonic across N = 25..150; scale-level mean latency ranges from roughly
749.9 ms to 773.7 ms. These measurements describe the local Anvil/Foundry
process and RPC environment only. They are not Groth16 proving time and are
not public Ethereum network confirmation latency.


## Figure 4 — Independent-election mean latency by scale

Distribution of mean local cast-to-receipt latency across the five independent
measured fresh-chain elections at each accepted-ballot scale. Unlike gas,
which is deterministic for the repeated frozen transaction/state sequence,
wall-clock latency varies across repetitions. The figure therefore presents
between-election timing variability without fitting or implying a monotonic
scaling model.


## Measurement notes

- Final campaign: `20261002_224441`.
- 2,000 preregistered measured transactions are used for reported statistics.
- 400 warm-up transactions are preserved but excluded from final statistics.
- No silent outlier deletion was performed.
- p95 is nearest-rank.
- Two successful receipts contained trailing local RPC diagnostic text; both
  observations remain in the dataset.
- Neither trailing-diagnostic observation is the overall maximum-latency
  observation.
- The earlier aborted instrumentation campaign is excluded from all final
  benchmark statistics.
"""


caption_path.write_text(
    captions,
    encoding="utf-8",
    newline="\n",
)


print(
    "FIGURE_COUNT=4"
)

print(
    "PNG_COUNT=4"
)

print(
    "SVG_COUNT=4"
)

print(
    "FIGURE_1=typical_gas_by_scale"
)

print(
    "FIGURE_2=position_gas_n150"
)

print(
    "FIGURE_3=local_latency_by_scale"
)

print(
    "FIGURE_4=election_mean_latency"
)

print(
    "REGRESSION_OR_TREND_MODEL_ADDED=NO"
)

print(
    "OUTLIER_DELETION=NO"
)

print(
    "FIGURE_GENERATION=PASS"
)
