import argparse
import csv
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path


EXPECTED = {
    "c6a_record":
        "cb5e5caaf77eedc6d5e43be2bf7b5894487863feeb838bda6c2af6d99da68a96",
    "protocol":
        "6d2e3e2566fb00c364c8b0896eb2118c69b81cddac8a53d7e413c03c270fee00",
    "c2_manifest":
        "169de56d9ebef31c7507bce1a239152e65dc5defe26e5df6de431f64cffdf7a8",
    "c4_manifest":
        "cd7dc1ad4bf8ea1c9d336d1861bff11a5a8c9aae380d6b795a3c488e2d63560b",
    "active_solidity":
        "c833a70e832ce15cfe9d17c2ca71f202fc8806519514cd6846ba292804904d77",
    "active_verifier":
        "55b31cad6c02422bf22073abf482516d576d3f3eec0b964d4fecaf4effff7eba",
    "fixture_bundle_manifest":
        "0f54fd24977a4d0f6649bb8feede93f255990ac6ca9c1e38725331ce60660088",
    "fixture_index":
        "ad4e343595835f5cbd1c82716089d886f05c752fa31b85c526a539fb4dbca68e",
    "prefix_tallies":
        "169055128c7d068f66b1c38bbb7a54f2acdf2d19efe31d1173b46033ff2c079d",
}


SCALES = [
    25,
    50,
    75,
    100,
    150,
]


WARMUP_ORDER = [
    25,
    50,
    75,
    100,
    150,
]


MEASURED_ROUNDS = [
    [25, 50, 75, 100, 150],
    [50, 75, 100, 150, 25],
    [75, 100, 150, 25, 50],
    [100, 150, 25, 50, 75],
    [150, 25, 50, 75, 100],
]


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


CONFIG_SIG = (
    "configure(("
    "uint256,uint256,uint256,uint256,"
    "uint256,uint256,uint256,uint256"
    "))"
)


PRIVATE_KEY = (
    "0xac0974bec39a17e36ba4a6b4d238ff944"
    "bacb478cbed5efcae784d7bf4f2ff80"
)


def sha_file(path):
    h = hashlib.sha256()

    with open(path, "rb") as f:
        for chunk in iter(
            lambda: f.read(
                1024 * 1024
            ),
            b"",
        ):
            h.update(chunk)

    return h.hexdigest()


def require_hash(
    path,
    expected,
    label,
):
    actual = sha_file(path)

    if actual != expected:
        raise RuntimeError(
            f"{label} hash mismatch: "
            f"{actual} != {expected}"
        )


def run(
    cmd,
    *,
    cwd=None,
    check=True,
):
    cp = subprocess.run(
        cmd,
        cwd=cwd,
        text=True,
        capture_output=True,
        check=False,
    )

    if (
        check
        and cp.returncode != 0
    ):
        raise RuntimeError(
            "COMMAND_FAILED\n"
            + " ".join(
                str(x)
                for x in cmd
            )
            + "\nSTDOUT:\n"
            + cp.stdout
            + "\nSTDERR:\n"
            + cp.stderr
        )

    return cp


def first_token(text):
    for line in (
        text.replace(
            "\r",
            "",
        ).splitlines()
    ):
        line = line.strip()

        if line:
            return line.split()[0]

    return ""


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


def extract_address(text):
    try:
        obj = json.loads(text)

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
    except Exception:
        pass

    m = re.search(
        r"0x[a-fA-F0-9]{40}",
        text,
    )

    if m:
        return m.group(0)

    raise RuntimeError(
        "could not parse deployed address"
    )


def load_json(path):
    with open(
        path,
        encoding="utf-8",
    ) as f:
        return json.load(f)


def validate_fixture_bundle(
    bundle,
):
    manifest_path = (
        bundle
        / "FIXTURE_BUNDLE_MANIFEST.json"
    )

    require_hash(
        manifest_path,
        EXPECTED[
            "fixture_bundle_manifest"
        ],
        "fixture bundle manifest",
    )

    manifest = load_json(
        manifest_path
    )

    for item in manifest["files"]:
        path = (
            bundle
            / item["path"]
        )

        if not path.is_file():
            raise RuntimeError(
                f"missing fixture bundle file: "
                f"{item['path']}"
            )

        actual = sha_file(
            path
        )

        if actual != item["sha256"]:
            raise RuntimeError(
                f"fixture bundle content mismatch: "
                f"{item['path']}"
            )

    index_path = (
        bundle
        / "fixture-index.json"
    )

    tallies_path = (
        bundle
        / "expected-prefix-tallies.json"
    )

    require_hash(
        index_path,
        EXPECTED[
            "fixture_index"
        ],
        "fixture index",
    )

    require_hash(
        tallies_path,
        EXPECTED[
            "prefix_tallies"
        ],
        "prefix tallies",
    )

    index = load_json(
        index_path
    )

    if index["fixtureCount"] != 150:
        raise RuntimeError(
            "fixtureCount != 150"
        )

    if (
        index[
            "calldataBytesPerFixture"
        ]
        != 2340
    ):
        raise RuntimeError(
            "fixture calldata bytes != 2340"
        )

    if (
        index[
            "castVoteSelector"
        ]
        != "0x84943e35"
    ):
        raise RuntimeError(
            "fixture selector mismatch"
        )

    return index


def validate_frozen_inputs(
    root,
    bundle,
):
    c6a = (
        root
        / "experiments/wp8"
        / "20261002_213259"
        / "wp8e-c6a-final-scaling-freeze"
        / "C6A_FREEZE_RECORD.txt"
    )

    protocol = (
        root
        / "experiments/wp8"
        / "final-benchmark-protocol-v2"
        / "WP8E_FINAL_BENCHMARK_DESIGN_V2.txt"
    )

    c2_manifest = (
        root
        / "experiments/wp8"
        / "20261002_175126"
        / "wp8e-c2-150-ballot-input-corpus"
        / "CORPUS_MANIFEST_SHA256.txt"
    )

    c4_manifest = (
        root
        / "experiments/wp8"
        / "20261002_203344"
        / "wp8e-c4-full-150-proof-corpus"
        / "C4_PROOF_CORPUS_MANIFEST_SHA256.txt"
    )

    active_sol = (
        root
        / "contracts/wp4-foundry"
        / "src/VoteChainWP4.sol"
    )

    active_verifier = (
        root
        / "contracts/wp4-foundry"
        / "src/verifiers"
        / "VoteChainVoteDirectVerifier.sol"
    )

    require_hash(
        c6a,
        EXPECTED["c6a_record"],
        "C6A record",
    )

    require_hash(
        protocol,
        EXPECTED["protocol"],
        "protocol",
    )

    require_hash(
        c2_manifest,
        EXPECTED["c2_manifest"],
        "C2 manifest",
    )

    require_hash(
        c4_manifest,
        EXPECTED["c4_manifest"],
        "C4 manifest",
    )

    require_hash(
        active_sol,
        EXPECTED["active_solidity"],
        "active Solidity",
    )

    require_hash(
        active_verifier,
        EXPECTED["active_verifier"],
        "active verifier",
    )

    validate_fixture_bundle(
        bundle
    )


def campaign_plan():
    plan = []

    for scale in WARMUP_ORDER:
        plan.append({
            "kind": "warmup",
            "round": 0,
            "scale": scale,
        })

    for round_index, order in enumerate(
        MEASURED_ROUNDS,
        start=1,
    ):
        for scale in order:
            plan.append({
                "kind": "measured",
                "round":
                    round_index,
                "scale":
                    scale,
            })

    return plan


def validate_plan():
    plan = campaign_plan()

    if len(plan) != 30:
        raise RuntimeError(
            "campaign election count != 30"
        )

    warmup_total = sum(
        item["scale"]
        for item in plan
        if item["kind"] == "warmup"
    )

    measured_total = sum(
        item["scale"]
        for item in plan
        if item["kind"] == "measured"
    )

    if warmup_total != 400:
        raise RuntimeError(
            "warmup tx total != 400"
        )

    if measured_total != 2000:
        raise RuntimeError(
            "measured tx total != 2000"
        )

    for scale in SCALES:
        repetitions = [
            x
            for x in plan
            if (
                x["kind"]
                == "measured"
                and x["scale"]
                == scale
            )
        ]

        if len(repetitions) != 5:
            raise RuntimeError(
                f"scale {scale}: "
                "measured reps != 5"
            )

    return (
        plan,
        warmup_total,
        measured_total,
    )


def stop_anvil(
    process,
    cast,
    rpc,
):
    if (
        process
        and process.poll()
        is None
    ):
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


def start_anvil(
    anvil,
    cast,
    port,
    log_file,
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
            f"RPC port {port} already in use"
        )

    log_handle = open(
        log_file,
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
            "31337",
        ],
        stdout=log_handle,
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
                log_handle,
                rpc,
            )

        if process.poll() is not None:
            break

        time.sleep(0.1)

    try:
        stop_anvil(
            process,
            cast,
            rpc,
        )
    finally:
        log_handle.close()

    raise RuntimeError(
        "Anvil failed to start"
    )


def deploy_contracts(
    root,
    forge,
    cast,
    rpc,
    election_dir,
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

    (
        election_dir
        / "verifier-deploy.json"
    ).write_text(
        verifier_cp.stdout,
        encoding="utf-8",
        newline="\n",
    )

    verifier = extract_address(
        verifier_cp.stdout
    )

    direct_cp = run(
        [
            forge,
            "create",
            (
                "src/VoteChainWP4.sol:"
                "VoteChainDirect"
            ),
            "--rpc-url",
            rpc,
            "--private-key",
            PRIVATE_KEY,
            "--broadcast",
            "--json",
            "--constructor-args",
            verifier,
        ],
        cwd=foundry,
    )

    (
        election_dir
        / "direct-deploy.json"
    ).write_text(
        direct_cp.stdout,
        encoding="utf-8",
        newline="\n",
    )

    direct = extract_address(
        direct_cp.stdout
    )

    linked = first_token(
        run(
            [
                cast,
                "call",
                direct,
                "verifier()(address)",
                "--rpc-url",
                rpc,
            ]
        ).stdout
    )

    if (
        linked.lower()
        != verifier.lower()
    ):
        raise RuntimeError(
            "verifier constructor link mismatch"
        )

    return (
        verifier,
        direct,
    )


def configure_and_activate(
    root,
    cast,
    rpc,
    direct,
):
    config_path = (
        root
        / "experiments/wp8"
        / "20261002_175126"
        / "wp8e-c2-150-ballot-input-corpus"
        / "corpus/corpus-config.json"
    )

    cfg = load_json(
        config_path
    )["config"]

    keys = (
        "eligibleRoot",
        "electionId",
        "candidateManifestHash",
        "candidateCount",
        "contractDomain",
        "Yx",
        "Yy",
        "electionContextHash",
    )

    config_arg = (
        "("
        + ",".join(
            str(cfg[k])
            for k in keys
        )
        + ")"
    )

    admin = first_token(
        run(
            [
                cast,
                "wallet",
                "address",
                "--private-key",
                PRIVATE_KEY,
            ]
        ).stdout
    )

    run(
        [
            cast,
            "call",
            direct,
            CONFIG_SIG,
            config_arg,
            "--from",
            admin,
            "--rpc-url",
            rpc,
        ]
    )

    run(
        [
            cast,
            "send",
            direct,
            CONFIG_SIG,
            config_arg,
            "--private-key",
            PRIVATE_KEY,
            "--rpc-url",
            rpc,
            "--json",
        ]
    )

    configured = first_token(
        run(
            [
                cast,
                "call",
                direct,
                "configured()(bool)",
                "--rpc-url",
                rpc,
            ]
        ).stdout
    )

    if configured != "true":
        raise RuntimeError(
            "configured != true"
        )

    run(
        [
            cast,
            "call",
            direct,
            "activate()",
            "--from",
            admin,
            "--rpc-url",
            rpc,
        ]
    )

    run(
        [
            cast,
            "send",
            direct,
            "activate()",
            "--private-key",
            PRIVATE_KEY,
            "--rpc-url",
            rpc,
            "--json",
        ]
    )

    phase = first_token(
        run(
            [
                cast,
                "call",
                direct,
                "phase()(uint8)",
                "--rpc-url",
                rpc,
            ]
        ).stdout
    )

    count = first_token(
        run(
            [
                cast,
                "call",
                direct,
                (
                    "acceptedBallotCount()"
                    "(uint256)"
                ),
                "--rpc-url",
                rpc,
            ]
        ).stdout
    )

    if phase != "1":
        raise RuntimeError(
            f"phase != 1: {phase}"
        )

    if count != "0":
        raise RuntimeError(
            f"initial count != 0: {count}"
        )

    for slot in range(16):
        values = [
            line.split()[0]
            for line in run(
                [
                    cast,
                    "call",
                    direct,
                    (
                        "getTally(uint256)"
                        "(uint256,uint256,"
                        "uint256,uint256)"
                    ),
                    str(slot),
                    "--rpc-url",
                    rpc,
                ]
            ).stdout
            .replace(
                "\r",
                "",
            )
            .splitlines()
            if line.strip()
        ]

        if values != [
            "0",
            "1",
            "0",
            "1",
        ]:
            raise RuntimeError(
                f"initial tally slot "
                f"{slot} mismatch"
            )


def verify_final_state(
    bundle,
    cast,
    rpc,
    direct,
    scale,
):
    count = first_token(
        run(
            [
                cast,
                "call",
                direct,
                (
                    "acceptedBallotCount()"
                    "(uint256)"
                ),
                "--rpc-url",
                rpc,
            ]
        ).stdout
    )

    if int(count) != scale:
        raise RuntimeError(
            f"final count {count} "
            f"!= scale {scale}"
        )

    for n in range(
        1,
        scale + 1,
    ):
        fixture = load_json(
            bundle
            / "fixtures"
            / f"ballot-{n:03d}.json"
        )

        used = first_token(
            run(
                [
                    cast,
                    "call",
                    direct,
                    (
                        "usedNullifier(uint256)"
                        "(bool)"
                    ),
                    fixture["nullifier"],
                    "--rpc-url",
                    rpc,
                ]
            ).stdout
        )

        if used != "true":
            raise RuntimeError(
                f"nullifier not consumed: "
                f"{n:03d}"
            )

    expected = load_json(
        bundle
        / "expected-prefix-tallies.json"
    )["checkpoints"][str(scale)]

    actual_slots = []

    for slot in range(16):
        values = [
            line.split()[0]
            for line in run(
                [
                    cast,
                    "call",
                    direct,
                    (
                        "getTally(uint256)"
                        "(uint256,uint256,"
                        "uint256,uint256)"
                    ),
                    str(slot),
                    "--rpc-url",
                    rpc,
                ]
            ).stdout
            .replace(
                "\r",
                "",
            )
            .splitlines()
            if line.strip()
        ]

        if len(values) != 4:
            raise RuntimeError(
                f"slot {slot} decode failure"
            )

        actual_slots.append({
            "slot": slot,
            "Rx": values[0],
            "Ry": values[1],
            "Sx": values[2],
            "Sy": values[3],
        })

    wanted_slots = [
        {
            "slot": int(x["slot"]),
            "Rx": str(x["Rx"]),
            "Ry": str(x["Ry"]),
            "Sx": str(x["Sx"]),
            "Sy": str(x["Sy"]),
        }
        for x in expected["slots"]
    ]

    if actual_slots != wanted_slots:
        raise RuntimeError(
            "encrypted tally mismatch"
        )

    return {
        "acceptedBallotCount":
            scale,
        "consumedNullifiers":
            scale,
        "tallySlotsChecked":
            16,
        "encryptedTallyMatch":
            True,
        "candidatePlaintextCounts":
            expected[
                "candidatePlaintextCounts"
            ],
    }


def execute_campaign(
    root,
    bundle,
    output,
    port,
):
    forge = shutil.which(
        "forge"
    )

    cast = shutil.which(
        "cast"
    )

    anvil = shutil.which(
        "anvil"
    )

    if not all(
        [forge, cast, anvil]
    ):
        raise RuntimeError(
            "Foundry toolchain missing"
        )

    output.mkdir(
        parents=True,
        exist_ok=False,
    )

    receipts_root = (
        output
        / "receipts"
    )

    elections_root = (
        output
        / "elections"
    )

    receipts_root.mkdir()
    elections_root.mkdir()

    plan, warmup_total, measured_total = (
        validate_plan()
    )

    raw_path = (
        output
        / "raw-transactions.tsv"
    )

    headers = [
        "kind",
        "measured_round",
        "election_sequence",
        "repetition_id",
        "scale",
        "ballot_position",
        "ballot_id",
        "candidate_index",
        "tx_hash",
        "receipt_status",
        "gas_used",
        "calldata_bytes",
        "latency_ms",
    ]

    with open(
        raw_path,
        "w",
        encoding="utf-8",
        newline="",
    ) as raw_file:

        writer = csv.DictWriter(
            raw_file,
            fieldnames=headers,
            delimiter="\t",
            lineterminator="\n",
        )

        writer.writeheader()
        raw_file.flush()

        metadata = {
            "startedAt":
                datetime.now().astimezone().isoformat(),
            "port":
                port,
            "warmupAcceptedTx":
                warmup_total,
            "measuredAcceptedTx":
                measured_total,
            "totalAcceptedTx":
                warmup_total
                + measured_total,
            "plan":
                plan,
        }

        (
            output
            / "campaign-plan.json"
        ).write_text(
            json.dumps(
                metadata,
                indent=2,
            ) + "\n",
            encoding="utf-8",
            newline="\n",
        )

        election_sequence = 0

        for item in plan:

            election_sequence += 1

            kind = item["kind"]
            measured_round = (
                item["round"]
            )
            scale = item["scale"]

            repetition_id = (
                f"{kind}-"
                f"r{measured_round}-"
                f"n{scale}-"
                f"e{election_sequence:02d}"
            )

            election_dir = (
                elections_root
                / repetition_id
            )

            receipt_dir = (
                receipts_root
                / repetition_id
            )

            election_dir.mkdir()
            receipt_dir.mkdir()

            anvil_process = None
            anvil_log_handle = None
            rpc = (
                f"http://127.0.0.1:{port}"
            )

            try:
                (
                    anvil_process,
                    anvil_log_handle,
                    rpc,
                ) = start_anvil(
                    anvil,
                    cast,
                    port,
                    election_dir
                    / "anvil.log",
                )

                verifier, direct = (
                    deploy_contracts(
                        root,
                        forge,
                        cast,
                        rpc,
                        election_dir,
                    )
                )

                configure_and_activate(
                    root,
                    cast,
                    rpc,
                    direct,
                )

                for n in range(
                    1,
                    scale + 1,
                ):

                    ballot_id = (
                        f"{n:03d}"
                    )

                    fixture = load_json(
                        bundle
                        / "fixtures"
                        / (
                            f"ballot-"
                            f"{ballot_id}.json"
                        )
                    )

                    start_ns = (
                        time.perf_counter_ns()
                    )

                    cp = run(
                        [
                            cast,
                            "send",
                            direct,
                            CAST_SIG,
                            *fixture[
                                "castArgs"
                            ],
                            "--private-key",
                            PRIVATE_KEY,
                            "--rpc-url",
                            rpc,
                            "--json",
                        ],
                        check=False,
                    )

                    end_ns = (
                        time.perf_counter_ns()
                    )

                    latency_ms = (
                        end_ns
                        - start_ns
                    ) / 1_000_000.0

                    receipt_file = (
                        receipt_dir
                        / (
                            f"ballot-"
                            f"{ballot_id}.json"
                        )
                    )

                    receipt_file.write_text(
                        cp.stdout,
                        encoding="utf-8",
                        newline="\n",
                    )

                    if cp.returncode != 0:
                        (
                            election_dir
                            / (
                                f"ballot-"
                                f"{ballot_id}"
                                "-send.stderr"
                            )
                        ).write_text(
                            cp.stderr,
                            encoding="utf-8",
                            newline="\n",
                        )

                        raise RuntimeError(
                            f"{repetition_id}: "
                            f"ballot {ballot_id} "
                            "cast send failed"
                        )

                    (
                        ok,
                        tx_hash,
                        gas_used,
                        _,
                    ) = receipt_info(
                        cp.stdout
                    )

                    if not ok:
                        raise RuntimeError(
                            f"{repetition_id}: "
                            f"ballot {ballot_id} "
                            "receipt status failure"
                        )

                    row = {
                        "kind":
                            kind,
                        "measured_round":
                            measured_round,
                        "election_sequence":
                            election_sequence,
                        "repetition_id":
                            repetition_id,
                        "scale":
                            scale,
                        "ballot_position":
                            n,
                        "ballot_id":
                            ballot_id,
                        "candidate_index":
                            fixture[
                                "candidateIndex"
                            ],
                        "tx_hash":
                            tx_hash,
                        "receipt_status":
                            1,
                        "gas_used":
                            gas_used,
                        "calldata_bytes":
                            fixture[
                                "calldataBytes"
                            ],
                        "latency_ms":
                            f"{latency_ms:.6f}",
                    }

                    writer.writerow(
                        row
                    )

                    raw_file.flush()

                correctness = (
                    verify_final_state(
                        bundle,
                        cast,
                        rpc,
                        direct,
                        scale,
                    )
                )

                election_summary = {
                    "repetitionId":
                        repetition_id,
                    "kind":
                        kind,
                    "measuredRound":
                        measured_round,
                    "scale":
                        scale,
                    "verifierAddress":
                        verifier,
                    "directAddress":
                        direct,
                    "correctness":
                        correctness,
                    "status":
                        "PASS",
                }

                (
                    election_dir
                    / "election-summary.json"
                ).write_text(
                    json.dumps(
                        election_summary,
                        indent=2,
                    ) + "\n",
                    encoding="utf-8",
                    newline="\n",
                )

            except Exception as exc:

                failure = {
                    "repetitionId":
                        repetition_id,
                    "kind":
                        kind,
                    "measuredRound":
                        measured_round,
                    "scale":
                        scale,
                    "error":
                        str(exc),
                    "status":
                        "HOLD",
                }

                (
                    election_dir
                    / "FAILURE.json"
                ).write_text(
                    json.dumps(
                        failure,
                        indent=2,
                    ) + "\n",
                    encoding="utf-8",
                    newline="\n",
                )

                raise

            finally:

                if anvil_process:
                    stop_anvil(
                        anvil_process,
                        cast,
                        rpc,
                    )

                if anvil_log_handle:
                    anvil_log_handle.close()

    final = {
        "completedAt":
            datetime.now().astimezone().isoformat(),
        "warmupAcceptedTx":
            400,
        "measuredAcceptedTx":
            2000,
        "totalAcceptedTx":
            2400,
        "elections":
            30,
        "status":
            "PASS",
    }

    (
        output
        / "campaign-complete.json"
    ).write_text(
        json.dumps(
            final,
            indent=2,
        ) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--root",
        default=os.getcwd(),
    )

    parser.add_argument(
        "--bundle",
        required=True,
    )

    parser.add_argument(
        "--validate-only",
        action="store_true",
    )

    parser.add_argument(
        "--execute-final-campaign",
        action="store_true",
    )

    parser.add_argument(
        "--output",
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

    bundle = Path(
        args.bundle
    ).resolve()

    validate_frozen_inputs(
        root,
        bundle,
    )

    (
        plan,
        warmup_total,
        measured_total,
    ) = validate_plan()

    print(
        "FROZEN_INPUT_VALIDATION=PASS"
    )

    print(
        f"CAMPAIGN_ELECTION_COUNT={len(plan)}"
    )

    print(
        f"WARMUP_ACCEPTED_TX_TOTAL={warmup_total}"
    )

    print(
        f"MEASURED_ACCEPTED_TX_TOTAL={measured_total}"
    )

    print(
        "TOTAL_ACCEPTED_TX="
        f"{warmup_total + measured_total}"
    )

    print(
        "SCALES=25,50,75,100,150"
    )

    print(
        "MEASURED_ELECTIONS_PER_SCALE=5"
    )

    if args.validate_only:

        if args.execute_final_campaign:
            raise RuntimeError(
                "validate-only and execute "
                "cannot be combined"
            )

        print(
            "VALIDATE_ONLY=YES"
        )

        print(
            "ANVIL_STARTED=NO"
        )

        print(
            "TRANSACTION_SUBMITTED=NO"
        )

        print(
            "RUNNER_VALIDATION=PASS"
        )

        return

    if not args.execute_final_campaign:
        raise RuntimeError(
            "execution locked: "
            "use --execute-final-campaign"
        )

    if not args.output:
        raise RuntimeError(
            "--output is required "
            "for campaign execution"
        )

    execute_campaign(
        root,
        bundle,
        Path(args.output).resolve(),
        args.port,
    )


if __name__ == "__main__":
    main()
