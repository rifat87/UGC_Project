import csv
import json
import re
import sys
from pathlib import Path

pilot = Path(sys.argv[1])
out = Path(sys.argv[2])

raw_path = (
    pilot
    / "raw-microbenchmark.tsv"
)

receipt_path = (
    pilot
    / "receipts"
    / "pilot-01.json"
)

summary_path = (
    pilot
    / "iterations"
    / "pilot-01"
    / "iteration-summary.json"
)

complete_path = (
    pilot
    / "microbenchmark-complete.json"
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

for path in [
    raw_path,
    receipt_path,
    summary_path,
    complete_path,
]:
    if not path.is_file():
        raise RuntimeError(
            f"missing pilot artifact: {path}"
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
        f"raw pilot rows "
        f"{len(rows)} != 1"
    )


row = rows[0]


expected_strings = {
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
    expected_strings.items()
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
        "invalid tx hash"
    )


if int(
    row["gas_used"]
) <= 0:
    raise RuntimeError(
        "non-positive gas"
    )


if float(
    row["latency_ms"]
) <= 0:
    raise RuntimeError(
        "non-positive latency"
    )


text = receipt_path.read_text(
    encoding="utf-8",
    errors="replace",
)

decoder = json.JSONDecoder()

stripped = text.lstrip()

receipt, end = decoder.raw_decode(
    stripped
)

if not isinstance(
    receipt,
    dict,
):
    raise RuntimeError(
        "receipt JSON is not object"
    )


status = receipt.get(
    "status"
)

if isinstance(
    status,
    str,
):
    receipt_success = (
        status.lower()
        in {
            "0x1",
            "1",
            "success",
        }
    )
else:
    receipt_success = (
        status == 1
    )


if not receipt_success:
    raise RuntimeError(
        "receipt not successful"
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
    != row["tx_hash"].lower()
):
    raise RuntimeError(
        "receipt tx hash != raw row"
    )


gas = (
    receipt.get(
        "gasUsed"
    )
    or receipt.get(
        "gas_used"
    )
)


if gas is None:
    raise RuntimeError(
        "receipt missing gasUsed"
    )


if isinstance(
    gas,
    int,
):
    receipt_gas = gas
else:
    receipt_gas = int(
        str(gas),
        0,
    )


if receipt_gas != int(
    row["gas_used"]
):
    raise RuntimeError(
        "receipt gas != raw row"
    )


trailing = stripped[end:]


with open(
    summary_path,
    encoding="utf-8",
) as f:
    summary = json.load(f)


if summary.get(
    "status"
) != "PASS":
    raise RuntimeError(
        "iteration summary status != PASS"
    )


if summary.get(
    "classification"
) != "PILOT_ONLY_NOT_FINAL_BENCHMARK":
    raise RuntimeError(
        "pilot classification mismatch"
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
        "candidateIndex != 0"
    )


if (
    summary.get(
        "txHash",
        ""
    ).lower()
    != row["tx_hash"].lower()
):
    raise RuntimeError(
        "summary tx hash mismatch"
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
    "rawRows":
        1,
    "receiptFiles":
        1,
    "iterationSummaries":
        1,
    "failureFiles":
        0,
    "freshChain":
        True,
    "ballotId":
        "001",
    "candidateIndex":
        0,
    "receiptStatus":
        1,
    "txHash":
        row["tx_hash"],
    "gasUsed":
        int(
            row["gas_used"]
        ),
    "calldataBytes":
        2340,
    "latencyMs":
        float(
            row["latency_ms"]
        ),
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
    "receiptTrailingTextPresent":
        bool(
            trailing.strip()
        ),
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
    "PILOT_RAW_ROWS=1"
)

print(
    "PILOT_RECEIPT_FILES=1"
)

print(
    "PILOT_ITERATION_SUMMARIES=1"
)

print(
    "PILOT_FAILURE_FILES=0"
)

print(
    "PILOT_FRESH_CHAIN=YES"
)

print(
    "PILOT_BALLOT_ID=001"
)

print(
    "PILOT_RECEIPT_STATUS=1"
)

print(
    "PILOT_GAS_USED="
    + row["gas_used"]
)

print(
    "PILOT_CALLDATA_BYTES=2340"
)

print(
    "PILOT_LATENCY_MS="
    + row["latency_ms"]
)

print(
    "PILOT_ACCEPTED_BALLOT_COUNT=1"
)

print(
    "PILOT_USED_NULLIFIER=YES"
)

print(
    "PILOT_PHASE_ACTIVE=YES"
)

print(
    "PILOT_TALLY_SLOTS_CHECKED=16"
)

print(
    "PILOT_ENCRYPTED_TALLY_MATCH=YES"
)

print(
    "PILOT_RECEIPT_TRAILING_TEXT="
    + (
        "YES"
        if trailing.strip()
        else "NO"
    )
)

print(
    "PILOT_ELIGIBLE_FOR_FINAL_STATS=NO"
)

print(
    "PILOT_POSTVALIDATION=PASS"
)
