import csv
import hashlib
from pathlib import Path

root = Path(__file__).resolve().parent
manifest = root / "MANIFEST.tsv"

if not manifest.is_file():
    raise SystemExit("SUBMISSION_VERIFICATION=FAIL_MISSING_MANIFEST")

with open(manifest, encoding="utf-8", newline="") as f:
    rows = list(csv.DictReader(f, delimiter="\t"))

if not rows:
    raise SystemExit("SUBMISSION_VERIFICATION=FAIL_EMPTY_MANIFEST")

for row in rows:
    path = root / Path(row["path"])

    if not path.is_file():
        raise SystemExit(
            "SUBMISSION_VERIFICATION=FAIL_MISSING_FILE:"
            + row["path"]
        )

    h = hashlib.sha256()

    with open(path, "rb") as f:
        while True:
            block = f.read(1024 * 1024)

            if not block:
                break

            h.update(block)

    if h.hexdigest() != row["sha256"]:
        raise SystemExit(
            "SUBMISSION_VERIFICATION=FAIL_HASH:"
            + row["path"]
        )

    if path.stat().st_size != int(row["bytes"]):
        raise SystemExit(
            "SUBMISSION_VERIFICATION=FAIL_SIZE:"
            + row["path"]
        )

print("SUBMISSION_MANIFEST_ROWS=" + str(len(rows)))
print("SUBMISSION_VERIFICATION=PASS")
