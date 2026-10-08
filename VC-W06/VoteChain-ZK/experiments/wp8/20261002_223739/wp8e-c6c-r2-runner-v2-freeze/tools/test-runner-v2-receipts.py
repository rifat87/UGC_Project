import csv
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

runner_path = Path(sys.argv[1])
campaign = Path(sys.argv[2])
output = Path(sys.argv[3])

spec = importlib.util.spec_from_file_location(
    "wp8e_runner_v2",
    runner_path,
)

module = importlib.util.module_from_spec(
    spec
)

spec.loader.exec_module(
    module
)

receipt_paths = sorted(
    (
        campaign
        / "receipts"
    ).glob(
        "*/*.json"
    )
)

raw_path = (
    campaign
    / "raw-transactions.tsv"
)

with open(
    raw_path,
    encoding="utf-8",
    newline="",
) as f:
    raw_rows = list(
        csv.DictReader(
            f,
            delimiter="\t",
        )
    )

target = (
    campaign
    / "receipts"
    / "measured-r1-n50-e07"
    / "ballot-033.json"
)

if len(receipt_paths) != 458:
    raise RuntimeError(
        f"receipt count "
        f"{len(receipt_paths)} != 458"
    )

if len(raw_rows) != 457:
    raise RuntimeError(
        f"raw rows "
        f"{len(raw_rows)} != 457"
    )

decoder = json.JSONDecoder()

parsed = 0
successful = 0
polluted = []
target_result = None

for path in receipt_paths:

    text = path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    ok, tx, gas, obj = (
        module.receipt_info(
            text
        )
    )

    parsed += 1

    if ok:
        successful += 1

    if not tx:
        raise RuntimeError(
            f"{path}: empty tx hash"
        )

    if gas is None or gas <= 0:
        raise RuntimeError(
            f"{path}: invalid gas"
        )

    stripped = text.lstrip()

    first, end = (
        decoder.raw_decode(
            stripped
        )
    )

    trailing = stripped[end:]

    if trailing.strip():
        polluted.append({
            "path":
                path.relative_to(
                    campaign
                ).as_posix(),
            "trailingBytes":
                len(
                    trailing.encode(
                        "utf-8"
                    )
                ),
            "trailingPreview":
                repr(
                    trailing[:500]
                ),
        })

    if path == target:

        target_result = {
            "ok": ok,
            "txHash": tx,
            "gasUsed": gas,
            "receiptStatus":
                obj.get(
                    "status"
                ),
            "rawSha256":
                hashlib.sha256(
                    path.read_bytes()
                ).hexdigest(),
            "trailingPresent":
                bool(
                    trailing.strip()
                ),
        }

if parsed != 458:
    raise RuntimeError(
        "not all receipts parsed"
    )

if successful != 458:
    raise RuntimeError(
        f"successful receipts "
        f"{successful} != 458"
    )

if len(polluted) != 1:
    raise RuntimeError(
        f"polluted receipt count "
        f"{len(polluted)} != 1"
    )

expected_polluted = (
    "receipts/"
    "measured-r1-n50-e07/"
    "ballot-033.json"
)

if (
    polluted[0]["path"]
    != expected_polluted
):
    raise RuntimeError(
        "unexpected polluted receipt"
    )

if target_result is None:
    raise RuntimeError(
        "target receipt not found"
    )

if not target_result["ok"]:
    raise RuntimeError(
        "target receipt not successful"
    )

if (
    target_result[
        "receiptStatus"
    ]
    != "0x1"
):
    raise RuntimeError(
        "target status != 0x1"
    )

if (
    target_result[
        "txHash"
    ]
    !=
    "0x0eb6cf9e69ff6ee02f5fa50207c699c69e84247f4e0ed877b91af8027c280b32"
):
    raise RuntimeError(
        "target tx hash mismatch"
    )

if target_result[
    "gasUsed"
] != int(
    "13f45e",
    16,
):
    raise RuntimeError(
        "target gas mismatch"
    )

if not target_result[
    "trailingPresent"
]:
    raise RuntimeError(
        "target trailing diagnostic missing"
    )

result = {
    "abortedRawRows":
        457,
    "abortedReceiptFiles":
        458,
    "v2ParsedReceiptFiles":
        parsed,
    "v2SuccessfulReceipts":
        successful,
    "receiptFilesWithTrailingText":
        len(polluted),
    "pollutedReceipts":
        polluted,
    "targetBallot033":
        target_result,
    "abortedAcceptedVoteTransactions":
        458,
    "missingCommittedMeasurementRows":
        1,
    "missingMeasurementIdentity":
        (
            "measured-r1-n50-e07"
            " + ballot-033"
        ),
    "missingLatencyReconstructed":
        False,
    "abortedRunEligibleForFinalStats":
        False,
}

with open(
    output,
    "w",
    encoding="utf-8",
    newline="\n",
) as f:
    json.dump(
        result,
        f,
        indent=2,
    )
    f.write("\n")

print(
    "ABORTED_RAW_ROWS=457"
)

print(
    "ABORTED_RECEIPT_FILES=458"
)

print(
    "V2_PARSED_RECEIPT_FILES=458"
)

print(
    "V2_SUCCESSFUL_RECEIPTS=458"
)

print(
    "RECEIPTS_WITH_TRAILING_DIAGNOSTIC=1"
)

print(
    "TRAILING_DIAGNOSTIC_RECEIPT="
    + polluted[0]["path"]
)

print(
    "BALLOT_033_V2_PARSE=PASS"
)

print(
    "BALLOT_033_STATUS=0x1"
)

print(
    "BALLOT_033_TX_HASH="
    + target_result["txHash"]
)

print(
    "BALLOT_033_GAS_USED="
    + str(
        target_result[
            "gasUsed"
        ]
    )
)

print(
    "ABORTED_ACCEPTED_VOTE_TX_COUNT=458"
)

print(
    "ABORTED_COMMITTED_MEASUREMENT_ROWS=457"
)

print(
    "MISSING_LATENCY_RECONSTRUCTED=NO"
)

print(
    "ABORTED_RUN_FINAL_STATS_ELIGIBLE=NO"
)

print(
    "RUNNER_V2_RECEIPT_REGRESSION_TEST=PASS"
)
