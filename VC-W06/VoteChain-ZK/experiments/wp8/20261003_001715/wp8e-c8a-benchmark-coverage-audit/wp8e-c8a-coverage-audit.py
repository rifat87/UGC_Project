import csv
import json
import re
import sys
from pathlib import Path

root = Path(sys.argv[1])
protocol_path = Path(sys.argv[2])
raw_path = Path(sys.argv[3])
complete_path = Path(sys.argv[4])
environment_path = Path(sys.argv[5])
out_dir = Path(sys.argv[6])

protocol = protocol_path.read_text(
    encoding="utf-8",
    errors="replace",
)

with open(
    complete_path,
    encoding="utf-8",
) as f:
    complete = json.load(f)

with open(
    raw_path,
    encoding="utf-8",
    newline="",
) as f:
    raw = list(
        csv.DictReader(
            f,
            delimiter="\t",
        )
    )


if len(raw) != 2400:
    raise RuntimeError(
        f"final raw rows {len(raw)} != 2400"
    )


if complete.get(
    "status"
) != "PASS":
    raise RuntimeError(
        "final campaign status != PASS"
    )


if complete.get(
    "totalAcceptedTx"
) != 2400:
    raise RuntimeError(
        "final accepted tx != 2400"
    )


measured = [
    r
    for r in raw
    if r["kind"] == "measured"
]

warmup = [
    r
    for r in raw
    if r["kind"] == "warmup"
]


if len(measured) != 2000:
    raise RuntimeError(
        "measured tx != 2000"
    )


if len(warmup) != 400:
    raise RuntimeError(
        "warmup tx != 400"
    )


# The coverage matrix intentionally distinguishes:
# 1. what the frozen protocol planned,
# 2. what has final campaign evidence,
# 3. pilot/development evidence that does NOT satisfy a final dimension.


coverage = [
    {
        "dimension":
            "Accepted-ballot accumulation / state growth",
        "planned_values":
            "N={25,50,75,100,150}",
        "final_status":
            "COMPLETE",
        "evidence":
            (
                "C6C-R3 final campaign + "
                "C7 statistics + C7B interpretation + "
                "C7C publication figures"
            ),
        "final_observations":
            2000,
        "independent_measured_elections":
            25,
        "publication_use":
            "YES",
        "notes":
            (
                "Five independent measured fresh-chain elections "
                "per scale; warm-ups excluded; no outlier deletion."
            ),
    },

    {
        "dimension":
            "Fresh-chain vote microbenchmark",
        "planned_values":
            "5 warm-ups + 20 measured fresh chains",
        "final_status":
            "PENDING_FINAL",
        "evidence":
            (
                "Earlier A1A/A1B and C5B work is validation/pilot "
                "evidence, not the preregistered final microbenchmark."
            ),
        "final_observations":
            0,
        "independent_measured_elections":
            0,
        "publication_use":
            "NOT_YET",
        "notes":
            (
                "Must not promote pilot timings/gas into final "
                "microbenchmark statistics."
            ),
    },

    {
        "dimension":
            "Candidate-count matrix",
        "planned_values":
            "candidateCount={2,4,8,16}",
        "final_status":
            "PENDING_FINAL",
        "evidence":
            (
                "Current completed final campaign fixes "
                "candidateCount=4."
            ),
        "final_observations":
            0,
        "independent_measured_elections":
            0,
        "publication_use":
            "NOT_YET",
        "notes":
            (
                "Accepted-ballot scaling must not be substituted "
                "for candidate-count scaling."
            ),
    },

    {
        "dimension":
            "Eligible-set-size matrix",
        "planned_values":
            "eligibleSet={10,100,1000,10000}",
        "final_status":
            "PENDING_FINAL",
        "evidence":
            (
                "Current completed final campaign uses one frozen "
                "eligibility corpus/root profile."
            ),
        "final_observations":
            0,
        "independent_measured_elections":
            0,
        "publication_use":
            "NOT_YET",
        "notes":
            (
                "Accepted-ballot scaling must not be substituted "
                "for eligible-set-size scaling."
            ),
    },

    {
        "dimension":
            "Historical pre-ZKP comparison",
        "planned_values":
            "published LocalVoting historical baseline",
        "final_status":
            "REFERENCE_ONLY",
        "evidence":
            (
                "Published 2026 paper + canonical pre-ZKP manual."
            ),
        "final_observations":
            0,
        "independent_measured_elections":
            0,
        "publication_use":
            "QUALIFIED_ONLY",
        "notes":
            (
                "Useful historical anchor, but not a controlled "
                "A/B estimate of DIRECT ZKP overhead."
            ),
    },
]


coverage_path = (
    out_dir
    / "C8A_BENCHMARK_COVERAGE_MATRIX.tsv"
)

with open(
    coverage_path,
    "w",
    encoding="utf-8",
    newline="",
) as f:

    fields = [
        "dimension",
        "planned_values",
        "final_status",
        "evidence",
        "final_observations",
        "independent_measured_elections",
        "publication_use",
        "notes",
    ]

    w = csv.DictWriter(
        f,
        fieldnames=fields,
        delimiter="\t",
        lineterminator="\n",
    )

    w.writeheader()
    w.writerows(coverage)


environment = {
    "fileExists":
        environment_path.is_file(),
    "nonEmpty":
        False,
    "containsPotentialOsField":
        False,
    "containsPotentialCpuField":
        False,
    "containsPotentialRamField":
        False,
    "containsPotentialFoundryField":
        False,
    "containsPotentialAnvilField":
        False,
    "containsPotentialCastField":
        False,
    "containsPotentialPythonField":
        False,
    "containsPotentialNodeField":
        False,
}


if environment_path.is_file():

    text = environment_path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    lower = text.lower()

    environment["nonEmpty"] = bool(
        text.strip()
    )

    environment[
        "containsPotentialOsField"
    ] = any(
        x in lower
        for x in [
            "windows",
            "mingw",
            "os=",
            "operating",
        ]
    )

    environment[
        "containsPotentialCpuField"
    ] = any(
        x in lower
        for x in [
            "cpu",
            "processor",
            "model name",
        ]
    )

    environment[
        "containsPotentialRamField"
    ] = any(
        x in lower
        for x in [
            "ram",
            "memory",
            "memtotal",
        ]
    )

    environment[
        "containsPotentialFoundryField"
    ] = (
        "forge" in lower
        or "foundry" in lower
    )

    environment[
        "containsPotentialAnvilField"
    ] = "anvil" in lower

    environment[
        "containsPotentialCastField"
    ] = "cast" in lower

    environment[
        "containsPotentialPythonField"
    ] = "python" in lower

    environment[
        "containsPotentialNodeField"
    ] = "node" in lower


environment[
    "reportingMetadataCompleteByKeywordAudit"
] = all([
    environment[
        "fileExists"
    ],
    environment[
        "nonEmpty"
    ],
    environment[
        "containsPotentialOsField"
    ],
    environment[
        "containsPotentialCpuField"
    ],
    environment[
        "containsPotentialRamField"
    ],
    environment[
        "containsPotentialFoundryField"
    ],
    environment[
        "containsPotentialAnvilField"
    ],
    environment[
        "containsPotentialCastField"
    ],
    environment[
        "containsPotentialPythonField"
    ],
    environment[
        "containsPotentialNodeField"
    ],
])


audit = {
    "status":
        "PASS",
    "finalCampaignRun":
        "20261002_224441",
    "finalRawRows":
        2400,
    "warmupRows":
        400,
    "measuredRows":
        2000,
    "coverage":
        coverage,
    "environmentAudit":
        environment,
    "coverageConclusions": {
        "acceptedBallotScalingComplete":
            True,
        "freshChainMicrobenchmarkComplete":
            False,
        "candidateCountMatrixComplete":
            False,
        "eligibleSetMatrixComplete":
            False,
        "entireWp8BenchmarkSuiteComplete":
            False,
    },
}


audit_path = (
    out_dir
    / "C8A_COVERAGE_AUDIT.json"
)

with open(
    audit_path,
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


narrative = """# WP8E C8A Results Narrative Freeze

## Scope of the completed final result

The completed final benchmark establishes the accepted-ballot accumulation
dimension for the frozen DIRECT profile with `candidateCount = 4` and 16
ciphertext slots.

The final campaign contains 30 fresh-chain elections:

- 5 warm-up elections,
- 25 independent measured elections,
- 400 warm-up accepted transactions,
- 2,000 measured accepted transactions,
- 2,400 total accepted transactions.

The accepted-ballot scales are:

`N = {25, 50, 75, 100, 150}`

Each scale contains five independent measured fresh-chain elections.

The 400 warm-up observations are preserved but excluded from final statistics.
No silent outlier deletion was performed.

## Gas result

Typical accepted-vote gas is nearly invariant over the tested accepted-ballot
accumulation range.

Across `N = 25..150`:

- median gas ranges from 1,307,326 to 1,307,403,
- nearest-rank p95 ranges from 1,307,759 to 1,307,997.

The pooled mean gas decreases by approximately 1.40% from N=25 to N=150.
This must not be interpreted as evidence that larger accumulated election
state intrinsically reduces `castVote` execution cost.

The position-level audit shows that every fresh election begins with the same
1,866,414-gas first accepted vote. The first vote is approximately 42.77%
more expensive than the mean of positions 2..N because previously empty
persistent vote/tally/nullifier state is initialized.

As N increases, this one-time first-vote cost is spread across more accepted
transactions, causing the pooled mean to decrease.

Therefore median and nearest-rank p95 are the preferred descriptors for
typical per-vote gas in the accepted-ballot scaling discussion.

## Local transaction latency result

The measured latency is local process/RPC wall-clock time from immediately
before invoking `cast send` until receipt return.

It is:

- not Groth16 proving time,
- not witness-generation time,
- not public Ethereum confirmation latency,
- not biometric authentication time,
- not end-to-end voter interaction time.

Scale-level mean latency is non-monotonic across N=25..150 and ranges from
approximately 749.9 ms to 773.7 ms.

No monotonic scaling model or regression is claimed.

## Parser diagnostic observations

Two successful final-campaign receipts contained trailing local RPC diagnostic
text after valid receipt JSON.

Runner V2 preserved those receipt artifacts and successfully retained their
measurements.

Both observations remain included in the final dataset.

Neither is the overall maximum-latency observation.

No latency was reconstructed or imputed.

## Historical pre-ZKP comparison boundary

The published pre-ZKP LocalVoting contract is a historical reference point,
not a controlled A/B estimate of cryptographic overhead.

Its vote function, state representation, privacy guarantees, proof workload,
ballot representation, and tally mechanism differ materially from the final
DIRECT design.

Therefore:

- published pre-ZKP gas may be reported as a historical baseline,
- the final DIRECT gas may be reported as the final ZKP-system result,
- their raw numerical difference must not be described as an isolated
  'ZKP overhead' unless a controlled cleaned non-ZKP comparator is measured
  under a matched protocol.

Similarly, the published end-to-end voting-time measurement includes biometric,
IoT, liveness, and blockchain components and must not be directly compared with
the current local cast-to-receipt metric.

## Benchmark-suite coverage boundary

The accepted-ballot accumulation dimension is COMPLETE.

The following preregistered dimensions remain PENDING FINAL measurement:

1. fresh-chain vote microbenchmark:
   5 warm-ups + 20 measured fresh-chain runs;

2. candidate-count matrix:
   `candidateCount = {2, 4, 8, 16}`;

3. eligible-set-size matrix:
   `eligibleSet = {10, 100, 1000, 10000}`.

Earlier pilot/development measurements must not be promoted into those final
dimensions.

Consequently, the accepted-ballot scaling result is publication-ready as its
own experiment, but the entire WP8 benchmark suite must not yet be described
as complete.

## Publication wording guardrail

Safe wording:

> Under the frozen 4-candidate, 16-slot DIRECT configuration, typical
> accepted-vote gas remained nearly invariant as accepted ballots accumulated
> from 25 to 150, while local cast-to-receipt latency showed no monotonic
> increase over the tested range.

Unsafe wording:

> VoteChain has been proven scalable for all election sizes.

The experiment does not establish that broader claim.
"""


narrative_path = (
    out_dir
    / "C8A_RESULTS_NARRATIVE_FREEZE.md"
)

narrative_path.write_text(
    narrative,
    encoding="utf-8",
    newline="\n",
)


comparison = """# C8A Comparison Boundaries

## Valid direct statements

- The final DIRECT accepted-ballot campaign is internally comparable across
  N = 25, 50, 75, 100, and 150 because the frozen implementation, fixture
  family, metric definition, and execution protocol were held constant.

- The published pre-ZKP LocalVoting result may be cited as historical context.

## Statements requiring qualification

The published pre-ZKP gas report and the final DIRECT gas campaign differ in
contract logic and experimental design.

Do not label their numerical difference as isolated ZKP overhead.

The published end-to-end latency includes biometric and IoT operations.
The final DIRECT latency is local cast-send-start to receipt-return only.

Do not place those latency values in the same column under a shared
'end-to-end latency' heading.

## Controlled-comparison requirement

A claim specifically about incremental ZKP overhead requires a matched
comparator that holds the benchmark protocol constant while removing only the
relevant privacy/proof mechanism.

Until such a comparator exists, describe the published contract as the
historical pre-ZKP baseline and DIRECT as the final ZKP architecture.
"""


comparison_path = (
    out_dir
    / "C8A_COMPARISON_BOUNDARIES.md"
)

comparison_path.write_text(
    comparison,
    encoding="utf-8",
    newline="\n",
)


print(
    "ACCEPTED_BALLOT_SCALING=COMPLETE"
)

print(
    "FRESH_CHAIN_MICROBENCHMARK=PENDING_FINAL"
)

print(
    "CANDIDATE_COUNT_MATRIX=PENDING_FINAL"
)

print(
    "ELIGIBLE_SET_MATRIX=PENDING_FINAL"
)

print(
    "HISTORICAL_PRE_ZKP_COMPARISON=REFERENCE_ONLY"
)

print(
    "ENTIRE_WP8_BENCHMARK_SUITE_COMPLETE=NO"
)

print(
    "ACCEPTED_BALLOT_RESULT_PUBLICATION_READY=YES"
)

print(
    "PILOT_VALUES_PROMOTED_TO_FINAL=NO"
)

print(
    "CONTROLLED_ZKP_OVERHEAD_CLAIM_SUPPORTED=NO"
)

print(
    "COVERAGE_AUDIT=PASS"
)
