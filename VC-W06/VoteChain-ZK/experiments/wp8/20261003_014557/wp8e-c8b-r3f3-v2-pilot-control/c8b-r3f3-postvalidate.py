import csv
import json
import math
import re
import sys
from pathlib import Path


pilot = Path(sys.argv[1])
out = Path(sys.argv[2])

expected_verifier = (
    "0x5fbdb2315678afecb367f032d93f642f64180aa3"
)

expected_direct = (
    "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"
)


raw_path = (
    pilot
    / "raw-microbenchmark.tsv"
)

receipt_path = (
    pilot
    / "receipts"
    / "pilot-01.json"
)

iteration_dir = (
    pilot
    / "iterations"
    / "pilot-01"
)

summary_path = (
    iteration_dir
    / "iteration-summary.json"
)

verifier_deploy_path = (
    iteration_dir
    / "verifier-deploy.json"
)

direct_deploy_path = (
    iteration_dir
    / "direct-deploy.json"
)

complete_path = (
    pilot
    / "microbenchmark-complete.json"
)


required_files = [
    raw_path,
    receipt_path,
    summary_path,
    verifier_deploy_path,
    direct_deploy_path,
    complete_path,
]


for path in required_files:

    if not path.is_file():
        raise RuntimeError(
            f"missing pilot artifact: {path}"
        )


failure_files = sorted(
    (
        pilot
        / "iterations"
    ).glob(
        "*/FAILURE.json"
    )
)


if failure_files:
    raise RuntimeError(
        f"FAILURE files present: "
        f"{len(failure_files)}"
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


if len(rows) != 1:
    raise RuntimeError(
        f"pilot raw rows "
        f"{len(rows)} != 1"
    )


row = rows[0]


expected_row = {
    "kind":
        "pilot",
    "iteration":
        "1",
    "repetition_id":
        "pilot-01",
    "ballot_id":
        "001",
    "candidate_index":
        "0",
    "receipt_status":
        "1",
    "calldata_bytes":
        "2340",
}


for key, expected in (
    expected_row.items()
):

    if row[key] != expected:
        raise RuntimeError(
            f"{key}: "
            f"{row[key]} != {expected}"
        )


if not re.fullmatch(
    r"0x[a-fA-F0-9]{64}",
    row["tx_hash"],
):
    raise RuntimeError(
        "invalid pilot tx hash"
    )


gas = int(
    row["gas_used"]
)

latency = float(
    row["latency_ms"]
)


if gas <= 0:
    raise RuntimeError(
        "non-positive pilot gas"
    )


if (
    not math.isfinite(
        latency
    )
    or latency <= 0
):
    raise RuntimeError(
        "invalid pilot latency"
    )


decoder = json.JSONDecoder()


def leading_json(
    path,
):
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
            f"{path.name}: leading JSON "
            "not object"
        )

    trailing = stripped[
        end:
    ]

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
                f"{path.name}: multiple "
                "top-level JSON values"
            )

    return (
        obj,
        trailing,
    )


verifier_deploy, verifier_trailing = (
    leading_json(
        verifier_deploy_path
    )
)

direct_deploy, direct_trailing = (
    leading_json(
        direct_deploy_path
    )
)


verifier_address = (
    verifier_deploy.get(
        "deployedTo"
    )
    or verifier_deploy.get(
        "contractAddress"
    )
    or verifier_deploy.get(
        "address"
    )
)


direct_address = (
    direct_deploy.get(
        "deployedTo"
    )
    or direct_deploy.get(
        "contractAddress"
    )
    or direct_deploy.get(
        "address"
    )
)


if not verifier_address:
    raise RuntimeError(
        "verifier deployment address missing"
    )


if not direct_address:
    raise RuntimeError(
        "DIRECT deployment address missing"
    )


if (
    verifier_address.lower()
    != expected_verifier
):
    raise RuntimeError(
        "verifier deployedTo mismatch"
    )


if (
    direct_address.lower()
    != expected_direct
):
    raise RuntimeError(
        "DIRECT deployedTo mismatch"
    )


receipt, receipt_trailing = (
    leading_json(
        receipt_path
    )
)


status = receipt.get(
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
        "pilot receipt unsuccessful"
    )


receipt_tx = (
    receipt.get(
        "transactionHash"
    )
    or receipt.get(
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
        "receipt/raw tx mismatch"
    )


receipt_gas_value = (
    receipt.get(
        "gasUsed"
    )
    or receipt.get(
        "gas_used"
    )
)


if receipt_gas_value is None:
    raise RuntimeError(
        "receipt gasUsed missing"
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
        "receipt/raw gas mismatch"
    )


with open(
    summary_path,
    encoding="utf-8",
) as f:
    summary = json.load(f)


if summary.get(
    "status"
) != "PASS":
    raise RuntimeError(
        "summary status != PASS"
    )


if summary.get(
    "classification"
) != "PILOT_ONLY_NOT_FINAL_BENCHMARK":
    raise RuntimeError(
        "summary classification mismatch"
    )


if summary.get(
    "kind"
) != "pilot":
    raise RuntimeError(
        "summary kind != pilot"
    )


if summary.get(
    "repetitionId"
) != "pilot-01":
    raise RuntimeError(
        "summary repetition mismatch"
    )


if summary.get(
    "freshChain"
) is not True:
    raise RuntimeError(
        "freshChain != true"
    )


if summary.get(
    "ballotId"
) != "001":
    raise RuntimeError(
        "summary ballotId != 001"
    )


if int(
    summary.get(
        "candidateIndex"
    )
) != 0:
    raise RuntimeError(
        "summary candidateIndex != 0"
    )


if (
    str(
        summary.get(
            "verifier",
            "",
        )
    ).lower()
    != expected_verifier
):
    raise RuntimeError(
        "summary verifier mismatch"
    )


if (
    str(
        summary.get(
            "direct",
            "",
        )
    ).lower()
    != expected_direct
):
    raise RuntimeError(
        "summary DIRECT mismatch"
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
        "summary/raw tx mismatch"
    )


if int(
    summary.get(
        "gasUsed"
    )
) != gas:
    raise RuntimeError(
        "summary/raw gas mismatch"
    )


if int(
    summary.get(
        "calldataBytes"
    )
) != 2340:
    raise RuntimeError(
        "summary calldata mismatch"
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
        "summary/raw latency mismatch"
    )


correctness = summary.get(
    "correctness",
    {}
)


required_correctness = {
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
    required_correctness.items()
):

    if correctness.get(
        key
    ) != expected:
        raise RuntimeError(
            f"correctness {key}: "
            f"{correctness.get(key)} "
            f"!= {expected}"
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
        "PILOT_ONLY_NOT_FINAL_BENCHMARK",
    "freshChainPerIteration":
        True,
    "ballotId":
        "001",
    "candidateIndex":
        0,
    "warmupIterations":
        0,
    "measuredIterations":
        0,
    "totalIterations":
        1,
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


report = {
    "status":
        "PASS",
    "classification":
        "PILOT_ONLY_NOT_FINAL_BENCHMARK",
    "runnerGeneration":
        "MICROBENCHMARK_V2",
    "rawRows":
        1,
    "receiptFiles":
        1,
    "failureFiles":
        0,
    "freshChain":
        True,
    "ballotId":
        "001",
    "candidateIndex":
        0,
    "verifierAddress":
        verifier_address,
    "directAddress":
        direct_address,
    "verifierDeployLeadingJson":
        True,
    "directDeployLeadingJson":
        True,
    "verifierDeployTrailingTextPresent":
        bool(
            verifier_trailing.strip()
        ),
    "directDeployTrailingTextPresent":
        bool(
            direct_trailing.strip()
        ),
    "receiptTrailingTextPresent":
        bool(
            receipt_trailing.strip()
        ),
    "receiptStatus":
        1,
    "txHash":
        row["tx_hash"],
    "gasUsed":
        gas,
    "calldataBytes":
        2340,
    "latencyMs":
        latency,
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
    "eligibleForFinalStatistics":
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
    "PILOT_V2_RAW_ROWS=1"
)

print(
    "PILOT_V2_RECEIPT_FILES=1"
)

print(
    "PILOT_V2_FAILURE_FILES=0"
)

print(
    "PILOT_V2_FRESH_CHAIN=YES"
)

print(
    "PILOT_V2_BALLOT_ID=001"
)

print(
    "PILOT_V2_VERIFIER_ADDRESS="
    + verifier_address
)

print(
    "PILOT_V2_DIRECT_ADDRESS="
    + direct_address
)

print(
    "PILOT_V2_VERIFIER_DEPLOY_ADDRESS_MATCH=YES"
)

print(
    "PILOT_V2_DIRECT_DEPLOY_ADDRESS_MATCH=YES"
)

print(
    "PILOT_V2_VERIFIER_DEPLOY_TRAILING_TEXT="
    + (
        "YES"
        if verifier_trailing.strip()
        else "NO"
    )
)

print(
    "PILOT_V2_DIRECT_DEPLOY_TRAILING_TEXT="
    + (
        "YES"
        if direct_trailing.strip()
        else "NO"
    )
)

print(
    "PILOT_V2_RECEIPT_STATUS=1"
)

print(
    "PILOT_V2_GAS_USED="
    + str(gas)
)

print(
    "PILOT_V2_CALLDATA_BYTES=2340"
)

print(
    "PILOT_V2_LATENCY_MS="
    + f"{latency:.6f}"
)

print(
    "PILOT_V2_ACCEPTED_BALLOT_COUNT=1"
)

print(
    "PILOT_V2_USED_NULLIFIER=YES"
)

print(
    "PILOT_V2_PHASE_ACTIVE=YES"
)

print(
    "PILOT_V2_TALLY_SLOTS_CHECKED=16"
)

print(
    "PILOT_V2_ENCRYPTED_TALLY_MATCH=YES"
)

print(
    "PILOT_V2_ELIGIBLE_FOR_FINAL_STATS=NO"
)

print(
    "PILOT_V2_POSTVALIDATION=PASS"
)
