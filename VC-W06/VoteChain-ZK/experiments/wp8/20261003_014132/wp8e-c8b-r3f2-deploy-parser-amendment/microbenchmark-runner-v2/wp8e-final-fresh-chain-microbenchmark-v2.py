#!/usr/bin/env python3

import argparse
import csv
import hashlib
import importlib.util
import json
import shutil
import sys
import time
from pathlib import Path


EXPECTED_V2_SHA = "421854b66fa862a1a6beafb2022bcd113d1bb664d20dd613bbd372de0da5a6c2"
EXPECTED_CONFIG_SHA = "6071b3f9f9cc0981593d74e992f81ccb53463f01909c1b33b523a0a96a3b1f39"
EXPECTED_SOL_SHA = "c833a70e832ce15cfe9d17c2ca71f202fc8806519514cd6846ba292804904d77"
EXPECTED_VERIFIER_SHA = "55b31cad6c02422bf22073abf482516d576d3f3eec0b964d4fecaf4effff7eba"

EXPECTED_FIXTURE_SHA = (
    "5510e637f805dd37091e62c961f3313097ad7db2e09a937d1f786aa0d12c344e"
)

EXPECTED_CALLDATA_SHA = (
    "a883ca98a7149137725d057d481b18160c321afa55ca33c3c944a338ba8e7835"
)

EXPECTED_CALLDATA_BYTES = 2340
EXPECTED_BALLOT_ID = "001"
EXPECTED_CANDIDATE_INDEX = 0

WARMUP_ITERATIONS = 5
MEASURED_ITERATIONS = 20
TOTAL_FINAL_ITERATIONS = 25

V2_RUNNER_REL = Path(
    "experiments/wp8/20261003_014132/wp8e-c8b-r3f2-deploy-parser-amendment"
    "/runner-v3"
    "/wp8e-final-scaling-runner-v3.py"
)

CONFIG_REL = Path(
    "experiments/wp8"
    "/20261002_175126"
    "/wp8e-c2-150-ballot-input-corpus"
    "/corpus/corpus-config.json"
)

SOL_REL = Path(
    "contracts/wp4-foundry"
    "/src/VoteChainWP4.sol"
)

VERIFIER_REL = Path(
    "contracts/wp4-foundry"
    "/src/verifiers/"
    "VoteChainVoteDirectVerifier.sol"
)


def sha_file(path):
    h = hashlib.sha256()

    with open(
        path,
        "rb",
    ) as f:
        for block in iter(
            lambda: f.read(1024 * 1024),
            b"",
        ):
            h.update(block)

    return h.hexdigest()


def require_hash(
    path,
    expected,
    label,
):
    if not path.is_file():
        raise RuntimeError(
            f"{label} missing: {path}"
        )

    actual = sha_file(
        path
    )

    if actual != expected:
        raise RuntimeError(
            f"{label} hash mismatch: "
            f"{actual} != {expected}"
        )

    return actual


def load_json(path):
    with open(
        path,
        encoding="utf-8",
    ) as f:
        return json.load(f)


def load_v2(root):
    path = (
        root
        / V2_RUNNER_REL
    )

    require_hash(
        path,
        EXPECTED_V2_SHA,
        "frozen Runner V2",
    )

    spec = (
        importlib.util
        .spec_from_file_location(
            "wp8e_frozen_runner_v2",
            path,
        )
    )

    if (
        spec is None
        or spec.loader is None
    ):
        raise RuntimeError(
            "could not import frozen Runner V2"
        )

    module = (
        importlib.util
        .module_from_spec(
            spec
        )
    )

    spec.loader.exec_module(
        module
    )

    required = [
        "run",
        "first_token",
        "receipt_info",
        "validate_frozen_inputs",
        "validate_fixture_bundle",
        "start_anvil",
        "stop_anvil",
        "deploy_contracts",
        "configure_and_activate",
        "PRIVATE_KEY",
        "CAST_SIG",
    ]

    missing = [
        name
        for name in required
        if not hasattr(
            module,
            name,
        )
    ]

    if missing:
        raise RuntimeError(
            "Runner V2 missing required symbols: "
            + ",".join(missing)
        )

    return module


def parse_uint_array_arg(
    value,
    label,
):
    if isinstance(
        value,
        list,
    ):
        parsed = value

    elif isinstance(
        value,
        str,
    ):
        parsed = json.loads(
            value
        )

    else:
        raise RuntimeError(
            f"{label}: unsupported array type "
            f"{type(value).__name__}"
        )

    if not isinstance(
        parsed,
        list,
    ):
        raise RuntimeError(
            f"{label}: parsed value is not list"
        )

    if len(parsed) != 16:
        raise RuntimeError(
            f"{label}: length "
            f"{len(parsed)} != 16"
        )

    return [
        int(x)
        for x in parsed
    ]


def resolve_fixture(
    bundle,
):
    index = load_json(
        bundle
        / "fixture-index.json"
    )

    entries = [
        x
        for x in index[
            "fixtures"
        ]
        if x["ballotId"]
        == EXPECTED_BALLOT_ID
    ]

    if len(entries) != 1:
        raise RuntimeError(
            "ballotId 001 index multiplicity "
            f"{len(entries)} != 1"
        )

    entry = entries[0]

    if (
        entry["fixtureFile"]
        != "fixtures/ballot-001.json"
    ):
        raise RuntimeError(
            "ballot-001 fixture path mismatch"
        )

    if (
        entry["fixtureSha256"]
        != EXPECTED_FIXTURE_SHA
    ):
        raise RuntimeError(
            "ballot-001 expected fixture "
            "hash mismatch in index"
        )

    if (
        entry["calldataSha256"]
        != EXPECTED_CALLDATA_SHA
    ):
        raise RuntimeError(
            "ballot-001 expected calldata "
            "hash mismatch in index"
        )

    if (
        int(
            entry["calldataBytes"]
        )
        != EXPECTED_CALLDATA_BYTES
    ):
        raise RuntimeError(
            "ballot-001 calldata bytes mismatch"
        )

    if (
        int(
            entry["candidateIndex"]
        )
        != EXPECTED_CANDIDATE_INDEX
    ):
        raise RuntimeError(
            "ballot-001 candidate index mismatch"
        )

    fixture_path = (
        bundle
        / entry["fixtureFile"]
    )

    require_hash(
        fixture_path,
        EXPECTED_FIXTURE_SHA,
        "ballot-001 fixture",
    )

    fixture = load_json(
        fixture_path
    )

    cast_args = fixture.get(
        "castArgs"
    )

    if not isinstance(
        cast_args,
        list,
    ):
        raise RuntimeError(
            "fixture castArgs is not list"
        )

    if len(cast_args) != 8:
        raise RuntimeError(
            "fixture castArgs length "
            f"{len(cast_args)} != 8"
        )

    nullifier = int(
        cast_args[3]
    )

    if str(
        nullifier
    ) != str(
        entry["nullifier"]
    ):
        raise RuntimeError(
            "fixture nullifier does not "
            "match fixture index"
        )

    rx = parse_uint_array_arg(
        cast_args[4],
        "Rx",
    )

    ry = parse_uint_array_arg(
        cast_args[5],
        "Ry",
    )

    sx = parse_uint_array_arg(
        cast_args[6],
        "Sx",
    )

    sy = parse_uint_array_arg(
        cast_args[7],
        "Sy",
    )

    return {
        "entry":
            entry,
        "fixture":
            fixture,
        "nullifier":
            nullifier,
        "expectedTally": [
            [
                rx[i],
                ry[i],
                sx[i],
                sy[i],
            ]
            for i in range(16)
        ],
    }


def validate_inputs(
    root,
    bundle,
):
    require_hash(
        root / SOL_REL,
        EXPECTED_SOL_SHA,
        "active Solidity",
    )

    require_hash(
        root / VERIFIER_REL,
        EXPECTED_VERIFIER_SHA,
        "active verifier",
    )

    config_path = (
        root
        / CONFIG_REL
    )

    require_hash(
        config_path,
        EXPECTED_CONFIG_SHA,
        "C2 corpus config",
    )

    config = load_json(
        config_path
    ).get(
        "config"
    )

    if not isinstance(
        config,
        dict,
    ):
        raise RuntimeError(
            "C2 config object missing"
        )

    if int(
        config.get(
            "candidateCount",
            -1,
        )
    ) != 4:
        raise RuntimeError(
            "candidateCount != 4"
        )

    v2 = load_v2(
        root
    )

    v2.validate_frozen_inputs(
        root,
        bundle,
    )

    index = (
        v2.validate_fixture_bundle(
            bundle
        )
    )

    if int(
        index["fixtureCount"]
    ) != 150:
        raise RuntimeError(
            "fixtureCount != 150"
        )

    resolved = resolve_fixture(
        bundle
    )

    return (
        v2,
        resolved,
    )


def call_first(
    v2,
    args,
):
    return v2.first_token(
        v2.run(
            args
        ).stdout
    )


def read_tally_slot(
    v2,
    cast,
    rpc,
    direct,
    slot,
):
    cp = v2.run(
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
    )

    values = [
        line.split()[0]
        for line in (
            cp.stdout
            .replace(
                "\r",
                "",
            )
            .splitlines()
        )
        if line.strip()
    ]

    if len(values) != 4:
        raise RuntimeError(
            f"slot {slot}: "
            f"returned {len(values)} values"
        )

    return [
        int(x)
        for x in values
    ]


def verify_single_vote_state(
    v2,
    cast,
    rpc,
    direct,
    nullifier,
    expected_tally,
):
    count = call_first(
        v2,
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
        ],
    )

    if count != "1":
        raise RuntimeError(
            f"acceptedBallotCount != 1: {count}"
        )

    used = call_first(
        v2,
        [
            cast,
            "call",
            direct,
            (
                "usedNullifier(uint256)"
                "(bool)"
            ),
            str(nullifier),
            "--rpc-url",
            rpc,
        ],
    )

    if used != "true":
        raise RuntimeError(
            f"usedNullifier != true: {used}"
        )

    phase = call_first(
        v2,
        [
            cast,
            "call",
            direct,
            "phase()(uint8)",
            "--rpc-url",
            rpc,
        ],
    )

    if phase != "1":
        raise RuntimeError(
            f"phase != 1 after vote: {phase}"
        )

    for slot in range(16):

        actual = read_tally_slot(
            v2,
            cast,
            rpc,
            direct,
            slot,
        )

        expected = (
            expected_tally[
                slot
            ]
        )

        if actual != expected:
            raise RuntimeError(
                f"slot {slot} tally mismatch"
            )

    return {
        "acceptedBallotCount":
            1,
        "usedNullifier":
            True,
        "phase":
            1,
        "tallySlotsChecked":
            16,
        "encryptedTallyMatch":
            True,
    }


def final_plan():
    plan = []

    for i in range(
        1,
        WARMUP_ITERATIONS + 1,
    ):
        plan.append({
            "kind":
                "warmup",
            "iteration":
                i,
            "repetitionId":
                f"warmup-{i:02d}",
        })

    for i in range(
        1,
        MEASURED_ITERATIONS + 1,
    ):
        plan.append({
            "kind":
                "measured",
            "iteration":
                i,
            "repetitionId":
                f"measured-{i:02d}",
        })

    if len(plan) != 25:
        raise RuntimeError(
            "final microbenchmark plan "
            "length != 25"
        )

    return plan


def execute_plan(
    root,
    bundle,
    output,
    port,
    plan,
    classification,
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

    v2, resolved = (
        validate_inputs(
            root,
            bundle,
        )
    )

    fixture = resolved[
        "fixture"
    ]

    nullifier = resolved[
        "nullifier"
    ]

    expected_tally = resolved[
        "expectedTally"
    ]

    output.mkdir(
        parents=True,
        exist_ok=False,
    )

    iterations_root = (
        output
        / "iterations"
    )

    receipts_root = (
        output
        / "receipts"
    )

    iterations_root.mkdir()
    receipts_root.mkdir()

    raw_path = (
        output
        / "raw-microbenchmark.tsv"
    )

    headers = [
        "kind",
        "iteration",
        "repetition_id",
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

        for item in plan:

            kind = item[
                "kind"
            ]

            iteration = int(
                item["iteration"]
            )

            repetition_id = (
                item[
                    "repetitionId"
                ]
            )

            iteration_dir = (
                iterations_root
                / repetition_id
            )

            iteration_dir.mkdir()

            process = None
            log_handle = None
            rpc = None

            try:
                (
                    process,
                    log_handle,
                    rpc,
                ) = v2.start_anvil(
                    anvil,
                    cast,
                    port,
                    (
                        iteration_dir
                        / "anvil.log"
                    ),
                )

                (
                    verifier,
                    direct,
                ) = v2.deploy_contracts(
                    root,
                    forge,
                    cast,
                    rpc,
                    iteration_dir,
                )

                v2.configure_and_activate(
                    root,
                    cast,
                    rpc,
                    direct,
                )

                # Deployment, configuration, activation,
                # fixture loading and pre-state validation
                # are all outside the timed interval.

                start_ns = (
                    time.perf_counter_ns()
                )

                cp = v2.run(
                    [
                        cast,
                        "send",
                        direct,
                        v2.CAST_SIG,
                        *fixture[
                            "castArgs"
                        ],
                        "--private-key",
                        v2.PRIVATE_KEY,
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

                receipt_path = (
                    receipts_root
                    / (
                        repetition_id
                        + ".json"
                    )
                )

                receipt_path.write_text(
                    cp.stdout,
                    encoding="utf-8",
                    newline="\n",
                )

                (
                    iteration_dir
                    / "cast-send-stderr.txt"
                ).write_text(
                    cp.stderr or "",
                    encoding="utf-8",
                    newline="\n",
                )

                if cp.returncode != 0:
                    raise RuntimeError(
                        "cast send failed: "
                        + (
                            cp.stderr
                            or ""
                        ).strip()
                    )

                (
                    ok,
                    tx_hash,
                    gas_used,
                    _,
                ) = v2.receipt_info(
                    cp.stdout
                )

                if not ok:
                    raise RuntimeError(
                        "receipt status failure"
                    )

                if not tx_hash:
                    raise RuntimeError(
                        "empty transaction hash"
                    )

                if gas_used is None:
                    raise RuntimeError(
                        "missing gasUsed"
                    )

                correctness = (
                    verify_single_vote_state(
                        v2,
                        cast,
                        rpc,
                        direct,
                        nullifier,
                        expected_tally,
                    )
                )

                row = {
                    "kind":
                        kind,
                    "iteration":
                        iteration,
                    "repetition_id":
                        repetition_id,
                    "ballot_id":
                        EXPECTED_BALLOT_ID,
                    "candidate_index":
                        EXPECTED_CANDIDATE_INDEX,
                    "tx_hash":
                        tx_hash,
                    "receipt_status":
                        1,
                    "gas_used":
                        gas_used,
                    "calldata_bytes":
                        EXPECTED_CALLDATA_BYTES,
                    "latency_ms":
                        f"{latency_ms:.6f}",
                }

                writer.writerow(
                    row
                )

                raw_file.flush()

                summary = {
                    "status":
                        "PASS",
                    "classification":
                        classification,
                    "kind":
                        kind,
                    "iteration":
                        iteration,
                    "repetitionId":
                        repetition_id,
                    "freshChain":
                        True,
                    "ballotId":
                        EXPECTED_BALLOT_ID,
                    "candidateIndex":
                        EXPECTED_CANDIDATE_INDEX,
                    "verifier":
                        verifier,
                    "direct":
                        direct,
                    "txHash":
                        tx_hash,
                    "receiptStatus":
                        1,
                    "gasUsed":
                        gas_used,
                    "calldataBytes":
                        EXPECTED_CALLDATA_BYTES,
                    "latencyMs":
                        latency_ms,
                    "correctness":
                        correctness,
                }

                (
                    iteration_dir
                    / "iteration-summary.json"
                ).write_text(
                    json.dumps(
                        summary,
                        indent=2,
                    )
                    + "\n",
                    encoding="utf-8",
                    newline="\n",
                )

            except Exception as exc:

                failure = {
                    "status":
                        "HOLD",
                    "classification":
                        classification,
                    "kind":
                        kind,
                    "iteration":
                        iteration,
                    "repetitionId":
                        repetition_id,
                    "error":
                        str(exc),
                }

                (
                    iteration_dir
                    / "FAILURE.json"
                ).write_text(
                    json.dumps(
                        failure,
                        indent=2,
                    )
                    + "\n",
                    encoding="utf-8",
                    newline="\n",
                )

                raise

            finally:

                if rpc is not None:

                    try:
                        v2.stop_anvil(
                            process,
                            cast,
                            rpc,
                        )
                    finally:
                        if (
                            log_handle
                            is not None
                        ):
                            log_handle.close()

    complete = {
        "status":
            "PASS",
        "classification":
            classification,
        "freshChainPerIteration":
            True,
        "ballotId":
            EXPECTED_BALLOT_ID,
        "candidateIndex":
            EXPECTED_CANDIDATE_INDEX,
        "warmupIterations":
            sum(
                1
                for x in plan
                if x["kind"]
                == "warmup"
            ),
        "measuredIterations":
            sum(
                1
                for x in plan
                if x["kind"]
                == "measured"
            ),
        "totalIterations":
            len(plan),
        "timedInterval":
            (
                "cast-send-start-to-"
                "receipt-return"
            ),
        "setupInsideTimedInterval":
            False,
        "postReceiptChecksInsideTimedInterval":
            False,
    }

    (
        output
        / "microbenchmark-complete.json"
    ).write_text(
        json.dumps(
            complete,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
        newline="\n",
    )


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--root",
        required=True,
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
        "--pilot-one",
        action="store_true",
    )

    parser.add_argument(
        "--execute-final-microbenchmark",
        action="store_true",
    )

    parser.add_argument(
        "--output",
    )

    parser.add_argument(
        "--port",
        type=int,
        default=8558,
    )

    args = parser.parse_args()

    root = Path(
        args.root
    ).resolve()

    bundle = Path(
        args.bundle
    ).resolve()

    modes = sum([
        bool(
            args.validate_only
        ),
        bool(
            args.pilot_one
        ),
        bool(
            args.execute_final_microbenchmark
        ),
    ])

    if modes != 1:
        raise RuntimeError(
            "select exactly one execution mode"
        )

    (
        _v2,
        resolved,
    ) = validate_inputs(
        root,
        bundle,
    )

    print(
        "FROZEN_INPUT_VALIDATION=PASS"
    )

    print(
        "MICROBENCHMARK_FIXTURE=ballot-001"
    )

    print(
        "MICROBENCHMARK_CANDIDATE_INDEX=0"
    )

    print(
        "MICROBENCHMARK_CALLDATA_BYTES=2340"
    )

    print(
        "MICROBENCHMARK_NULLIFIER="
        + str(
            resolved[
                "nullifier"
            ]
        )
    )

    print(
        "WARMUP_ITERATIONS=5"
    )

    print(
        "MEASURED_ITERATIONS=20"
    )

    print(
        "TOTAL_FINAL_ITERATIONS=25"
    )

    print(
        "FRESH_CHAIN_PER_ITERATION=YES"
    )

    print(
        "TIMED_INTERVAL="
        "CAST_SEND_START_TO_RECEIPT_RETURN"
    )

    print(
        "SETUP_INSIDE_TIMED_INTERVAL=NO"
    )

    print(
        "POST_RECEIPT_CHECKS_INSIDE_TIMED_INTERVAL=NO"
    )

    if args.validate_only:

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

    if not args.output:
        raise RuntimeError(
            "--output is required "
            "for execution modes"
        )

    output = Path(
        args.output
    ).resolve()

    if args.pilot_one:

        pilot_plan = [{
            "kind":
                "pilot",
            "iteration":
                1,
            "repetitionId":
                "pilot-01",
        }]

        execute_plan(
            root,
            bundle,
            output,
            args.port,
            pilot_plan,
            (
                "PILOT_ONLY_"
                "NOT_FINAL_BENCHMARK"
            ),
        )

        print(
            "PILOT_ITERATIONS=1"
        )

        print(
            "PILOT_ONLY_NOT_FINAL_BENCHMARK=YES"
        )

        print(
            "MICROBENCHMARK_PILOT=PASS"
        )

        return

    plan = final_plan()

    execute_plan(
        root,
        bundle,
        output,
        args.port,
        plan,
        (
            "FINAL_FROZEN_"
            "FRESH_CHAIN_MICROBENCHMARK"
        ),
    )

    print(
        "FINAL_WARMUP_ITERATIONS=5"
    )

    print(
        "FINAL_MEASURED_ITERATIONS=20"
    )

    print(
        "FINAL_TOTAL_ITERATIONS=25"
    )

    print(
        "FINAL_MICROBENCHMARK_EXECUTION=PASS"
    )


if __name__ == "__main__":
    main()
