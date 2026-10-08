#!/usr/bin/env python3

import argparse
import csv
import hashlib
import json
import math
import os
import shutil
import subprocess
import sys
from collections import Counter
from pathlib import Path


EXPECTED_PLAN_HEADER = [
    "sequence",
    "kind",
    "round",
    "execution_order_position",
    "candidate_count",
    "repetition_id",
    "output_relative",
]


INDEX_HEADER = [
    "sequence",
    "kind",
    "round",
    "execution_order_position",
    "candidate_count",
    "repetition_id",
    "status",
    "gas_used",
    "calldata_bytes",
    "calldata_zero_bytes",
    "calldata_nonzero_bytes",
    "latency_ms",
    "tx_hash",
    "summary_sha256",
    "receipt_sha256",
    "stats_eligible",
]


def sha256(path):

    h = hashlib.sha256()

    with open(
        path,
        "rb",
    ) as f:

        while True:

            block = f.read(
                1024 * 1024
            )

            if not block:
                break

            h.update(
                block
            )

    return h.hexdigest()


def write_json(path, obj):

    Path(path).write_text(
        json.dumps(
            obj,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
        newline="\n",
    )


def run_command(
    command,
):

    return subprocess.run(
        [
            str(item)
            for item in command
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )


def require_port_free(
    cast,
    rpc,
):

    cp = run_command(
        [
            cast,
            "block-number",
            "--rpc-url",
            rpc,
        ]
    )

    if cp.returncode == 0:

        raise RuntimeError(
            "Anvil/RPC unexpectedly reachable at "
            + rpc
        )


def load_plan(path):

    with open(
        path,
        encoding="utf-8",
        newline="",
    ) as f:

        reader = csv.DictReader(
            f,
            delimiter="\t",
        )

        rows = list(
            reader
        )


        if reader.fieldnames != EXPECTED_PLAN_HEADER:

            raise RuntimeError(
                "Campaign-plan header mismatch: "
                + repr(
                    reader.fieldnames
                )
            )


    if len(rows) != 100:

        raise RuntimeError(
            f"Campaign plan rows {len(rows)} != 100"
        )


    levels = [
        2,
        4,
        8,
        16,
    ]


    for index, row in enumerate(
        rows,
        start=1,
    ):

        if int(
            row[
                "sequence"
            ]
        ) != index:

            raise RuntimeError(
                f"Plan sequence mismatch at row {index}"
            )


        if row[
            "kind"
        ] not in {
            "warmup",
            "measured",
        }:

            raise RuntimeError(
                f"Unexpected plan kind at row {index}"
            )


        if int(
            row[
                "candidate_count"
            ]
        ) not in levels:

            raise RuntimeError(
                f"Unexpected candidateCount at row {index}"
            )


        if int(
            row[
                "execution_order_position"
            ]
        ) not in [
            1,
            2,
            3,
            4,
        ]:

            raise RuntimeError(
                f"Unexpected execution position at row {index}"
            )


    if sum(
        row[
            "kind"
        ] == "warmup"
        for row in rows
    ) != 20:

        raise RuntimeError(
            "Plan warmup count != 20"
        )


    if sum(
        row[
            "kind"
        ] == "measured"
        for row in rows
    ) != 80:

        raise RuntimeError(
            "Plan measured count != 80"
        )


    for level in levels:

        if sum(
            row[
                "kind"
            ] == "warmup"
            and
            int(
                row[
                    "candidate_count"
                ]
            )
            ==
            level
            for row in rows
        ) != 5:

            raise RuntimeError(
                f"K{level} plan warmup count != 5"
            )


        if sum(
            row[
                "kind"
            ] == "measured"
            and
            int(
                row[
                    "candidate_count"
                ]
            )
            ==
            level
            for row in rows
        ) != 20:

            raise RuntimeError(
                f"K{level} plan measured count != 20"
            )


    return rows


def validate_summary(
    obj,
    plan_row,
):

    k = int(
        plan_row[
            "candidate_count"
        ]
    )

    round_number = int(
        plan_row[
            "round"
        ]
    )

    order_position = int(
        plan_row[
            "execution_order_position"
        ]
    )

    kind = plan_row[
        "kind"
    ]

    repetition_id = plan_row[
        "repetition_id"
    ]


    correctness = obj.get(
        "correctness",
        {}
    )


    checks = {
        "status":
            obj.get(
                "status"
            )
            ==
            "PASS",

        "freshChain":
            obj.get(
                "freshChain"
            )
            is True,

        "candidateCount":
            int(
                obj.get(
                    "candidateCount",
                    -1,
                )
            )
            ==
            k,

        "kind":
            obj.get(
                "kind"
            )
            ==
            kind,

        "round":
            int(
                obj.get(
                    "round",
                    -1,
                )
            )
            ==
            round_number,

        "orderPosition":
            int(
                obj.get(
                    "orderPosition",
                    -1,
                )
            )
            ==
            order_position,

        "repetitionId":
            obj.get(
                "repetitionId"
            )
            ==
            repetition_id,

        "receiptStatus":
            int(
                obj.get(
                    "receiptStatus",
                    -1,
                )
            )
            ==
            1,

        "gasPositive":
            int(
                obj.get(
                    "gasUsed",
                    0,
                )
            )
            >
            0,

        "calldataBytes":
            int(
                obj.get(
                    "calldataBytes",
                    -1,
                )
            )
            ==
            2340,

        "calldataPartition":
            (
                int(
                    obj.get(
                        "calldataZeroBytes",
                        -1,
                    )
                )
                +
                int(
                    obj.get(
                        "calldataNonzeroBytes",
                        -1,
                    )
                )
            )
            ==
            2340,

        "latencyPositive":
            (
                math.isfinite(
                    float(
                        obj.get(
                            "latencyMs",
                            0,
                        )
                    )
                )
                and
                float(
                    obj.get(
                        "latencyMs",
                        0,
                    )
                )
                >
                0
            ),

        "txHash":
            (
                isinstance(
                    obj.get(
                        "txHash"
                    ),
                    str,
                )
                and
                obj[
                    "txHash"
                ].startswith(
                    "0x"
                )
                and
                len(
                    obj[
                        "txHash"
                    ]
                )
                ==
                66
            ),

        "configuredBefore":
            correctness.get(
                "configuredBeforeCast"
            )
            is True,

        "configuredAfter":
            correctness.get(
                "configuredAfterCast"
            )
            is True,

        "configurationBefore":
            correctness.get(
                "configurationExactBeforeCast"
            )
            is True,

        "configurationAfter":
            correctness.get(
                "configurationExactAfterCast"
            )
            is True,

        "acceptedCount":
            int(
                correctness.get(
                    "acceptedBallotCount",
                    -1,
                )
            )
            ==
            1,

        "usedNullifier":
            correctness.get(
                "usedNullifier"
            )
            is True,

        "phaseActive":
            int(
                correctness.get(
                    "phase",
                    -1,
                )
            )
            ==
            1,

        "tallySlots":
            int(
                correctness.get(
                    "tallySlotsChecked",
                    -1,
                )
            )
            ==
            16,

        "tallyMatch":
            correctness.get(
                "encryptedTallyMatch"
            )
            is True,

        "proofNotGenerated":
            obj.get(
                "proofGeneratedDuringObservation"
            )
            is False,

        "noSilentRetry":
            obj.get(
                "silentRetryPerformed"
            )
            is False,

        "anvilStopped":
            obj.get(
                "anvilStoppedBeforePassReceipt"
            )
            is True,
    }


    failed = [
        key
        for key, value in checks.items()
        if not value
    ]


    if failed:

        raise RuntimeError(
            "Observation summary validation failed: "
            + ",".join(
                failed
            )
        )


def fsync_text_writer(handle):

    handle.flush()

    os.fsync(
        handle.fileno()
    )


def main():

    parser = argparse.ArgumentParser()


    parser.add_argument(
        "--root",
        required=True,
    )


    parser.add_argument(
        "--campaign-dir",
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


    campaign_dir = Path(
        args.campaign_dir
    ).resolve()


    if campaign_dir.exists():

        raise RuntimeError(
            "Campaign directory already exists; "
            "automatic resume/retry is forbidden: "
            + str(
                campaign_dir
            )
        )


    this_dir = Path(
        __file__
    ).resolve().parent


    plan_path = (
        this_dir
        / "C8C_R7D_FINAL_CAMPAIGN_PLAN.tsv"
    )


    config_path = (
        this_dir
        / "C8C_R7D_ORCHESTRATOR_CONFIG.json"
    )


    config = json.loads(
        config_path.read_text(
            encoding="utf-8"
        )
    )


    if config.get(
        "status"
    ) != "PASS":

        raise RuntimeError(
            "Orchestrator config is not PASS"
        )


    if sha256(
        plan_path
    ) != config[
        "planSha256"
    ]:

        raise RuntimeError(
            "Frozen campaign-plan hash mismatch"
        )


    runner = (
        root
        / config[
            "observationRunnerRelativePath"
        ]
    )


    if sha256(
        runner
    ) != config[
        "observationRunnerSha256"
    ]:

        raise RuntimeError(
            "Frozen observation-runner hash mismatch"
        )


    active_sol = (
        root
        / "contracts/wp4-foundry/src/VoteChainWP4.sol"
    )


    active_verifier = (
        root
        / (
            "contracts/wp4-foundry/src/verifiers/"
            "VoteChainVoteDirectVerifier.sol"
        )
    )


    if sha256(
        active_sol
    ) != config[
        "activeSoliditySha256"
    ]:

        raise RuntimeError(
            "Active Solidity hash mismatch"
        )


    if sha256(
        active_verifier
    ) != config[
        "activeVerifierSha256"
    ]:

        raise RuntimeError(
            "Active verifier hash mismatch"
        )


    rows = load_plan(
        plan_path
    )


    cast = shutil.which(
        "cast"
    )


    if not cast:

        raise RuntimeError(
            "cast executable not found"
        )


    rpc = (
        "http://127.0.0.1:"
        + str(
            args.port
        )
    )


    require_port_free(
        cast,
        rpc,
    )


    campaign_dir.mkdir(
        parents=True,
        exist_ok=False,
    )


    observations_dir = (
        campaign_dir
        / "observations"
    )


    observations_dir.mkdir()


    index_path = (
        campaign_dir
        / "campaign-index.tsv"
    )


    hold_path = (
        campaign_dir
        / "CAMPAIGN_HOLD.json"
    )


    completion_path = (
        campaign_dir
        / "CAMPAIGN_COMPLETION.json"
    )


    with open(
        index_path,
        "w",
        encoding="utf-8",
        newline="",
    ) as index_file:

        writer = csv.writer(
            index_file,
            delimiter="\t",
            lineterminator="\n",
        )


        writer.writerow(
            INDEX_HEADER
        )


        fsync_text_writer(
            index_file
        )


        for plan_row in rows:

            sequence = int(
                plan_row[
                    "sequence"
                ]
            )

            kind = plan_row[
                "kind"
            ]

            round_number = int(
                plan_row[
                    "round"
                ]
            )

            order_position = int(
                plan_row[
                    "execution_order_position"
                ]
            )

            k = int(
                plan_row[
                    "candidate_count"
                ]
            )

            repetition_id = plan_row[
                "repetition_id"
            ]

            relative = plan_row[
                "output_relative"
            ]


            if sha256(
                runner
            ) != config[
                "observationRunnerSha256"
            ]:

                raise RuntimeError(
                    f"Runner hash changed before observation {sequence}"
                )


            require_port_free(
                cast,
                rpc,
            )


            output_dir = (
                observations_dir
                / relative
            )


            command = [
                sys.executable,
                str(
                    runner
                ),
                "--root",
                str(
                    root
                ),
                "--candidate-count",
                str(
                    k
                ),
                "--kind",
                kind,
                "--round",
                str(
                    round_number
                ),
                "--order-position",
                str(
                    order_position
                ),
                "--repetition-id",
                repetition_id,
                "--output-dir",
                str(
                    output_dir
                ),
                "--port",
                str(
                    args.port
                ),
            ]


            print(
                "START "
                f"{sequence:03d}/100 "
                f"{repetition_id}",
                flush=True,
            )


            cp = run_command(
                command
            )


            if output_dir.exists():

                (
                    output_dir
                    / "orchestrator-runner.stdout.txt"
                ).write_text(
                    cp.stdout,
                    encoding="utf-8",
                    newline="\n",
                )

                (
                    output_dir
                    / "orchestrator-runner.stderr.txt"
                ).write_text(
                    cp.stderr,
                    encoding="utf-8",
                    newline="\n",
                )


            if cp.returncode != 0:

                write_json(
                    hold_path,
                    {
                        "status":
                            "PARTIAL_HOLD",

                        "failedSequence":
                            sequence,

                        "failedPlanRow":
                            plan_row,

                        "runnerReturnCode":
                            cp.returncode,

                        "successfulRowsBeforeFailure":
                            sequence - 1,

                        "silentRetryPerformed":
                            False,

                        "automaticResumeAllowed":
                            False,
                    },
                )


                print(
                    "CAMPAIGN_STATUS=PARTIAL_HOLD",
                    flush=True,
                )

                print(
                    "FAILED_SEQUENCE="
                    + str(
                        sequence
                    ),
                    flush=True,
                )


                return 1


            summary_path = (
                output_dir
                / "iteration-summary.json"
            )


            receipt_path = (
                output_dir
                / "receipt.json"
            )


            failure_path = (
                output_dir
                / "failure.json"
            )


            if not summary_path.is_file():

                raise RuntimeError(
                    f"Observation {sequence}: "
                    "iteration-summary.json missing"
                )


            if not receipt_path.is_file():

                raise RuntimeError(
                    f"Observation {sequence}: "
                    "receipt.json missing"
                )


            if failure_path.exists():

                raise RuntimeError(
                    f"Observation {sequence}: "
                    "unexpected failure.json"
                )


            summary = json.loads(
                summary_path.read_text(
                    encoding="utf-8"
                )
            )


            validate_summary(
                summary,
                plan_row,
            )


            require_port_free(
                cast,
                rpc,
            )


            gas_used = int(
                summary[
                    "gasUsed"
                ]
            )


            calldata_bytes = int(
                summary[
                    "calldataBytes"
                ]
            )


            zero_bytes = int(
                summary[
                    "calldataZeroBytes"
                ]
            )


            nonzero_bytes = int(
                summary[
                    "calldataNonzeroBytes"
                ]
            )


            latency_ms = float(
                summary[
                    "latencyMs"
                ]
            )


            tx_hash = summary[
                "txHash"
            ]


            stats_eligible = (
                "YES"
                if kind == "measured"
                else "NO"
            )


            writer.writerow([
                sequence,
                kind,
                round_number,
                order_position,
                k,
                repetition_id,
                "PASS",
                gas_used,
                calldata_bytes,
                zero_bytes,
                nonzero_bytes,
                f"{latency_ms:.6f}",
                tx_hash,
                sha256(
                    summary_path
                ),
                sha256(
                    receipt_path
                ),
                stats_eligible,
            ])


            fsync_text_writer(
                index_file
            )


            print(
                "PASS "
                f"{sequence:03d}/100 "
                f"{repetition_id} "
                f"gas={gas_used} "
                f"latency_ms={latency_ms:.6f}",
                flush=True,
            )


    with open(
        index_path,
        encoding="utf-8",
        newline="",
    ) as f:

        completed_rows = list(
            csv.DictReader(
                f,
                delimiter="\t",
            )
        )


    if len(
        completed_rows
    ) != 100:

        raise RuntimeError(
            "Final campaign index row count != 100"
        )


    if any(
        row[
            "status"
        ] != "PASS"
        for row in completed_rows
    ):

        raise RuntimeError(
            "Final campaign contains non-PASS row"
        )


    if sum(
        row[
            "kind"
        ] == "warmup"
        for row in completed_rows
    ) != 20:

        raise RuntimeError(
            "Completed warmup count != 20"
        )


    if sum(
        row[
            "kind"
        ] == "measured"
        for row in completed_rows
    ) != 80:

        raise RuntimeError(
            "Completed measured count != 80"
        )


    if sum(
        row[
            "stats_eligible"
        ] == "YES"
        for row in completed_rows
    ) != 80:

        raise RuntimeError(
            "Stats-eligible row count != 80"
        )


    per_level_measured = Counter(
        int(
            row[
                "candidate_count"
            ]
        )
        for row in completed_rows
        if row[
            "kind"
        ] == "measured"
    )


    per_level_warmup = Counter(
        int(
            row[
                "candidate_count"
            ]
        )
        for row in completed_rows
        if row[
            "kind"
        ] == "warmup"
    )


    for level in [
        2,
        4,
        8,
        16,
    ]:

        if per_level_measured[
            level
        ] != 20:

            raise RuntimeError(
                f"K{level} completed measured count != 20"
            )


        if per_level_warmup[
            level
        ] != 5:

            raise RuntimeError(
                f"K{level} completed warmup count != 5"
            )


    require_port_free(
        cast,
        rpc,
    )


    completion = {
        "status":
            "PASS",

        "classification":
            "C8C_FINAL_100_OBSERVATION_CAMPAIGN",

        "totalObservations":
            100,

        "warmupObservations":
            20,

        "measuredObservations":
            80,

        "statsEligibleObservations":
            80,

        "runtimeLevels":
            [
                2,
                4,
                8,
                16,
            ],

        "measuredPerLevel": {
            str(level):
                per_level_measured[
                    level
                ]
            for level in [
                2,
                4,
                8,
                16,
            ]
        },

        "warmupPerLevel": {
            str(level):
                per_level_warmup[
                    level
                ]
            for level in [
                2,
                4,
                8,
                16,
            ]
        },

        "campaignIndexSha256":
            sha256(
                index_path
            ),

        "silentRetryPerformed":
            False,

        "pilotObservationsIncluded":
            False,

        "warmupsIncludedInFinalStatistics":
            False,

        "proofGenerationDuringCampaign":
            False,

        "anvilRunningAfterCampaign":
            False,
    }


    write_json(
        completion_path,
        completion,
    )


    print(
        "CAMPAIGN_STATUS=PASS",
        flush=True,
    )

    print(
        "TOTAL_OBSERVATIONS=100",
        flush=True,
    )

    print(
        "WARMUP_OBSERVATIONS=20",
        flush=True,
    )

    print(
        "MEASURED_OBSERVATIONS=80",
        flush=True,
    )

    print(
        "STATS_ELIGIBLE_OBSERVATIONS=80",
        flush=True,
    )

    print(
        "SILENT_RETRY_PERFORMED=NO",
        flush=True,
    )

    print(
        "PILOTS_INCLUDED=NO",
        flush=True,
    )

    print(
        "WARMUPS_INCLUDED_IN_FINAL_STATS=NO",
        flush=True,
    )


    return 0


if __name__ == "__main__":

    raise SystemExit(
        main()
    )
