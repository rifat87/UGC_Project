import ast
import hashlib
import re
import sys
from pathlib import Path


v2_path = Path(sys.argv[1])
micro_v1_path = Path(sys.argv[2])
v3_path = Path(sys.argv[3])
micro_v2_path = Path(sys.argv[4])
repo_run_rel = sys.argv[5]


def sha_file(path):
    return hashlib.sha256(
        path.read_bytes()
    ).hexdigest()


v2 = v2_path.read_text(
    encoding="utf-8"
)

tree = ast.parse(v2)

targets = [
    node
    for node in tree.body
    if (
        isinstance(
            node,
            ast.FunctionDef,
        )
        and
        node.name == "extract_address"
    )
]

if len(targets) != 1:
    raise RuntimeError(
        f"extract_address function count "
        f"{len(targets)} != 1"
    )

target = targets[0]

lines = v2.splitlines(
    keepends=True
)

start = target.lineno - 1
end = target.end_lineno


replacement = '''def extract_address(text):
    stripped = text.lstrip()

    decoder = json.JSONDecoder()

    try:
        obj, end = decoder.raw_decode(
            stripped
        )
    except json.JSONDecodeError:
        obj = None
        end = None

    if obj is not None:

        if not isinstance(
            obj,
            dict,
        ):
            raise RuntimeError(
                "leading deployment JSON "
                "is not an object"
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
                    "multiple top-level JSON values "
                    "in deployment stdout"
                )

        for key in (
            "deployedTo",
            "deployed_to",
            "address",
            "contractAddress",
            "contract_address",
        ):
            value = obj.get(key)

            if (
                isinstance(
                    value,
                    str,
                )
                and re.fullmatch(
                    r"0x[a-fA-F0-9]{40}",
                    value,
                )
            ):
                return value

        raise RuntimeError(
            "leading deployment JSON "
            "contains no deployed address"
        )

    m = re.search(
        r"0x[a-fA-F0-9]{40}",
        text,
    )

    if m:
        return m.group(0)

    raise RuntimeError(
        "could not parse deployed address"
    )
'''


new_v3 = (
    "".join(
        lines[:start]
    )
    + replacement
    + "".join(
        lines[end:]
    )
)


v3_path.parent.mkdir(
    parents=True,
    exist_ok=True,
)

v3_path.write_text(
    new_v3,
    encoding="utf-8",
    newline="\n",
)


# --------------------------------------------------------------
# Verify V2 -> V3 changed only extract_address executable region.
# --------------------------------------------------------------

v3_tree = ast.parse(
    new_v3
)


def function_map(tree, text):
    src_lines = text.splitlines()

    result = {}

    for node in tree.body:

        if isinstance(
            node,
            (
                ast.FunctionDef,
                ast.AsyncFunctionDef,
            ),
        ):
            code = "\n".join(
                src_lines[
                    node.lineno - 1:
                    node.end_lineno
                ]
            )

            result[
                node.name
            ] = code

    return result


v2_functions = function_map(
    tree,
    v2,
)

v3_functions = function_map(
    v3_tree,
    new_v3,
)


if set(
    v2_functions
) != set(
    v3_functions
):
    raise RuntimeError(
        "top-level function set changed"
    )


changed_functions = [
    name
    for name in sorted(
        v2_functions
    )
    if (
        v2_functions[name]
        != v3_functions[name]
    )
]


if changed_functions != [
    "extract_address"
]:
    raise RuntimeError(
        "V2 -> V3 changed functions: "
        + ",".join(
            changed_functions
        )
    )


# --------------------------------------------------------------
# Build microbenchmark runner V2.
# Only its underlying runner SHA/path may change.
# --------------------------------------------------------------

micro_v1 = (
    micro_v1_path.read_text(
        encoding="utf-8"
    )
)

v3_sha = sha_file(
    v3_path
)

old_sha_pattern = re.compile(
    r'EXPECTED_V2_SHA = "[0-9a-f]{64}"'
)

if len(
    old_sha_pattern.findall(
        micro_v1
    )
) != 1:
    raise RuntimeError(
        "EXPECTED_V2_SHA replacement count != 1"
    )


micro_v2 = (
    old_sha_pattern.sub(
        (
            'EXPECTED_V2_SHA = "'
            + v3_sha
            + '"'
        ),
        micro_v1,
        count=1,
    )
)


old_path = '''V2_RUNNER_REL = Path(
    "experiments/wp8"
    "/20261002_223739"
    "/wp8e-c6c-r2-runner-v2-freeze"
    "/runner-v2"
    "/wp8e-final-scaling-runner-v2.py"
)'''


new_path = '''V2_RUNNER_REL = Path(
    "''' + repo_run_rel + '''"
    "/runner-v3"
    "/wp8e-final-scaling-runner-v3.py"
)'''


if micro_v2.count(
    old_path
) != 1:
    raise RuntimeError(
        "V2_RUNNER_REL replacement count != 1"
    )


micro_v2 = micro_v2.replace(
    old_path,
    new_path,
    1,
)


micro_v2_path.parent.mkdir(
    parents=True,
    exist_ok=True,
)

micro_v2_path.write_text(
    micro_v2,
    encoding="utf-8",
    newline="\n",
)


# --------------------------------------------------------------
# Structural audit:
# normalize only the two intended provenance fields and require
# byte-identical executable source otherwise.
# --------------------------------------------------------------

def normalize_micro(text):

    text = re.sub(
        r'EXPECTED_V2_SHA = "[0-9a-f]{64}"',
        'EXPECTED_V2_SHA = "<RUNNER_SHA>"',
        text,
        count=1,
    )

    text = re.sub(
        (
            r'V2_RUNNER_REL = Path\(\n'
            r'(?:    "[^"]*"\n)+'
            r'\)'
        ),
        (
            'V2_RUNNER_REL = Path(\n'
            '    "<RUNNER_PATH>"\n'
            ')'
        ),
        text,
        count=1,
    )

    return text


if normalize_micro(
    micro_v1
) != normalize_micro(
    micro_v2
):
    raise RuntimeError(
        "microbenchmark V1 -> V2 "
        "changed beyond runner SHA/path"
    )


print(
    "RUNNER_V3_BUILD=PASS"
)

print(
    "RUNNER_V2_TO_V3_CHANGED_FUNCTIONS="
    + ",".join(
        changed_functions
    )
)

print(
    "RUNNER_V2_TO_V3_ONLY_EXTRACT_ADDRESS_CHANGED=YES"
)

print(
    "MICROBENCHMARK_RUNNER_V2_BUILD=PASS"
)

print(
    "MICROBENCHMARK_V1_TO_V2_ONLY_RUNNER_PROVENANCE_CHANGED=YES"
)

print(
    "RUNNER_V3_SHA256="
    + v3_sha
)

print(
    "MICROBENCHMARK_RUNNER_V2_SHA256="
    + sha_file(
        micro_v2_path
    )
)
