import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

root = Path(sys.argv[1])
corpus = Path(sys.argv[2])
c4 = Path(sys.argv[3])
out = Path(sys.argv[4])

fixtures = out / "fixtures"
fixtures.mkdir(parents=True, exist_ok=True)

cast = shutil.which("cast")

if not cast:
    raise SystemExit("CAST_NOT_FOUND")

CAST_SIG = (
    "castVote("
    "uint256[2],"
    "uint256[2][2],"
    "uint256[2],"
    "uint256,"
    "uint256[16],"
    "uint256[16],"
    "uint256[16],"
    "uint256[16]"
    ")"
)

EXPECTED_SELECTOR = "0x84943e35"
EXPECTED_BYTES = 2340


def sha_file(path):
    h = hashlib.sha256()

    with open(path, "rb") as f:
        for chunk in iter(
            lambda: f.read(1024 * 1024),
            b"",
        ):
            h.update(chunk)

    return h.hexdigest()


def arr(v):
    return "[" + ",".join(
        str(x) for x in v
    ) + "]"


def arr2(v):
    return "[" + ",".join(
        arr(x) for x in v
    ) + "]"


index = []
distribution = [0, 0, 0, 0]

prefix_expected = {
    25: [7, 6, 6, 6],
    50: [13, 13, 12, 12],
    75: [19, 19, 19, 18],
    100: [25, 25, 25, 25],
    150: [38, 38, 37, 37],
}

prefix_actual = {}

for n in range(1, 151):

    ballot_id = f"{n:03d}"

    input_path = (
        corpus
        / "inputs"
        / f"direct-{ballot_id}.json"
    )

    proof_path = (
        c4
        / f"ballot-{ballot_id}"
        / "proof.json"
    )

    public_path = (
        c4
        / f"ballot-{ballot_id}"
        / "public.json"
    )

    with open(
        input_path,
        encoding="utf-8",
    ) as f:
        x = json.load(f)

    with open(
        proof_path,
        encoding="utf-8",
    ) as f:
        p = json.load(f)

    with open(
        public_path,
        encoding="utf-8",
    ) as f:
        public = [
            str(v)
            for v in json.load(f)
        ]

    expected_public = [
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

    expected_public = [
        str(v)
        for v in expected_public
    ]

    if len(public) != 73:
        raise RuntimeError(
            f"{ballot_id}: public count != 73"
        )

    if public != expected_public:
        raise RuntimeError(
            f"{ballot_id}: public binding mismatch"
        )

    bits = [
        int(v)
        for v in x["bit"]
    ]

    if sum(bits) != 1:
        raise RuntimeError(
            f"{ballot_id}: not one-hot"
        )

    candidate_index = bits.index(1)

    if candidate_index >= 4:
        raise RuntimeError(
            f"{ballot_id}: inactive candidate selected"
        )

    distribution[candidate_index] += 1

    a = [
        str(p["pi_a"][0]),
        str(p["pi_a"][1]),
    ]

    b = [
        [
            str(p["pi_b"][0][1]),
            str(p["pi_b"][0][0]),
        ],
        [
            str(p["pi_b"][1][1]),
            str(p["pi_b"][1][0]),
        ],
    ]

    c = [
        str(p["pi_c"][0]),
        str(p["pi_c"][1]),
    ]

    rx = [str(v) for v in x["Rx"]]
    ry = [str(v) for v in x["Ry"]]
    sx = [str(v) for v in x["Sx"]]
    sy = [str(v) for v in x["Sy"]]

    cast_args = [
        arr(a),
        arr2(b),
        arr(c),
        str(x["nullifier"]),
        arr(rx),
        arr(ry),
        arr(sx),
        arr(sy),
    ]

    cp = subprocess.run(
        [
            cast,
            "calldata",
            CAST_SIG,
            *cast_args,
        ],
        text=True,
        capture_output=True,
        check=False,
    )

    if cp.returncode != 0:
        raise RuntimeError(
            f"{ballot_id}: cast calldata failed:\n"
            + cp.stderr
        )

    calldata = cp.stdout.strip()

    if not calldata.startswith(
        EXPECTED_SELECTOR
    ):
        raise RuntimeError(
            f"{ballot_id}: selector mismatch"
        )

    calldata_bytes = (
        len(calldata) - 2
    ) // 2

    if calldata_bytes != EXPECTED_BYTES:
        raise RuntimeError(
            f"{ballot_id}: calldata bytes "
            f"{calldata_bytes} != {EXPECTED_BYTES}"
        )

    calldata_binary = bytes.fromhex(
        calldata[2:]
    )

    fixture = {
        "ballotId": ballot_id,
        "candidateIndex": candidate_index,
        "nullifier": str(x["nullifier"]),
        "a": a,
        "b": b,
        "c": c,
        "rx": rx,
        "ry": ry,
        "sx": sx,
        "sy": sy,
        "castArgs": cast_args,
        "castSignature": CAST_SIG,
        "selector": EXPECTED_SELECTOR,
        "calldata": calldata,
        "calldataBytes": calldata_bytes,
        "calldataSha256": hashlib.sha256(
            calldata_binary
        ).hexdigest(),
        "inputSha256": sha_file(
            input_path
        ),
        "proofSha256": sha_file(
            proof_path
        ),
        "publicSha256": sha_file(
            public_path
        ),
    }

    fixture_path = (
        fixtures
        / f"ballot-{ballot_id}.json"
    )

    with open(
        fixture_path,
        "w",
        encoding="utf-8",
        newline="\n",
    ) as f:
        json.dump(
            fixture,
            f,
            indent=2,
        )
        f.write("\n")

    index.append({
        "ballotId": ballot_id,
        "candidateIndex":
            candidate_index,
        "nullifier":
            str(x["nullifier"]),
        "fixtureFile":
            f"fixtures/ballot-{ballot_id}.json",
        "fixtureSha256":
            sha_file(fixture_path),
        "calldataBytes":
            calldata_bytes,
        "calldataSha256":
            fixture["calldataSha256"],
    })

    if n in prefix_expected:
        prefix_actual[n] = list(
            distribution
        )

for scale, expected in (
    prefix_expected.items()
):
    actual = prefix_actual[scale]

    if actual != expected:
        raise RuntimeError(
            f"scale {scale}: "
            f"{actual} != {expected}"
        )

index_path = out / "fixture-index.json"

with open(
    index_path,
    "w",
    encoding="utf-8",
    newline="\n",
) as f:
    json.dump(
        {
            "fixtureCount": 150,
            "castVoteSelector":
                EXPECTED_SELECTOR,
            "calldataBytesPerFixture":
                EXPECTED_BYTES,
            "prefixCandidateDistributions":
                {
                    str(k): v
                    for k, v
                    in prefix_actual.items()
                },
            "fixtures": index,
        },
        f,
        indent=2,
    )
    f.write("\n")

print("FIXTURE_COUNT=150")
print("PUBLIC_BINDINGS_RECHECKED=150")
print("CALLDATA_SELECTOR=0x84943e35")
print("CALLDATA_BYTES_PER_FIXTURE=2340")
print(
    "FINAL_CANDIDATE_DISTRIBUTION="
    + ",".join(map(str, distribution))
)
print(
    "PREFIX_DISTRIBUTION_GATE=PASS"
)
print("FIXTURE_BUILD=PASS")
