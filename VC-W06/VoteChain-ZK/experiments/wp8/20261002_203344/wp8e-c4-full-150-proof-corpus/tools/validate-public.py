import json
import sys

input_path = sys.argv[1]
public_path = sys.argv[2]

with open(input_path, encoding="utf-8") as f:
    x = json.load(f)

with open(public_path, encoding="utf-8") as f:
    public = [str(v) for v in json.load(f)]

expected = [
    x["eligibleRoot"],
    x["electionId"],
    x["candidateManifestHash"],
    x["candidateCount"],
    x["contractDomain"],
    x["Yx"],
    x["Yy"],
    x["electionContextHash"],
    x["nullifier"],
    *x["Rx"],
    *x["Ry"],
    *x["Sx"],
    *x["Sy"],
]

expected = [str(v) for v in expected]

if len(public) != 73:
    print(f"PUBLIC_SIGNAL_COUNT_FAIL={len(public)}")
    raise SystemExit(1)

if public != expected:
    for i, (actual, wanted) in enumerate(zip(public, expected)):
        if actual != wanted:
            print(f"FIRST_MISMATCH_INDEX={i}")
            print(f"ACTUAL={actual}")
            print(f"EXPECTED={wanted}")
            break

    raise SystemExit(1)

print("PUBLIC_SIGNAL_COUNT=73")
print("PUBLIC_BINDING=PASS")
