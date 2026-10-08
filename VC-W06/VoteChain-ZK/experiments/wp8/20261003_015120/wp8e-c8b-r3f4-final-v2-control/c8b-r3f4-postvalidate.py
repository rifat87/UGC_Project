import csv
import json
import math
import re
import sys
from collections import Counter
from pathlib import Path


campaign = Path(sys.argv[1])
out = Path(sys.argv[2])

EXPECTED_VERIFIER = (
    "0x5fbdb2315678afecb367f032d93f642f64180aa3"
)

EXPECTED_DIRECT = (
    "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"
)


raw_path = (
    campaign
    / "raw-microbenchmark.tsv"
)

complete_path = (
    campaign
    / "microbenchmark-complete.json"
)


if not raw_path.is_file():
    raise RuntimeError(
        "raw-microbenchmark.tsv missing"
    )

if not complete_path.is_file():
    raise RuntimeError(
        "microbenchmark-complete.json missing"
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


if len(rows) != 25:
    raise RuntimeError(
        f"raw rows {len(rows)} != 25"
    )


expected_ids = (
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


actual_ids = [
    (
        r["kind"],
        int(
            r["iteration"]
        ),
        r["repetition_id"],
    )
    for r in rows
]


if actual_ids != expected_ids:
    raise RuntimeError(
        "iteration identity/order mismatch"
    )


if len(
    set(
        r["repetition_id"]
        for r in rows
    )
) != 25:
    raise RuntimeError(
        "repetition IDs not unique"
    )


kinds = Counter(
    r["kind"]
    for r in rows
)


if kinds != Counter({
    "warmup": 5,
    "measured": 20,
}):
    raise RuntimeError(
        f"kind counts mismatch: "
        f"{dict(kinds)}"
    )


receipt_root = (
    campaign
    / "receipts"
)

iteration_root = (
    campaign
    / "iterations"
)


receipt_files = sorted(
    receipt_root.glob(
        "*.json"
    )
)

summary_files = sorted(
    iteration_root.glob(
        "*/iteration-summary.json"
    )
)

failure_files = sorted(
    iteration_root.glob(
        "*/FAILURE.json"
    )
)

iteration_dirs = sorted(
    p
    for p in iteration_root.iterdir()
    if p.is_dir()
)

verifier_deploy_files = sorted(
    iteration_root.glob(
        "*/verifier-deploy.json"
    )
)

direct_deploy_files = sorted(
    iteration_root.glob(
        "*/direct-deploy.json"
    )
)


if len(receipt_files) != 25:
    raise RuntimeError(
        f"receipt files "
        f"{len(receipt_files)} != 25"
    )

if len(summary_files) != 25:
    raise RuntimeError(
        f"summary files "
        f"{len(summary_files)} != 25"
    )

if len(iteration_dirs) != 25:
    raise RuntimeError(
        f"iteration dirs "
        f"{len(iteration_dirs)} != 25"
    )

if len(verifier_deploy_files) != 25:
    raise RuntimeError(
        "verifier deploy artifact count != 25"
    )

if len(direct_deploy_files) != 25:
    raise RuntimeError(
        "DIRECT deploy artifact count != 25"
    )

if failure_files:
    raise RuntimeError(
        f"FAILURE files present: "
        f"{len(failure_files)}"
    )


decoder = json.JSONDecoder()


def leading_json(path):

    text = path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    stripped = text.lstrip()

    obj, end = (
        decoder.raw_decode(
            stripped
        )
    )

    if not isinstance(
        obj,
        dict,
    ):
        raise RuntimeError(
            f"{path}: leading JSON "
            "not object"
        )

    trailing = stripped[end:]

    trailing_nonws = (
        trailing.lstrip()
    )

    if trailing_nonws.startswith(
        ("{", "[")
    ):
        try:
            decoder.raw_decode(
                trailing_nonws
            )
        except json.JSONDecodeError:
            pass
        else:
            raise RuntimeError(
                f"{path}: multiple "
                "top-level JSON values"
            )

    return (
        obj,
        trailing,
    )


gas_values = []
latency_values = []

receipt_trailing = []
verifier_deploy_trailing = []
direct_deploy_trailing = []


for row in rows:

    rep = row[
        "repetition_id"
    ]

    if row[
        "ballot_id"
    ] != "001":
        raise RuntimeError(
            f"{rep}: ballot_id != 001"
        )

    if row[
        "candidate_index"
    ] != "0":
        raise RuntimeError(
            f"{rep}: candidate_index != 0"
        )

    if row[
        "receipt_status"
    ] != "1":
        raise RuntimeError(
            f"{rep}: receipt_status != 1"
        )

    if row[
        "calldata_bytes"
    ] != "2340":
        raise RuntimeError(
            f"{rep}: calldata_bytes != 2340"
        )

    if not re.fullmatch(
        r"0x[a-fA-F0-9]{64}",
        row["tx_hash"],
    ):
        raise RuntimeError(
            f"{rep}: invalid tx hash"
        )

    gas = int(
        row[
            "gas_used"
        ]
    )

    latency = float(
        row[
            "latency_ms"
        ]
    )

    if gas <= 0:
        raise RuntimeError(
            f"{rep}: gas <= 0"
        )

    if (
        not math.isfinite(
            latency
        )
        or latency <= 0
    ):
        raise RuntimeError(
            f"{rep}: invalid latency"
        )

    gas_values.append(
        gas
    )

    latency_values.append(
        latency
    )

    iteration_dir = (
        iteration_root
        / rep
    )

    verifier_obj, verifier_tail = (
        leading_json(
            iteration_dir
            / "verifier-deploy.json"
        )
    )

    direct_obj, direct_tail = (
        leading_json(
            iteration_dir
            / "direct-deploy.json"
        )
    )

    verifier_address = (
        verifier_obj.get(
            "deployedTo"
        )
        or verifier_obj.get(
            "contractAddress"
        )
        or verifier_obj.get(
            "address"
        )
    )

    direct_address = (
        direct_obj.get(
            "deployedTo"
        )
        or direct_obj.get(
            "contractAddress"
        )
        or direct_obj.get(
            "address"
        )
    )

    if (
        not verifier_address
        or verifier_address.lower()
        != EXPECTED_VERIFIER
    ):
        raise RuntimeError(
            f"{rep}: verifier deployedTo mismatch"
        )

    if (
        not direct_address
        or direct_address.lower()
        != EXPECTED_DIRECT
    ):
        raise RuntimeError(
            f"{rep}: DIRECT deployedTo mismatch"
        )

    if verifier_tail.strip():
        verifier_deploy_trailing.append(
            rep
        )

    if direct_tail.strip():
        direct_deploy_trailing.append(
            rep
        )

    receipt_obj, receipt_tail = (
        leading_json(
            receipt_root
            / f"{rep}.json"
        )
    )

    if receipt_tail.strip():
        receipt_trailing.append(
            rep
        )

    status = receipt_obj.get(
        "status"
    )

    if isinstance(
        status,
        str,
    ):
        receipt_ok = (
            status.lower()
            in {
                "0x1",
                "1",
                "success",
            }
        )
    else:
        receipt_ok = (
            status == 1
        )

    if not receipt_ok:
        raise RuntimeError(
            f"{rep}: receipt unsuccessful"
        )

    receipt_tx = (
        receipt_obj.get(
            "transactionHash"
        )
        or receipt_obj.get(
            "transaction_hash"
        )
        or ""
    )

    if (
        receipt_tx.lower()
        != row[
            "tx_hash"
        ].lower()
    ):
        raise RuntimeError(
            f"{rep}: receipt/raw tx mismatch"
        )

    receipt_gas_value = (
        receipt_obj.get(
            "gasUsed"
        )
        or receipt_obj.get(
            "gas_used"
        )
    )

    if receipt_gas_value is None:
        raise RuntimeError(
            f"{rep}: receipt gas missing"
        )

    if isinstance(
        receipt_gas_value,
        int,
    ):
        receipt_gas = (
            receipt_gas_value
        )
    else:
        receipt_gas = int(
            str(
                receipt_gas_value
            ),
            0,
        )

    if receipt_gas != gas:
        raise RuntimeError(
            f"{rep}: receipt/raw gas mismatch"
        )

    with open(
        iteration_dir
        / "iteration-summary.json",
        encoding="utf-8",
    ) as f:
        summary = json.load(f)

    if summary.get(
        "status"
    ) != "PASS":
        raise RuntimeError(
            f"{rep}: summary status != PASS"
        )

    if summary.get(
        "classification"
    ) != (
        "FINAL_FROZEN_"
        "FRESH_CHAIN_MICROBENCHMARK"
    ):
        raise RuntimeError(
            f"{rep}: classification mismatch"
        )

    if summary.get(
        "kind"
    ) != row[
        "kind"
    ]:
        raise RuntimeError(
            f"{rep}: kind mismatch"
        )

    if int(
        summary.get(
            "iteration"
        )
    ) != int(
        row[
            "iteration"
        ]
    ):
        raise RuntimeError(
            f"{rep}: iteration mismatch"
        )

    if summary.get(
        "repetitionId"
    ) != rep:
        raise RuntimeError(
            f"{rep}: repetition mismatch"
        )

    if summary.get(
        "freshChain"
    ) is not True:
        raise RuntimeError(
            f"{rep}: freshChain != true"
        )

    if summary.get(
        "ballotId"
    ) != "001":
        raise RuntimeError(
            f"{rep}: ballotId mismatch"
        )

    if int(
        summary.get(
            "candidateIndex"
        )
    ) != 0:
        raise RuntimeError(
            f"{rep}: candidateIndex mismatch"
        )

    if (
        str(
            summary.get(
                "verifier",
                "",
            )
        ).lower()
        != EXPECTED_VERIFIER
    ):
        raise RuntimeError(
            f"{rep}: summary verifier mismatch"
        )

    if (
        str(
            summary.get(
                "direct",
                "",
            )
        ).lower()
        != EXPECTED_DIRECT
    ):
        raise RuntimeError(
            f"{rep}: summary DIRECT mismatch"
        )

    if (
        str(
            summary.get(
                "txHash",
                "",
            )
        ).lower()
        != row[
            "tx_hash"
        ].lower()
    ):
        raise RuntimeError(
            f"{rep}: summary/raw tx mismatch"
        )

    if int(
        summary.get(
            "gasUsed"
        )
    ) != gas:
        raise RuntimeError(
            f"{rep}: summary/raw gas mismatch"
        )

    if int(
        summary.get(
            "calldataBytes"
        )
    ) != 2340:
        raise RuntimeError(
            f"{rep}: summary calldata mismatch"
        )

    summary_latency = float(
        summary.get(
            "latencyMs"
        )
    )

    if abs(
        summary_latency
        - latency
    ) > 0.001:
        raise RuntimeError(
            f"{rep}: summary/raw latency mismatch"
        )

    correctness = summary.get(
        "correctness",
        {}
    )

    required = {
        "acceptedBallotCount":
            1,
        "usedNullifier":
            True,
        "phase":
            1,
        "tallySlotsChecked":
            16,
        "encryptedTallyMatch":
            True,
    }

    for key, expected in (
        required.items()
    ):
        if correctness.get(
            key
        ) != expected:
            raise RuntimeError(
                f"{rep}: correctness "
                f"{key} mismatch"
            )


with open(
    complete_path,
    encoding="utf-8",
) as f:
    complete = json.load(f)


expected_complete = {
    "status":
        "PASS",
    "classification":
        (
            "FINAL_FROZEN_"
            "FRESH_CHAIN_MICROBENCHMARK"
        ),
    "freshChainPerIteration":
        True,
    "ballotId":
        "001",
    "candidateIndex":
        0,
    "warmupIterations":
        5,
    "measuredIterations":
        20,
    "totalIterations":
        25,
    "timedInterval":
        "cast-send-start-to-receipt-return",
    "setupInsideTimedInterval":
        False,
    "postReceiptChecksInsideTimedInterval":
        False,
}


for key, expected in (
    expected_complete.items()
):
    if complete.get(
        key
    ) != expected:
        raise RuntimeError(
            f"complete {key}: "
            f"{complete.get(key)} "
            f"!= {expected}"
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


if len(warmup) != 5:
    raise RuntimeError(
        "warmup rows != 5"
    )

if len(measured) != 20:
    raise RuntimeError(
        "measured rows != 20"
    )


report = {
    "status":
        "PASS",
    "classification":
        "FINAL_FROZEN_FRESH_CHAIN_MICROBENCHMARK_V2",
    "rawRows":
        25,
    "warmupRows":
        5,
    "measuredRows":
        20,
    "receiptFiles":
        25,
    "iterationDirectories":
        25,
    "iterationSummaries":
        25,
    "verifierDeployArtifacts":
        25,
    "directDeployArtifacts":
        25,
    "failureFiles":
        0,
    "freshChainPerIteration":
        True,
    "ballotId":
        "001",
    "candidateIndex":
        0,
    "calldataBytes":
        2340,
    "allVerifierDeploymentAddressesMatch":
        True,
    "allDirectDeploymentAddressesMatch":
        True,
    "allReceiptsSuccessful":
        True,
    "allReceiptRawCrosschecks":
        True,
    "allAcceptedBallotCountsOne":
        True,
    "allNullifiersUsed":
        True,
    "allPhasesActive":
        True,
    "all16SlotTalliesMatch":
        True,
    "verifierDeployTrailingDiagnosticCount":
        len(
            verifier_deploy_trailing
        ),
    "verifierDeployTrailingDiagnosticRepetitions":
        verifier_deploy_trailing,
    "directDeployTrailingDiagnosticCount":
        len(
            direct_deploy_trailing
        ),
    "directDeployTrailingDiagnosticRepetitions":
        direct_deploy_trailing,
    "receiptTrailingDiagnosticCount":
        len(
            receipt_trailing
        ),
    "receiptTrailingDiagnosticRepetitions":
        receipt_trailing,
    "gasMinAll25":
        min(
            gas_values
        ),
    "gasMaxAll25":
        max(
            gas_values
        ),
    "latencyMinMsAll25":
        min(
            latency_values
        ),
    "latencyMaxMsAll25":
        max(
            latency_values
        ),
    "abortedCampaignReused":
        False,
    "abortedCampaignFinalStatsEligible":
        False,
    "pilotReused":
        False,
    "pilotFinalStatsEligible":
        False,
}


out.write_text(
    json.dumps(
        report,
        indent=2,
    )
    + "\n",
    encoding="utf-8",
    newline="\n",
)


print(
    "FINAL_V2_RAW_ROWS=25"
)

print(
    "FINAL_V2_WARMUP_ROWS=5"
)

print(
    "FINAL_V2_MEASURED_ROWS=20"
)

print(
    "FINAL_V2_RECEIPT_FILES=25"
)

print(
    "FINAL_V2_ITERATION_DIRECTORIES=25"
)

print(
    "FINAL_V2_ITERATION_SUMMARIES=25"
)

print(
    "FINAL_V2_VERIFIER_DEPLOY_ARTIFACTS=25"
)

print(
    "FINAL_V2_DIRECT_DEPLOY_ARTIFACTS=25"
)

print(
    "FINAL_V2_FAILURE_FILES=0"
)

print(
    "FINAL_V2_FRESH_CHAIN_PER_ITERATION=YES"
)

print(
    "FINAL_V2_ALL_VERIFIER_DEPLOY_ADDRESSES_MATCH=YES"
)

print(
    "FINAL_V2_ALL_DIRECT_DEPLOY_ADDRESSES_MATCH=YES"
)

print(
    "FINAL_V2_ALL_RECEIPTS_SUCCESS=YES"
)

print(
    "FINAL_V2_ALL_RECEIPTS_CROSSCHECKED_TO_RAW=YES"
)

print(
    "FINAL_V2_ALL_ACCEPTED_BALLOT_COUNTS_ONE=YES"
)

print(
    "FINAL_V2_ALL_NULLIFIERS_USED=YES"
)

print(
    "FINAL_V2_ALL_PHASES_ACTIVE=YES"
)

print(
    "FINAL_V2_ALL_16_SLOT_TALLIES_MATCH=YES"
)

print(
    "FINAL_V2_VERIFIER_DEPLOY_TRAILING_DIAGNOSTICS="
    + str(
        len(
            verifier_deploy_trailing
        )
    )
)

print(
    "FINAL_V2_DIRECT_DEPLOY_TRAILING_DIAGNOSTICS="
    + str(
        len(
            direct_deploy_trailing
        )
    )
)

print(
    "FINAL_V2_RECEIPT_TRAILING_DIAGNOSTICS="
    + str(
        len(
            receipt_trailing
        )
    )
)

print(
    "FINAL_V2_GAS_MIN_ALL25="
    + str(
        min(
            gas_values
        )
    )
)

print(
    "FINAL_V2_GAS_MAX_ALL25="
    + str(
        max(
            gas_values
        )
    )
)

print(
    "FINAL_V2_LATENCY_MIN_MS_ALL25="
    + f"{min(latency_values):.6f}"
)

print(
    "FINAL_V2_LATENCY_MAX_MS_ALL25="
    + f"{max(latency_values):.6f}"
)

print(
    "ABORTED_CAMPAIGN_REUSED=NO"
)

print(
    "ABORTED_CAMPAIGN_FINAL_STATS_ELIGIBLE=NO"
)

print(
    "R3F3_PILOT_REUSED=NO"
)

print(
    "R3F3_PILOT_FINAL_STATS_ELIGIBLE=NO"
)

print(
    "FINAL_V2_POSTVALIDATION=PASS"
)
