import csv
import importlib.util
import json
import re
import sys
from collections import Counter
from pathlib import Path

campaign = Path(sys.argv[1])
v2_path = Path(sys.argv[2])
out_path = Path(sys.argv[3])

spec = (
    importlib.util
    .spec_from_file_location(
        "frozen_v2",
        v2_path,
    )
)

if (
    spec is None
    or spec.loader is None
):
    raise RuntimeError(
        "cannot import frozen V2"
    )

v2 = (
    importlib.util
    .module_from_spec(
        spec
    )
)

spec.loader.exec_module(
    v2
)

if not hasattr(
    v2,
    "extract_address",
):
    raise RuntimeError(
        "V2 extract_address missing"
    )


address_re = re.compile(
    r"0x[a-fA-F0-9]{40}"
)

decoder = json.JSONDecoder()


def inspect_deploy(path):

    text = path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    stripped = text.lstrip()

    result = {
        "path":
            path.as_posix(),
        "bytes":
            len(
                text.encode(
                    "utf-8",
                    errors="replace",
                )
            ),
        "fullJsonOk":
            False,
        "leadingJsonOk":
            False,
        "leadingJsonType":
            None,
        "leadingJsonKeys":
            [],
        "deployer":
            None,
        "deployedTo":
            None,
        "transactionHash":
            None,
        "trailingBytes":
            0,
        "trailingText":
            "",
        "regexAddresses":
            address_re.findall(
                text
            ),
        "v2ExtractedAddress":
            None,
        "v2ExtractError":
            None,
    }

    try:
        full = json.loads(
            text
        )

        result[
            "fullJsonOk"
        ] = True

    except Exception:
        full = None

    try:
        obj, end = (
            decoder.raw_decode(
                stripped
            )
        )

        result[
            "leadingJsonOk"
        ] = True

        result[
            "leadingJsonType"
        ] = type(
            obj
        ).__name__

        if isinstance(
            obj,
            dict,
        ):
            result[
                "leadingJsonKeys"
            ] = sorted(
                obj.keys()
            )

            result[
                "deployer"
            ] = obj.get(
                "deployer"
            )

            result[
                "deployedTo"
            ] = (
                obj.get(
                    "deployedTo"
                )
                or obj.get(
                    "contractAddress"
                )
                or obj.get(
                    "address"
                )
            )

            result[
                "transactionHash"
            ] = (
                obj.get(
                    "transactionHash"
                )
                or obj.get(
                    "transaction_hash"
                )
            )

        trailing = stripped[
            end:
        ]

        result[
            "trailingBytes"
        ] = len(
            trailing.encode(
                "utf-8",
                errors="replace",
            )
        )

        result[
            "trailingText"
        ] = trailing[
            :1200
        ]

    except Exception as exc:

        result[
            "leadingJsonError"
        ] = repr(exc)

    try:
        result[
            "v2ExtractedAddress"
        ] = v2.extract_address(
            text
        )

    except Exception as exc:
        result[
            "v2ExtractError"
        ] = repr(exc)

    return result


iteration_root = (
    campaign
    / "iterations"
)

direct_results = []

verifier_results = []


for path in sorted(
    iteration_root.glob(
        "*/direct-deploy.json"
    )
):
    x = inspect_deploy(
        path
    )

    x["repetitionId"] = (
        path.parent.name
    )

    direct_results.append(
        x
    )


for path in sorted(
    iteration_root.glob(
        "*/verifier-deploy.json"
    )
):
    x = inspect_deploy(
        path
    )

    x["repetitionId"] = (
        path.parent.name
    )

    verifier_results.append(
        x
    )


target_direct = next(
    (
        x
        for x in direct_results
        if x["repetitionId"]
        == "measured-12"
    ),
    None,
)


target_verifier = next(
    (
        x
        for x in verifier_results
        if x["repetitionId"]
        == "measured-12"
    ),
    None,
)


if target_direct is None:
    raise RuntimeError(
        "measured-12 direct deployment "
        "artifact missing"
    )


direct_deployed_to = [
    str(
        x["deployedTo"]
    ).lower()
    for x in direct_results
    if x[
        "deployedTo"
    ]
]


mode_direct = None

if direct_deployed_to:

    mode_direct = (
        Counter(
            direct_deployed_to
        )
        .most_common(1)[0][0]
    )


mismatch_results = [
    x
    for x in direct_results
    if (
        x["deployedTo"]
        and
        x["v2ExtractedAddress"]
        and
        str(
            x[
                "deployedTo"
            ]
        ).lower()
        != str(
            x[
                "v2ExtractedAddress"
            ]
        ).lower()
    )
]


trailing_direct = [
    x
    for x in direct_results
    if x[
        "trailingBytes"
    ] > 0
]


full_json_fail_direct = [
    x
    for x in direct_results
    if not x[
        "fullJsonOk"
    ]
]


failure_path = (
    iteration_root
    / "measured-12"
    / "FAILURE.json"
)

failure = json.loads(
    failure_path.read_text(
        encoding="utf-8"
    )
)


raw_path = (
    campaign
    / "raw-microbenchmark.tsv"
)

with open(
    raw_path,
    encoding="utf-8",
    newline="",
) as f:
    raw_rows = list(
        csv.DictReader(
            f,
            delimiter="\t",
        )
    )


failed_raw_rows = [
    r
    for r in raw_rows
    if r[
        "repetition_id"
    ] == "measured-12"
]


failed_receipt = (
    campaign
    / "receipts"
    / "measured-12.json"
)


failed_summary = (
    iteration_root
    / "measured-12"
    / "iteration-summary.json"
)


failed_cast_stderr = (
    iteration_root
    / "measured-12"
    / "cast-send-stderr.txt"
)


target_deployer = (
    str(
        target_direct[
            "deployer"
        ]
    ).lower()
    if target_direct[
        "deployer"
    ]
    else None
)


target_deployed_to = (
    str(
        target_direct[
            "deployedTo"
        ]
    ).lower()
    if target_direct[
        "deployedTo"
    ]
    else None
)


target_extracted = (
    str(
        target_direct[
            "v2ExtractedAddress"
        ]
    ).lower()
    if target_direct[
        "v2ExtractedAddress"
    ]
    else None
)


target_first_regex = (
    target_direct[
        "regexAddresses"
    ][0].lower()
    if target_direct[
        "regexAddresses"
    ]
    else None
)


signature = all([
    target_direct[
        "leadingJsonOk"
    ],
    not target_direct[
        "fullJsonOk"
    ],
    target_direct[
        "trailingBytes"
    ] > 0,
    target_deployer
        is not None,
    target_deployed_to
        is not None,
    target_extracted
        is not None,
    target_deployer
        != target_deployed_to,
    target_extracted
        == target_deployer,
    target_first_regex
        == target_deployer,
    (
        mode_direct is None
        or
        target_deployed_to
        == mode_direct
    ),
])


failure_before_vote = all([
    len(
        failed_raw_rows
    ) == 0,
    not failed_receipt.exists(),
    not failed_summary.exists(),
    not failed_cast_stderr.exists(),
    (
        "verifier()(address)"
        in failure.get(
            "error",
            "",
        )
    ),
])


report = {
    "status":
        "PASS",
    "classification":
        (
            "READ_ONLY_ABORTED_FINAL_"
            "MICROBENCHMARK_FORENSICS"
        ),
    "directDeployArtifactCount":
        len(
            direct_results
        ),
    "verifierDeployArtifactCount":
        len(
            verifier_results
        ),
    "directDeployFullJsonFailureCount":
        len(
            full_json_fail_direct
        ),
    "directDeployTrailingTextCount":
        len(
            trailing_direct
        ),
    "directDeployAddressMismatchCount":
        len(
            mismatch_results
        ),
    "modalDirectDeployedTo":
        mode_direct,
    "targetDirect":
        target_direct,
    "targetVerifier":
        target_verifier,
    "failedIterationRawRowCount":
        len(
            failed_raw_rows
        ),
    "failedIterationVoteReceiptExists":
        failed_receipt.exists(),
    "failedIterationSummaryExists":
        failed_summary.exists(),
    "failedIterationCastSendStderrExists":
        failed_cast_stderr.exists(),
    "failureOccurredBeforeVoteSend":
        failure_before_vote,
    "deployAddressParserMisselectionSignature":
        signature,
    "rootCauseClassification":
        (
            "DEPLOY_STDOUT_TRAILING_DIAGNOSTIC_"
            "CAUSED_ADDRESS_FALLBACK_TO_DEPLOYER"
            if signature
            else
            "NOT_YET_PROVEN"
        ),
    "abortedCampaignEligibleForFinalStatistics":
        False,
    "latencyReconstructionAllowed":
        False,
}


out_path.write_text(
    json.dumps(
        report,
        indent=2,
    )
    + "\n",
    encoding="utf-8",
    newline="\n",
)


print(
    "DIRECT_DEPLOY_ARTIFACTS="
    + str(
        len(
            direct_results
        )
    )
)

print(
    "VERIFIER_DEPLOY_ARTIFACTS="
    + str(
        len(
            verifier_results
        )
    )
)

print(
    "DIRECT_DEPLOY_FULL_JSON_FAILURES="
    + str(
        len(
            full_json_fail_direct
        )
    )
)

print(
    "DIRECT_DEPLOY_TRAILING_TEXT_FILES="
    + str(
        len(
            trailing_direct
        )
    )
)

print(
    "DIRECT_DEPLOY_ADDRESS_MISMATCHES="
    + str(
        len(
            mismatch_results
        )
    )
)

print(
    "MODAL_DIRECT_DEPLOYED_TO="
    + str(
        mode_direct
    )
)

print()
print(
    "=== MEASURED-12 DIRECT DEPLOY FORENSICS ==="
)

print(
    "TARGET_FULL_JSON_PARSE="
    + (
        "PASS"
        if target_direct[
            "fullJsonOk"
        ]
        else "FAIL"
    )
)

print(
    "TARGET_LEADING_JSON_PARSE="
    + (
        "PASS"
        if target_direct[
            "leadingJsonOk"
        ]
        else "FAIL"
    )
)

print(
    "TARGET_LEADING_JSON_KEYS="
    + ",".join(
        target_direct[
            "leadingJsonKeys"
        ]
    )
)

print(
    "TARGET_JSON_DEPLOYER="
    + str(
        target_direct[
            "deployer"
        ]
    )
)

print(
    "TARGET_JSON_DEPLOYED_TO="
    + str(
        target_direct[
            "deployedTo"
        ]
    )
)

print(
    "TARGET_JSON_TRANSACTION_HASH="
    + str(
        target_direct[
            "transactionHash"
        ]
    )
)

print(
    "TARGET_V2_EXTRACT_ADDRESS="
    + str(
        target_direct[
            "v2ExtractedAddress"
        ]
    )
)

print(
    "TARGET_FIRST_REGEX_ADDRESS="
    + str(
        (
            target_direct[
                "regexAddresses"
            ][0]
            if target_direct[
                "regexAddresses"
            ]
            else None
        )
    )
)

print(
    "TARGET_TRAILING_BYTES="
    + str(
        target_direct[
            "trailingBytes"
        ]
    )
)

print(
    "TARGET_TRAILING_TEXT_REPR="
    + repr(
        target_direct[
            "trailingText"
        ]
    )
)

print(
    "TARGET_EXTRACT_EQUALS_DEPLOYER="
    + (
        "YES"
        if (
            target_extracted
            and
            target_deployer
            and
            target_extracted
            == target_deployer
        )
        else "NO"
    )
)

print(
    "TARGET_EXTRACT_EQUALS_DEPLOYED_TO="
    + (
        "YES"
        if (
            target_extracted
            and
            target_deployed_to
            and
            target_extracted
            == target_deployed_to
        )
        else "NO"
    )
)

print(
    "TARGET_DEPLOYED_TO_MATCHES_MODAL="
    + (
        "YES"
        if (
            target_deployed_to
            and
            mode_direct
            and
            target_deployed_to
            == mode_direct
        )
        else "NO"
    )
)

print()
print(
    "=== FAILED ITERATION VOTE-SEND EVIDENCE ==="
)

print(
    "MEASURED12_RAW_ROWS="
    + str(
        len(
            failed_raw_rows
        )
    )
)

print(
    "MEASURED12_VOTE_RECEIPT_EXISTS="
    + (
        "YES"
        if failed_receipt.exists()
        else "NO"
    )
)

print(
    "MEASURED12_ITERATION_SUMMARY_EXISTS="
    + (
        "YES"
        if failed_summary.exists()
        else "NO"
    )
)

print(
    "MEASURED12_CAST_SEND_STDERR_EXISTS="
    + (
        "YES"
        if failed_cast_stderr.exists()
        else "NO"
    )
)

print(
    "FAILURE_OCCURRED_BEFORE_VOTE_SEND="
    + (
        "YES"
        if failure_before_vote
        else "NO"
    )
)

print()
print(
    "DEPLOY_ADDRESS_PARSER_MISSELECTION_SIGNATURE="
    + (
        "YES"
        if signature
        else "NO"
    )
)

print(
    "ROOT_CAUSE_CLASSIFICATION="
    + report[
        "rootCauseClassification"
    ]
)

print(
    "ABORTED_CAMPAIGN_FINAL_STATS_ELIGIBLE=NO"
)

print(
    "LATENCY_RECONSTRUCTION_ALLOWED=NO"
)

print(
    "FORENSIC_ANALYSIS=PASS"
)
