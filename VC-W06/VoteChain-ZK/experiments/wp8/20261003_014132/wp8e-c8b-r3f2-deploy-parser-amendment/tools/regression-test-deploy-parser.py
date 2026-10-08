import importlib.util
import json
import sys
from pathlib import Path


campaign = Path(sys.argv[1])
v2_path = Path(sys.argv[2])
v3_path = Path(sys.argv[3])


def import_module(
    name,
    path,
):
    spec = (
        importlib.util
        .spec_from_file_location(
            name,
            path,
        )
    )

    if (
        spec is None
        or spec.loader is None
    ):
        raise RuntimeError(
            f"cannot import {name}"
        )

    mod = (
        importlib.util
        .module_from_spec(
            spec
        )
    )

    spec.loader.exec_module(
        mod
    )

    return mod


v2 = import_module(
    "runner_v2",
    v2_path,
)

v3 = import_module(
    "runner_v3",
    v3_path,
)

decoder = json.JSONDecoder()

files = sorted(
    list(
        (
            campaign
            / "iterations"
        ).glob(
            "*/verifier-deploy.json"
        )
    )
    +
    list(
        (
            campaign
            / "iterations"
        ).glob(
            "*/direct-deploy.json"
        )
    )
)


if len(files) != 34:
    raise RuntimeError(
        f"deployment artifacts "
        f"{len(files)} != 34"
    )


v2_mismatches = []
v3_mismatches = []
nonwhitespace_trailing = []
rows = []


for path in files:

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

    expected = (
        obj.get(
            "deployedTo"
        )
        or obj.get(
            "deployed_to"
        )
        or obj.get(
            "contractAddress"
        )
        or obj.get(
            "contract_address"
        )
        or obj.get(
            "address"
        )
    )

    if not expected:
        raise RuntimeError(
            f"{path}: no expected "
            "deployment address"
        )

    trailing = stripped[
        end:
    ]

    has_nonws_trailing = bool(
        trailing.strip()
    )

    if has_nonws_trailing:
        nonwhitespace_trailing.append(
            path.as_posix()
        )

    try:
        old = v2.extract_address(
            text
        )
    except Exception as exc:
        old = (
            "<ERROR:"
            + repr(exc)
            + ">"
        )

    try:
        new = v3.extract_address(
            text
        )
    except Exception as exc:
        new = (
            "<ERROR:"
            + repr(exc)
            + ">"
        )

    old_ok = (
        old.lower()
        == expected.lower()
    )

    new_ok = (
        new.lower()
        == expected.lower()
    )

    if not old_ok:
        v2_mismatches.append(
            path.as_posix()
        )

    if not new_ok:
        v3_mismatches.append(
            path.as_posix()
        )

    rows.append({
        "repetitionId":
            path.parent.name,
        "artifact":
            path.name,
        "expected":
            expected,
        "v2":
            old,
        "v2Match":
            old_ok,
        "v3":
            new,
        "v3Match":
            new_ok,
        "nonWhitespaceTrailing":
            has_nonws_trailing,
    })


if len(
    v2_mismatches
) != 1:
    raise RuntimeError(
        "expected exactly one historical "
        f"V2 deployment mismatch, got "
        f"{len(v2_mismatches)}"
    )


expected_problem = (
    campaign
    / "iterations"
    / "measured-12"
    / "direct-deploy.json"
).as_posix()


if (
    v2_mismatches[0]
    != expected_problem
):
    raise RuntimeError(
        "historical V2 mismatch is not "
        "measured-12 direct deployment"
    )


if v3_mismatches:
    raise RuntimeError(
        "V3 deployment parser mismatches: "
        + ",".join(
            v3_mismatches
        )
    )


target = [
    x
    for x in rows
    if (
        x["repetitionId"]
        == "measured-12"
        and
        x["artifact"]
        == "direct-deploy.json"
    )
]


if len(target) != 1:
    raise RuntimeError(
        "target regression row count != 1"
    )


target = target[0]


if not target[
    "nonWhitespaceTrailing"
]:
    raise RuntimeError(
        "target no longer shows "
        "trailing diagnostic"
    )


if target[
    "v2Match"
]:
    raise RuntimeError(
        "target unexpectedly passes V2"
    )


if not target[
    "v3Match"
]:
    raise RuntimeError(
        "target does not pass V3"
    )


# --------------------------------------------------------------
# Synthetic parser safety tests.
# --------------------------------------------------------------

base = json.dumps({
    "deployer":
        "0x1111111111111111111111111111111111111111",
    "deployedTo":
        "0x2222222222222222222222222222222222222222",
    "transactionHash":
        "0x"
        + "33" * 32,
})


plain = v3.extract_address(
    base
)

if plain.lower() != (
    "0x2222222222222222222222222222222222222222"
):
    raise RuntimeError(
        "synthetic plain JSON failed"
    )


diagnostic = v3.extract_address(
    base
    + "\nERROR synthetic diagnostic\n"
)

if diagnostic.lower() != (
    "0x2222222222222222222222222222222222222222"
):
    raise RuntimeError(
        "synthetic trailing diagnostic failed"
    )


multiple_json_rejected = False

try:
    v3.extract_address(
        base
        + "\n"
        + json.dumps({
            "extra":
                1
        })
    )
except RuntimeError as exc:
    if (
        "multiple top-level JSON values"
        in str(exc)
    ):
        multiple_json_rejected = True


if not multiple_json_rejected:
    raise RuntimeError(
        "multiple JSON values not rejected"
    )


print(
    "DEPLOYMENT_ARTIFACTS_TESTED=34"
)

print(
    "HISTORICAL_V2_MISMATCHES=1"
)

print(
    "HISTORICAL_V2_MISMATCH="
    + v2_mismatches[0]
)

print(
    "RUNNER_V3_MISMATCHES=0"
)

print(
    "NONWHITESPACE_TRAILING_DEPLOY_ARTIFACTS="
    + str(
        len(
            nonwhitespace_trailing
        )
    )
)

print(
    "MEASURED12_DIRECT_V2_MATCH=NO"
)

print(
    "MEASURED12_DIRECT_V3_MATCH=YES"
)

print(
    "SYNTHETIC_PLAIN_JSON=PASS"
)

print(
    "SYNTHETIC_TRAILING_DIAGNOSTIC=PASS"
)

print(
    "SYNTHETIC_SECOND_JSON_REJECTED=YES"
)

print(
    "DEPLOY_ADDRESS_PARSER_REGRESSION=PASS"
)
