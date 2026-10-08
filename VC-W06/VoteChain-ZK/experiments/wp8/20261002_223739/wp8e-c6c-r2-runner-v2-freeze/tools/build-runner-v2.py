import difflib
import sys
from pathlib import Path

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
diff_path = Path(sys.argv[3])

old = src.read_text(
    encoding="utf-8"
)

start_marker = (
    "\ndef receipt_info(text):\n"
)

end_marker = (
    "\ndef extract_address(text):\n"
)

start = old.find(
    start_marker
)

if start < 0:
    raise RuntimeError(
        "receipt_info start marker not found"
    )

end = old.find(
    end_marker,
    start + len(start_marker),
)

if end < 0:
    raise RuntimeError(
        "receipt_info end marker not found"
    )

if old.find(
    start_marker,
    start + len(start_marker),
) >= 0:
    raise RuntimeError(
        "multiple receipt_info definitions"
    )

replacement = r'''
def receipt_info(text):
    decoder = json.JSONDecoder()

    stripped = text.lstrip()

    if not stripped:
        raise RuntimeError(
            "empty cast receipt stdout"
        )

    try:
        obj, end = decoder.raw_decode(
            stripped
        )
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "could not decode leading "
            "cast receipt JSON"
        ) from exc

    if not isinstance(
        obj,
        dict,
    ):
        raise RuntimeError(
            "leading cast receipt JSON "
            "is not an object"
        )

    trailing = stripped[end:]

    # Full raw stdout is preserved separately in the receipt
    # artifact before this parser is called.  A sporadic Foundry/
    # Alloy diagnostic may therefore follow a valid receipt JSON.
    #
    # Do not interpret a second JSON object as harmless log text.
    trailing_nonws = trailing.lstrip()

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
                "multiple top-level JSON values "
                "in cast receipt stdout"
            )

    status = obj.get(
        "status"
    )

    if isinstance(
        status,
        str,
    ):
        ok = (
            status.lower()
            in {
                "0x1",
                "1",
                "success",
            }
        )
    else:
        ok = status == 1

    tx = (
        obj.get(
            "transactionHash"
        )
        or obj.get(
            "transaction_hash"
        )
        or ""
    )

    gas = (
        obj.get(
            "gasUsed"
        )
        or obj.get(
            "gas_used"
        )
    )

    if gas is None:
        gas_int = None
    elif isinstance(
        gas,
        int,
    ):
        gas_int = gas
    else:
        gas_int = int(
            str(gas),
            0,
        )

    return (
        ok,
        tx,
        gas_int,
        obj,
    )

'''

new = (
    old[:start + 1]
    + replacement.lstrip("\n")
    + old[end:]
)

dst.parent.mkdir(
    parents=True,
    exist_ok=True,
)

dst.write_text(
    new,
    encoding="utf-8",
    newline="\n",
)

diff = "".join(
    difflib.unified_diff(
        old.splitlines(
            keepends=True
        ),
        new.splitlines(
            keepends=True
        ),
        fromfile=str(src),
        tofile=str(dst),
    )
)

diff_path.write_text(
    diff,
    encoding="utf-8",
    newline="\n",
)

print(
    "PATCH_REGION=receipt_info_only"
)

print(
    "RUNNER_V1_BYTES="
    + str(
        len(
            old.encode("utf-8")
        )
    )
)

print(
    "RUNNER_V2_BYTES="
    + str(
        len(
            new.encode("utf-8")
        )
    )
)

print(
    "PATCH_BUILD=PASS"
)
