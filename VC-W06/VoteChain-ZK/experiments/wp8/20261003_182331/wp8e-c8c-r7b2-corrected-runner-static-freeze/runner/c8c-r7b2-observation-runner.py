#!/usr/bin/env python3

import argparse
import hashlib
import json
import math
import shutil
import subprocess
import sys
import time
import traceback
from pathlib import Path


PRIVATE_KEY = (
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478"
    "cbed5efcae784d7bf4f2ff80"
)

CHAIN_ID = 31337

EXPECTED_ACTIVE_SOL_SHA = (
    "c833a70e832ce15cfe9d17c2ca71f202fc880651"
    "9514cd6846ba292804904d77"
)

EXPECTED_ACTIVE_VERIFIER_SHA = (
    "55b31cad6c02422bf22073abf482516d576d3f3e"
    "ec0b964d4fecaf4effff7eba"
)

R6_RUN = "20261003_154912"

R6_RELATIVE = (
    "experiments/wp8/"
    + R6_RUN
    + "/wp8e-c8c-r6-four-level-groth16-proof-fixtures"
)

EXPECTED_FIXTURE_HASHES = {
    2: {
        "proof":
            "1b5014c3d4b7132a42a1cfe674e4601e8d65a9a3"
            "f5ed0c539b88e0c0d2571639",

        "public":
            "ca7cee9134ed3eefa14c791e9bb3f4ca265ea6a034"
            "5c1e2994873414ab733025",
    },

    4: {
        "proof":
            "bea5b8e8cf599552c91c230b7737ab074420438f868"
            "4088262f8e7948baf4593",

        "public":
            "c2e6bc1163a3da7b9426b778cd2a0bc16cb844efc4"
            "721845728a95dfe9b371a6",
    },

    8: {
        "proof":
            "91cd05a14ef618b3002ae3a4d8c58d81e80cbfb647"
            "b49ae7a7274ae03fde9231",

        "public":
            "e5b2bb2b5cff15558598766b7738336fe3bc3862f0"
            "cc4af88f3a0e26e03f2bf9",
    },

    16: {
        "proof":
            "fd30b920c4fc6bea30ad1c257f44c0adfb8fc2dc411"
            "48946f17df82a39a6a454",

        "public":
            "236107f46c01eaf0a358405825b57406d38f4850a618"
            "b40321407bf3f9d90ddc",
    },
}


def sha256(path):

    h = hashlib.sha256()

    with open(path, "rb") as f:

        while True:

            block = f.read(
                1024 * 1024
            )

            if not block:
                break

            h.update(block)

    return h.hexdigest()


def write_text(path, text):

    Path(path).write_text(
        text,
        encoding="utf-8",
        newline="\n",
    )


def write_json(path, obj):

    write_text(
        path,
        json.dumps(
            obj,
            indent=2,
        )
        + "\n",
    )


def run(
    command,
    *,
    cwd=None,
    check=True,
):

    cp = subprocess.run(
        [
            str(item)
            for item in command
        ],
        cwd=(
            str(cwd)
            if cwd
            else None
        ),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )

    if check and cp.returncode != 0:

        raise RuntimeError(
            "Command failed RC="
            + str(cp.returncode)
            + "\nCOMMAND="
            + repr(command)
            + "\nSTDOUT:\n"
            + cp.stdout
            + "\nSTDERR:\n"
            + cp.stderr
        )

    return cp


def tool(name):

    path = shutil.which(name)

    if not path:
        raise RuntimeError(
            f"Required executable missing: {name}"
        )

    return path


def first_json_object(text, label):

    stripped = text.lstrip()

    if not stripped:
        raise RuntimeError(
            f"{label}: empty output"
        )

    decoder = json.JSONDecoder()

    try:

        obj, end = decoder.raw_decode(
            stripped
        )

    except json.JSONDecodeError as exc:

        raise RuntimeError(
            f"{label}: leading JSON decode failed"
        ) from exc


    if not isinstance(obj, dict):
        raise RuntimeError(
            f"{label}: leading JSON is not object"
        )


    trailing = stripped[end:]


    trailing_nonws = trailing.lstrip()


    if trailing_nonws.startswith(
        (
            "{",
            "[",
        )
    ):

        try:

            decoder.raw_decode(
                trailing_nonws
            )

        except json.JSONDecodeError:
            pass

        else:

            raise RuntimeError(
                f"{label}: multiple top-level JSON values"
            )


    return obj, trailing


def strict_json_object(text, label):

    try:

        obj = json.loads(text)

    except json.JSONDecodeError as exc:

        raise RuntimeError(
            f"{label}: strict JSON decode failed"
        ) from exc


    if not isinstance(obj, dict):
        raise RuntimeError(
            f"{label}: JSON is not object"
        )


    return obj


def first_token(text):

    values = text.strip().split()

    if not values:
        raise RuntimeError(
            "Expected command-output token"
        )

    return values[0]


def int_token(text):

    return int(
        first_token(text),
        0,
    )


def bool_token(text):

    value = first_token(
        text
    ).lower()

    if value in {
        "true",
        "1",
    }:
        return True

    if value in {
        "false",
        "0",
    }:
        return False

    raise RuntimeError(
        f"Unexpected bool token: {value}"
    )


def encode_array(values):

    return (
        "["
        + ",".join(
            str(int(value))
            for value in values
        )
        + "]"
    )


def encode_matrix(values):

    return (
        "["
        + ",".join(
            encode_array(row)
            for row in values
        )
        + "]"
    )


def encode_tuple(values):

    return (
        "("
        + ",".join(
            str(int(value))
            for value in values
        )
        + ")"
    )


def receipt_ok(receipt):

    status = receipt.get(
        "status"
    )

    if isinstance(status, str):

        return status.lower() in {
            "0x1",
            "1",
            "success",
        }

    return status == 1


def receipt_gas(receipt):

    value = receipt.get(
        "gasUsed"
    )

    if value is None:

        value = receipt.get(
            "gas_used"
        )

    if value is None:
        raise RuntimeError(
            "receipt gasUsed missing"
        )

    if isinstance(value, int):
        return value

    return int(
        str(value),
        0,
    )


def receipt_tx_hash(receipt):

    value = (
        receipt.get(
            "transactionHash"
        )
        or
        receipt.get(
            "transaction_hash"
        )
    )

    if not (
        isinstance(value, str)
        and
        value.startswith("0x")
        and
        len(value) == 66
    ):

        raise RuntimeError(
            "invalid receipt transactionHash"
        )

    return value


def validate_active_source(root):

    sol = (
        root
        / "contracts/wp4-foundry/src/VoteChainWP4.sol"
    )

    verifier = (
        root
        / (
            "contracts/wp4-foundry/src/verifiers/"
            "VoteChainVoteDirectVerifier.sol"
        )
    )


    if sha256(sol) != EXPECTED_ACTIVE_SOL_SHA:

        raise RuntimeError(
            "active Solidity hash mismatch"
        )


    if sha256(
        verifier
    ) != EXPECTED_ACTIVE_VERIFIER_SHA:

        raise RuntimeError(
            "active verifier hash mismatch"
        )


def load_fixture(root, candidate_count):

    fixture_dir = (
        root
        / R6_RELATIVE
        / "proof-fixtures"
        / f"k{candidate_count}"
    )

    proof_path = (
        fixture_dir
        / "proof.json"
    )

    public_path = (
        fixture_dir
        / "public.json"
    )


    expected = EXPECTED_FIXTURE_HASHES[
        candidate_count
    ]


    proof_sha = sha256(
        proof_path
    )

    public_sha = sha256(
        public_path
    )


    if proof_sha != expected["proof"]:

        raise RuntimeError(
            f"K{candidate_count} proof hash mismatch"
        )


    if public_sha != expected["public"]:

        raise RuntimeError(
            f"K{candidate_count} public hash mismatch"
        )


    proof = json.loads(
        proof_path.read_text(
            encoding="utf-8"
        )
    )


    public = [
        int(str(value))
        for value in json.loads(
            public_path.read_text(
                encoding="utf-8"
            )
        )
    ]


    if len(public) != 73:

        raise RuntimeError(
            f"public-signal count != 73: {len(public)}"
        )


    if public[3] != candidate_count:

        raise RuntimeError(
            "public candidateCount mismatch"
        )


    if str(
        proof.get(
            "protocol",
            ""
        )
    ).lower() != "groth16":

        raise RuntimeError(
            "proof protocol != groth16"
        )


    a = [
        int(proof["pi_a"][0]),
        int(proof["pi_a"][1]),
    ]


    b = [
        [
            int(proof["pi_b"][0][1]),
            int(proof["pi_b"][0][0]),
        ],
        [
            int(proof["pi_b"][1][1]),
            int(proof["pi_b"][1][0]),
        ],
    ]


    c = [
        int(proof["pi_c"][0]),
        int(proof["pi_c"][1]),
    ]


    return {
        "proofPath":
            proof_path,

        "publicPath":
            public_path,

        "proofSha256":
            proof_sha,

        "publicSha256":
            public_sha,

        "public":
            public,

        "a":
            a,

        "b":
            b,

        "c":
            c,

        "nullifier":
            public[8],

        "Rx":
            public[9:25],

        "Ry":
            public[25:41],

        "Sx":
            public[41:57],

        "Sy":
            public[57:73],
    }


def start_anvil(
    anvil,
    cast,
    port,
    log_path,
):

    rpc = (
        f"http://127.0.0.1:{port}"
    )


    pre = run(
        [
            cast,
            "block-number",
            "--rpc-url",
            rpc,
        ],
        check=False,
    )


    if pre.returncode == 0:

        raise RuntimeError(
            f"RPC port {port} already active"
        )


    handle = open(
        log_path,
        "w",
        encoding="utf-8",
        newline="\n",
    )


    process = subprocess.Popen(
        [
            anvil,
            "--silent",
            "--port",
            str(port),
            "--chain-id",
            str(CHAIN_ID),
        ],
        stdout=handle,
        stderr=subprocess.STDOUT,
        text=True,
    )


    for _ in range(100):

        cp = run(
            [
                cast,
                "block-number",
                "--rpc-url",
                rpc,
            ],
            check=False,
        )


        if cp.returncode == 0:

            return (
                process,
                handle,
                rpc,
            )


        if process.poll() is not None:
            break


        time.sleep(0.1)


    if process.poll() is None:

        process.terminate()

        try:

            process.wait(
                timeout=5
            )

        except subprocess.TimeoutExpired:

            process.kill()

            process.wait(
                timeout=5
            )


    handle.close()


    raise RuntimeError(
        "Anvil failed to start"
    )


def stop_anvil(
    process,
    handle,
    cast,
    rpc,
):

    if process is not None:

        if process.poll() is None:

            process.terminate()

            try:

                process.wait(
                    timeout=5
                )

            except subprocess.TimeoutExpired:

                process.kill()

                process.wait(
                    timeout=5
                )


    if handle is not None:

        handle.close()


    for _ in range(30):

        cp = run(
            [
                cast,
                "block-number",
                "--rpc-url",
                rpc,
            ],
            check=False,
        )


        if cp.returncode != 0:
            return


        time.sleep(0.1)


    raise RuntimeError(
        "Anvil RPC still reachable after cleanup"
    )


def deploy(
    *,
    root,
    forge,
    cast,
    rpc,
    output_dir,
    abi,
):

    foundry = (
        root
        / "contracts/wp4-foundry"
    )


    verifier_cp = run(
        [
            forge,
            "create",
            (
                "src/verifiers/"
                "VoteChainVoteDirectVerifier.sol:"
                "VoteChainVoteDirectVerifier"
            ),
            "--rpc-url",
            rpc,
            "--private-key",
            PRIVATE_KEY,
            "--broadcast",
            "--json",
        ],
        cwd=foundry,
    )


    write_text(
        output_dir
        / "verifier-deploy.stdout.txt",
        verifier_cp.stdout,
    )

    write_text(
        output_dir
        / "verifier-deploy.stderr.txt",
        verifier_cp.stderr,
    )


    verifier_obj, verifier_tail = first_json_object(
        verifier_cp.stdout,
        "verifier deployment",
    )


    write_text(
        output_dir
        / "verifier-deploy.trailing.txt",
        verifier_tail,
    )


    verifier_address = verifier_obj.get(
        "deployedTo"
    )


    if not (
        isinstance(
            verifier_address,
            str,
        )
        and
        verifier_address.startswith(
            "0x"
        )
        and
        len(verifier_address) == 42
    ):

        raise RuntimeError(
            "invalid verifier deployedTo"
        )


    direct_cp = run(
        [
            forge,
            "create",
            "src/VoteChainWP4.sol:VoteChainDirect",
            "--rpc-url",
            rpc,
            "--private-key",
            PRIVATE_KEY,
            "--broadcast",
            "--json",
            "--constructor-args",
            verifier_address,
        ],
        cwd=foundry,
    )


    write_text(
        output_dir
        / "direct-deploy.stdout.txt",
        direct_cp.stdout,
    )

    write_text(
        output_dir
        / "direct-deploy.stderr.txt",
        direct_cp.stderr,
    )


    direct_obj, direct_tail = first_json_object(
        direct_cp.stdout,
        "DIRECT deployment",
    )


    write_text(
        output_dir
        / "direct-deploy.trailing.txt",
        direct_tail,
    )


    direct_address = direct_obj.get(
        "deployedTo"
    )


    if not (
        isinstance(
            direct_address,
            str,
        )
        and
        direct_address.startswith(
            "0x"
        )
        and
        len(direct_address) == 42
    ):

        raise RuntimeError(
            "invalid DIRECT deployedTo"
        )


    linked = first_token(
        run(
            [
                cast,
                "call",
                direct_address,
                abi[
                    "verifierCallSignature"
                ],
                "--rpc-url",
                rpc,
            ]
        ).stdout
    )


    if linked.lower() != verifier_address.lower():

        raise RuntimeError(
            "DIRECT verifier linkage mismatch"
        )


    return (
        verifier_address,
        direct_address,
    )


def send_tx(
    *,
    cast,
    rpc,
    direct,
    signature,
    args,
    artifact_prefix,
):

    cp = run(
        [
            cast,
            "send",
            direct,
            signature,
            *[
                str(arg)
                for arg in args
            ],
            "--private-key",
            PRIVATE_KEY,
            "--rpc-url",
            rpc,
            "--json",
        ]
    )


    write_text(
        str(artifact_prefix)
        + ".stdout.txt",
        cp.stdout,
    )


    write_text(
        str(artifact_prefix)
        + ".stderr.txt",
        cp.stderr,
    )


    receipt = strict_json_object(
        cp.stdout,
        str(artifact_prefix),
    )


    if not receipt_ok(receipt):

        raise RuntimeError(
            f"{artifact_prefix}: transaction failed"
        )


    write_json(
        str(artifact_prefix)
        + ".receipt.json",
        receipt,
    )


    return receipt


def call_int(
    cast,
    rpc,
    direct,
    signature,
    *args,
):

    return int_token(
        run(
            [
                cast,
                "call",
                direct,
                signature,
                *[
                    str(arg)
                    for arg in args
                ],
                "--rpc-url",
                rpc,
            ]
        ).stdout
    )


def call_bool(
    cast,
    rpc,
    direct,
    signature,
    *args,
):

    return bool_token(
        run(
            [
                cast,
                "call",
                direct,
                signature,
                *[
                    str(arg)
                    for arg in args
                ],
                "--rpc-url",
                rpc,
            ]
        ).stdout
    )


def validate_config(
    *,
    cast,
    rpc,
    direct,
    abi,
    expected,
):

    observed = {}


    for semantic, wanted in expected.items():

        actual = call_int(
            cast,
            rpc,
            direct,
            abi[
                "configGetterCallSignatures"
            ][semantic],
        )


        observed[
            semantic
        ] = actual


        if actual != wanted:

            raise RuntimeError(
                f"configuration mismatch {semantic}: "
                f"{actual} != {wanted}"
            )


    return observed


def validate_tally(
    *,
    cast,
    rpc,
    direct,
    abi,
    fixture,
):

    rows = []


    for slot in range(16):

        cp = run(
            [
                cast,
                "call",
                direct,
                abi[
                    "getTallyCallSignature"
                ],
                str(slot),
                "--rpc-url",
                rpc,
            ]
        )


        values = [
            int(
                line.split()[0],
                0,
            )
            for line in cp.stdout.splitlines()
            if line.strip()
        ]


        if len(values) != 4:

            raise RuntimeError(
                f"getTally({slot}) returned "
                f"{len(values)} values"
            )


        expected = [
            fixture["Rx"][slot],
            fixture["Ry"][slot],
            fixture["Sx"][slot],
            fixture["Sy"][slot],
        ]


        if values != expected:

            raise RuntimeError(
                f"encrypted tally mismatch slot {slot}"
            )


        rows.append({
            "slot":
                slot,

            "actual":
                values,

            "expected":
                expected,

            "match":
                True,
        })


    return rows


def main():

    parser = argparse.ArgumentParser()


    parser.add_argument(
        "--root",
        required=True,
    )


    parser.add_argument(
        "--candidate-count",
        type=int,
        choices=[
            2,
            4,
            8,
            16,
        ],
        required=True,
    )


    parser.add_argument(
        "--kind",
        choices=[
            "pilot",
            "warmup",
            "measured",
        ],
        required=True,
    )


    parser.add_argument(
        "--round",
        type=int,
        required=True,
    )


    parser.add_argument(
        "--order-position",
        type=int,
        required=True,
    )


    parser.add_argument(
        "--repetition-id",
        required=True,
    )


    parser.add_argument(
        "--output-dir",
        required=True,
    )


    parser.add_argument(
        "--port",
        type=int,
        default=8557,
    )


    args = parser.parse_args()


    root = Path(
        args.root
    ).resolve()


    output_dir = Path(
        args.output_dir
    ).resolve()


    output_dir.mkdir(
        parents=True,
        exist_ok=False,
    )


    abi_path = (
        Path(__file__).resolve().parent
        / "C8C_R7B2_EXECUTION_ABI_FREEZE.json"
    )


    abi = json.loads(
        abi_path.read_text(
            encoding="utf-8"
        )
    )


    if abi.get("status") != "PASS":

        raise RuntimeError(
            "execution ABI freeze not PASS"
        )


    cast = tool("cast")
    forge = tool("forge")
    anvil = tool("anvil")


    process = None
    handle = None
    rpc = None

    summary = None
    error = None


    try:

        validate_active_source(
            root
        )


        fixture = load_fixture(
            root,
            args.candidate_count,
        )


        public = fixture["public"]


        semantic_values = {
            "eligibleRoot":
                public[0],

            "electionId":
                public[1],

            "candidateManifestHash":
                public[2],

            "candidateCount":
                public[3],

            "contractDomain":
                public[4],

            "Yx":
                public[5],

            "Yy":
                public[6],

            "electionContextHash":
                public[7],
        }


        tuple_values = [
            semantic_values[
                name
            ]
            for name in abi[
                "configureTupleComponentNames"
            ]
        ]


        configure_tuple = encode_tuple(
            tuple_values
        )


        process, handle, rpc = start_anvil(
            anvil,
            cast,
            args.port,
            output_dir
            / "anvil.log",
        )


        (
            verifier_address,
            direct_address,
        ) = deploy(
            root=root,
            forge=forge,
            cast=cast,
            rpc=rpc,
            output_dir=output_dir,
            abi=abi,
        )


        send_tx(
            cast=cast,
            rpc=rpc,
            direct=direct_address,
            signature=abi[
                "configureSendSignature"
            ],
            args=[
                configure_tuple,
            ],
            artifact_prefix=(
                output_dir
                / "configure"
            ),
        )


        configured_before = call_bool(
            cast,
            rpc,
            direct_address,
            abi[
                "configuredCallSignature"
            ],
        )


        if not configured_before:

            raise RuntimeError(
                "configured != true after configure"
            )


        config_before = validate_config(
            cast=cast,
            rpc=rpc,
            direct=direct_address,
            abi=abi,
            expected=semantic_values,
        )


        send_tx(
            cast=cast,
            rpc=rpc,
            direct=direct_address,
            signature=abi[
                "activateSendSignature"
            ],
            args=[],
            artifact_prefix=(
                output_dir
                / "activate"
            ),
        )


        pre_phase = call_int(
            cast,
            rpc,
            direct_address,
            abi[
                "phaseCallSignature"
            ],
        )


        pre_count = call_int(
            cast,
            rpc,
            direct_address,
            abi[
                "acceptedBallotCountCallSignature"
            ],
        )


        if pre_phase != 1:

            raise RuntimeError(
                f"pre-cast phase != Active: {pre_phase}"
            )


        if pre_count != 0:

            raise RuntimeError(
                f"pre-cast acceptedBallotCount != 0: {pre_count}"
            )


        cast_args = [
            encode_array(
                fixture["a"]
            ),

            encode_matrix(
                fixture["b"]
            ),

            encode_array(
                fixture["c"]
            ),

            str(
                fixture["nullifier"]
            ),

            encode_array(
                fixture["Rx"]
            ),

            encode_array(
                fixture["Ry"]
            ),

            encode_array(
                fixture["Sx"]
            ),

            encode_array(
                fixture["Sy"]
            ),
        ]


        calldata_cp = run(
            [
                cast,
                "calldata",
                abi[
                    "castVoteSendSignature"
                ],
                *cast_args,
            ]
        )


        calldata = first_token(
            calldata_cp.stdout
        )


        if not calldata.startswith("0x"):

            raise RuntimeError(
                "cast calldata is not hex"
            )


        calldata_hex = calldata[2:]


        if len(calldata_hex) % 2 != 0:

            raise RuntimeError(
                "cast calldata hex length is odd"
            )


        calldata_bytes = (
            len(calldata_hex)
            // 2
        )


        if calldata_bytes != 2340:

            raise RuntimeError(
                f"calldata bytes {calldata_bytes} != 2340"
            )


        byte_values = [
            int(
                calldata_hex[
                    i:i + 2
                ],
                16,
            )
            for i in range(
                0,
                len(calldata_hex),
                2,
            )
        ]


        calldata_zero = sum(
            1
            for value in byte_values
            if value == 0
        )


        calldata_nonzero = (
            calldata_bytes
            -
            calldata_zero
        )


        write_text(
            output_dir
            / "cast-calldata.txt",
            calldata
            + "\n",
        )


        cast_command = [
            cast,
            "send",
            direct_address,
            abi[
                "castVoteSendSignature"
            ],
            *cast_args,
            "--private-key",
            PRIVATE_KEY,
            "--rpc-url",
            rpc,
            "--json",
        ]


        start_ns = time.perf_counter_ns()


        cast_cp = run(
            cast_command,
            check=False,
        )


        end_ns = time.perf_counter_ns()


        latency_ms = (
            end_ns
            -
            start_ns
        ) / 1_000_000.0


        write_text(
            output_dir
            / "cast-send.stdout.txt",
            cast_cp.stdout,
        )


        write_text(
            output_dir
            / "cast-send.stderr.txt",
            cast_cp.stderr,
        )


        if cast_cp.returncode != 0:

            raise RuntimeError(
                "timed cast send failed RC="
                + str(
                    cast_cp.returncode
                )
            )


        receipt = strict_json_object(
            cast_cp.stdout,
            "timed cast receipt",
        )


        write_json(
            output_dir
            / "receipt.json",
            receipt,
        )


        if not receipt_ok(
            receipt
        ):

            raise RuntimeError(
                "timed cast receipt status != success"
            )


        tx_hash = receipt_tx_hash(
            receipt
        )


        gas_used = receipt_gas(
            receipt
        )


        if gas_used <= 0:

            raise RuntimeError(
                "gasUsed <= 0"
            )


        if not (
            math.isfinite(
                latency_ms
            )
            and
            latency_ms > 0
        ):

            raise RuntimeError(
                "invalid latencyMs"
            )


        post_count = call_int(
            cast,
            rpc,
            direct_address,
            abi[
                "acceptedBallotCountCallSignature"
            ],
        )


        used = call_bool(
            cast,
            rpc,
            direct_address,
            abi[
                "usedNullifierCallSignature"
            ],
            fixture[
                "nullifier"
            ],
        )


        post_phase = call_int(
            cast,
            rpc,
            direct_address,
            abi[
                "phaseCallSignature"
            ],
        )


        configured_after = call_bool(
            cast,
            rpc,
            direct_address,
            abi[
                "configuredCallSignature"
            ],
        )


        config_after = validate_config(
            cast=cast,
            rpc=rpc,
            direct=direct_address,
            abi=abi,
            expected=semantic_values,
        )


        tally = validate_tally(
            cast=cast,
            rpc=rpc,
            direct=direct_address,
            abi=abi,
            fixture=fixture,
        )


        if post_count != 1:

            raise RuntimeError(
                f"post acceptedBallotCount != 1: {post_count}"
            )


        if not used:

            raise RuntimeError(
                "usedNullifier != true"
            )


        if post_phase != 1:

            raise RuntimeError(
                f"post phase != Active: {post_phase}"
            )


        if not configured_after:

            raise RuntimeError(
                "configured changed from true"
            )


        summary = {
            "status":
                "PASS",

            "classification":
                (
                    "C8C_RUNTIME_CANDIDATECOUNT_"
                    "FRESH_CHAIN_SINGLE_OBSERVATION"
                ),

            "freshChain":
                True,

            "candidateCount":
                args.candidate_count,

            "kind":
                args.kind,

            "round":
                args.round,

            "orderPosition":
                args.order_position,

            "repetitionId":
                args.repetition_id,

            "proofFixture": {
                "proofPath":
                    fixture[
                        "proofPath"
                    ].as_posix(),

                "proofSha256":
                    fixture[
                        "proofSha256"
                    ],

                "publicPath":
                    fixture[
                        "publicPath"
                    ].as_posix(),

                "publicSha256":
                    fixture[
                        "publicSha256"
                    ],
            },

            "verifierAddress":
                verifier_address,

            "directAddress":
                direct_address,

            "txHash":
                tx_hash,

            "receiptStatus":
                1,

            "gasUsed":
                gas_used,

            "calldataBytes":
                calldata_bytes,

            "calldataZeroBytes":
                calldata_zero,

            "calldataNonzeroBytes":
                calldata_nonzero,

            "latencyMs":
                latency_ms,

            "timingBoundary": {
                "start":
                    (
                        "immediately before local cast-send "
                        "subprocess invocation"
                    ),

                "end":
                    (
                        "immediately after local cast-send "
                        "subprocess returns receipt output"
                    ),

                "includes":
                    [
                        "local cast process startup",
                        "RPC request",
                        "Anvil instant mining",
                        "receipt return",
                    ],

                "excludes":
                    [
                        "Anvil startup",
                        "deployment",
                        "configure transaction",
                        "activate transaction",
                        "proof generation",
                        "calldata precomputation",
                        "post-receipt reads",
                        "tally validation",
                    ],
            },

            "correctness": {
                "configuredBeforeCast":
                    configured_before,

                "configuredAfterCast":
                    configured_after,

                "configurationExactBeforeCast":
                    (
                        config_before
                        ==
                        semantic_values
                    ),

                "configurationExactAfterCast":
                    (
                        config_after
                        ==
                        semantic_values
                    ),

                "acceptedBallotCount":
                    post_count,

                "usedNullifier":
                    used,

                "phase":
                    post_phase,

                "tallySlotsChecked":
                    len(tally),

                "encryptedTallyMatch":
                    all(
                        row[
                            "match"
                        ]
                        for row in tally
                    ),
            },

            "tallyValidation":
                tally,

            "proofGeneratedDuringObservation":
                False,

            "silentRetryPerformed":
                False,
        }


    except Exception as exc:

        error = {
            "status":
                "HOLD",

            "candidateCount":
                args.candidate_count,

            "kind":
                args.kind,

            "round":
                args.round,

            "orderPosition":
                args.order_position,

            "repetitionId":
                args.repetition_id,

            "errorType":
                type(exc).__name__,

            "error":
                str(exc),

            "traceback":
                traceback.format_exc(),

            "silentRetryPerformed":
                False,
        }


    cleanup_error = None


    if (
        process is not None
        and
        rpc is not None
    ):

        try:

            stop_anvil(
                process,
                handle,
                cast,
                rpc,
            )

        except Exception as exc:

            cleanup_error = {
                "errorType":
                    type(exc).__name__,

                "error":
                    str(exc),

                "traceback":
                    traceback.format_exc(),
            }


    if cleanup_error is not None:

        if error is None:

            error = {
                "status":
                    "HOLD",

                "candidateCount":
                    args.candidate_count,

                "kind":
                    args.kind,

                "round":
                    args.round,

                "orderPosition":
                    args.order_position,

                "repetitionId":
                    args.repetition_id,

                "errorType":
                    "AnvilCleanupError",

                "error":
                    cleanup_error[
                        "error"
                    ],

                "traceback":
                    cleanup_error[
                        "traceback"
                    ],

                "silentRetryPerformed":
                    False,
            }

        else:

            error[
                "anvilCleanupError"
            ] = cleanup_error


    if error is not None:

        write_json(
            output_dir
            / "failure.json",
            error,
        )

        print(
            "OBSERVATION_STATUS=HOLD"
        )

        print(
            "ERROR="
            + error[
                "error"
            ]
        )

        return 1


    if summary is None:

        raise RuntimeError(
            "internal runner error: no result"
        )


    summary[
        "anvilStoppedBeforePassReceipt"
    ] = True


    write_json(
        output_dir
        / "iteration-summary.json",
        summary,
    )


    print(
        "OBSERVATION_STATUS=PASS"
    )

    print(
        "CANDIDATE_COUNT="
        + str(
            args.candidate_count
        )
    )

    print(
        "TX_HASH="
        + summary[
            "txHash"
        ]
    )

    print(
        "GAS_USED="
        + str(
            summary[
                "gasUsed"
            ]
        )
    )

    print(
        "CALLDATA_BYTES="
        + str(
            summary[
                "calldataBytes"
            ]
        )
    )

    print(
        "CALLDATA_ZERO_BYTES="
        + str(
            summary[
                "calldataZeroBytes"
            ]
        )
    )

    print(
        "CALLDATA_NONZERO_BYTES="
        + str(
            summary[
                "calldataNonzeroBytes"
            ]
        )
    )

    print(
        "LATENCY_MS="
        + f"{summary['latencyMs']:.6f}"
    )

    print(
        "ACCEPTED_BALLOT_COUNT=1"
    )

    print(
        "USED_NULLIFIER=TRUE"
    )

    print(
        "PHASE=ACTIVE"
    )

    print(
        "TALLY_SLOTS_CHECKED=16"
    )

    print(
        "ENCRYPTED_TALLY_MATCH=YES"
    )

    print(
        "ANVIL_STOPPED_BEFORE_PASS_RECEIPT=YES"
    )


    return 0


if __name__ == "__main__":

    raise SystemExit(
        main()
    )
