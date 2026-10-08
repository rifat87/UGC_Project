import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

campaign = Path(sys.argv[1])
out_path = Path(sys.argv[2])

raw_path = campaign / "raw-transactions.tsv"
complete_path = campaign / "campaign-complete.json"

if not raw_path.is_file():
    raise RuntimeError("raw-transactions.tsv missing")

if not complete_path.is_file():
    raise RuntimeError("campaign-complete.json missing")

with open(complete_path, encoding="utf-8") as f:
    complete = json.load(f)

required_complete = {
    "warmupAcceptedTx": 400,
    "measuredAcceptedTx": 2000,
    "totalAcceptedTx": 2400,
    "elections": 30,
    "status": "PASS",
}

for key, expected in required_complete.items():
    actual = complete.get(key)

    if actual != expected:
        raise RuntimeError(
            f"campaign complete {key}: "
            f"{actual} != {expected}"
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

if len(rows) != 2400:
    raise RuntimeError(
        f"raw rows {len(rows)} != 2400"
    )

keys = [
    (
        r["repetition_id"],
        r["ballot_id"],
    )
    for r in rows
]

if len(set(keys)) != 2400:
    raise RuntimeError(
        "repetition_id + ballot_id is not unique"
    )

warmup = [
    r for r in rows
    if r["kind"] == "warmup"
]

measured = [
    r for r in rows
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

for r in rows:

    if r["receipt_status"] != "1":
        raise RuntimeError(
            "non-success receipt status"
        )

    if int(r["calldata_bytes"]) != 2340:
        raise RuntimeError(
            "calldata bytes != 2340"
        )

    if not re.fullmatch(
        r"0x[a-fA-F0-9]{64}",
        r["tx_hash"],
    ):
        raise RuntimeError(
            "invalid transaction hash"
        )

    if int(r["gas_used"]) <= 0:
        raise RuntimeError(
            "non-positive gas"
        )

    if float(r["latency_ms"]) <= 0:
        raise RuntimeError(
            "non-positive latency"
        )

expected_warmup_rows = {
    25: 25,
    50: 50,
    75: 75,
    100: 100,
    150: 150,
}

expected_measured_rows = {
    25: 125,
    50: 250,
    75: 375,
    100: 500,
    150: 750,
}

warmup_rows = Counter(
    int(r["scale"])
    for r in warmup
)

measured_rows = Counter(
    int(r["scale"])
    for r in measured
)

if dict(warmup_rows) != expected_warmup_rows:
    raise RuntimeError(
        f"warmup scale rows: {dict(warmup_rows)}"
    )

if dict(measured_rows) != expected_measured_rows:
    raise RuntimeError(
        f"measured scale rows: {dict(measured_rows)}"
    )

warmup_order = [
    25, 50, 75, 100, 150
]

measured_rounds = [
    [25, 50, 75, 100, 150],
    [50, 75, 100, 150, 25],
    [75, 100, 150, 25, 50],
    [100, 150, 25, 50, 75],
    [150, 25, 50, 75, 100],
]

expected_elections = []

seq = 0

for scale in warmup_order:
    seq += 1

    expected_elections.append(
        (
            seq,
            f"warmup-r0-n{scale}-e{seq:02d}",
            "warmup",
            0,
            scale,
        )
    )

for round_index, order in enumerate(
    measured_rounds,
    start=1,
):
    for scale in order:
        seq += 1

        expected_elections.append(
            (
                seq,
                (
                    f"measured-r{round_index}-"
                    f"n{scale}-e{seq:02d}"
                ),
                "measured",
                round_index,
                scale,
            )
        )

seen = []

for r in rows:
    identity = (
        int(r["election_sequence"]),
        r["repetition_id"],
        r["kind"],
        int(r["measured_round"]),
        int(r["scale"]),
    )

    if not seen or seen[-1] != identity:
        seen.append(identity)

if seen != expected_elections:
    raise RuntimeError(
        "election execution order mismatch"
    )

counts_by_rep = Counter(
    r["repetition_id"]
    for r in rows
)

if len(counts_by_rep) != 30:
    raise RuntimeError(
        f"repetition count {len(counts_by_rep)} != 30"
    )

for _, rep, _, _, scale in expected_elections:
    if counts_by_rep[rep] != scale:
        raise RuntimeError(
            f"{rep}: rows "
            f"{counts_by_rep[rep]} != {scale}"
        )

summary_files = sorted(
    (campaign / "elections").glob(
        "*/election-summary.json"
    )
)

failure_files = sorted(
    (campaign / "elections").glob(
        "*/FAILURE.json"
    )
)

receipt_files = sorted(
    (campaign / "receipts").glob(
        "*/*.json"
    )
)

if len(summary_files) != 30:
    raise RuntimeError(
        f"summary files {len(summary_files)} != 30"
    )

if failure_files:
    raise RuntimeError(
        f"FAILURE.json files present: "
        f"{len(failure_files)}"
    )

if len(receipt_files) != 2400:
    raise RuntimeError(
        f"receipt files {len(receipt_files)} != 2400"
    )

expected_candidate_counts = {
    25: [7, 6, 6, 6],
    50: [13, 13, 12, 12],
    75: [19, 19, 19, 18],
    100: [25, 25, 25, 25],
    150: [38, 38, 37, 37],
}

warmup_elections = Counter()
measured_elections = Counter()

for path in summary_files:

    with open(path, encoding="utf-8") as f:
        x = json.load(f)

    if x.get("status") != "PASS":
        raise RuntimeError(
            f"{path}: status != PASS"
        )

    scale = int(x["scale"])
    c = x["correctness"]

    if c["acceptedBallotCount"] != scale:
        raise RuntimeError(
            f"{path}: accepted count mismatch"
        )

    if c["consumedNullifiers"] != scale:
        raise RuntimeError(
            f"{path}: nullifier count mismatch"
        )

    if c["tallySlotsChecked"] != 16:
        raise RuntimeError(
            f"{path}: tally slot count mismatch"
        )

    if c["encryptedTallyMatch"] is not True:
        raise RuntimeError(
            f"{path}: encrypted tally mismatch"
        )

    if (
        c["candidatePlaintextCounts"]
        != expected_candidate_counts[scale]
    ):
        raise RuntimeError(
            f"{path}: candidate oracle mismatch"
        )

    if x["kind"] == "warmup":
        warmup_elections[scale] += 1

    elif x["kind"] == "measured":
        measured_elections[scale] += 1

    else:
        raise RuntimeError(
            f"{path}: unknown kind"
        )

for scale in [
    25, 50, 75, 100, 150
]:
    if warmup_elections[scale] != 1:
        raise RuntimeError(
            f"scale {scale}: warmup elections != 1"
        )

    if measured_elections[scale] != 5:
        raise RuntimeError(
            f"scale {scale}: measured elections != 5"
        )

row_by_identity = {
    (
        r["repetition_id"],
        r["ballot_id"],
    ): r
    for r in rows
}

decoder = json.JSONDecoder()

trailing_receipts = []
receipt_crosschecks = 0

for path in receipt_files:

    rep = path.parent.name

    m = re.fullmatch(
        r"ballot-(\d{3})\.json",
        path.name,
    )

    if not m:
        raise RuntimeError(
            f"unexpected receipt filename {path}"
        )

    ballot_id = m.group(1)

    identity = (
        rep,
        ballot_id,
    )

    if identity not in row_by_identity:
        raise RuntimeError(
            f"receipt has no raw row: {identity}"
        )

    text = path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    stripped = text.lstrip()

    try:
        receipt, end = decoder.raw_decode(
            stripped
        )
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"{path}: leading receipt JSON failure"
        ) from exc

    if not isinstance(receipt, dict):
        raise RuntimeError(
            f"{path}: receipt is not object"
        )

    status = receipt.get("status")

    if isinstance(status, str):
        success = (
            status.lower()
            in {"0x1", "1", "success"}
        )
    else:
        success = status == 1

    if not success:
        raise RuntimeError(
            f"{path}: receipt not successful"
        )

    tx_hash = (
        receipt.get("transactionHash")
        or receipt.get("transaction_hash")
        or ""
    )

    expected_tx = row_by_identity[
        identity
    ]["tx_hash"]

    if tx_hash.lower() != expected_tx.lower():
        raise RuntimeError(
            f"{path}: tx hash != raw row"
        )

    gas = (
        receipt.get("gasUsed")
        or receipt.get("gas_used")
    )

    if gas is None:
        raise RuntimeError(
            f"{path}: missing gasUsed"
        )

    if isinstance(gas, int):
        gas_int = gas
    else:
        gas_int = int(
            str(gas),
            0,
        )

    expected_gas = int(
        row_by_identity[
            identity
        ]["gas_used"]
    )

    if gas_int != expected_gas:
        raise RuntimeError(
            f"{path}: gas != raw row"
        )

    trailing = stripped[end:]

    if trailing.strip():
        trailing_receipts.append(
            {
                "repetitionId": rep,
                "ballotId": ballot_id,
                "trailingBytes": len(
                    trailing.encode(
                        "utf-8"
                    )
                ),
                "preview":
                    repr(
                        trailing[:300]
                    ),
            }
        )

    receipt_crosschecks += 1

if receipt_crosschecks != 2400:
    raise RuntimeError(
        "receipt crosscheck count != 2400"
    )

report = {
    "status": "PASS",
    "campaignCompleteStatus": "PASS",
    "elections": 30,
    "warmupElections": 5,
    "measuredElections": 25,
    "rawTransactionRows": 2400,
    "uniqueObservationIdentities": 2400,
    "warmupTransactionRows": 400,
    "measuredTransactionRows": 2000,
    "receiptFiles": 2400,
    "receiptToRawCrosschecks": 2400,
    "failureFiles": 0,
    "calldataBytes": 2340,
    "allReceiptsSuccessful": True,
    "allElectionCorrectnessGatesPass": True,
    "warmupRowsByScale":
        dict(sorted(warmup_rows.items())),
    "measuredRowsByScale":
        dict(sorted(measured_rows.items())),
    "receiptFilesWithTrailingDiagnostic":
        len(trailing_receipts),
    "trailingDiagnosticReceipts":
        trailing_receipts,
}

with open(
    out_path,
    "w",
    encoding="utf-8",
    newline="\n",
) as f:
    json.dump(
        report,
        f,
        indent=2,
    )
    f.write("\n")

print("FINAL_V2_RAW_ROWS=2400")
print("FINAL_V2_UNIQUE_OBSERVATION_IDENTITIES=2400")
print("FINAL_V2_WARMUP_ROWS=400")
print("FINAL_V2_MEASURED_ROWS=2000")
print("FINAL_V2_ELECTION_SUMMARIES=30")
print("FINAL_V2_RECEIPT_FILES=2400")
print("FINAL_V2_RECEIPT_TO_RAW_CROSSCHECKS=2400")
print("FINAL_V2_FAILURE_FILES=0")
print(
    "FINAL_V2_TRAILING_DIAGNOSTIC_RECEIPTS="
    + str(len(trailing_receipts))
)
print("FINAL_V2_ALL_RECEIPTS_SUCCESS=YES")
print("FINAL_V2_ALL_ELECTION_CORRECTNESS_GATES=PASS")
print("FINAL_V2_POSTVALIDATION=PASS")
