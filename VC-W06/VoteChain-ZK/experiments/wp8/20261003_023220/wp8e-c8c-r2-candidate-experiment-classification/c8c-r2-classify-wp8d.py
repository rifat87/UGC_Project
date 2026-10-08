import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path


wp8d = Path(sys.argv[1])
out = Path(sys.argv[2])

paths = {
    "plan":
        wp8d / "final-plan.tsv",
    "artifactMap":
        wp8d / "artifact-map.tsv",
    "raw":
        wp8d / "wp8d-d-raw.csv",
    "cell":
        wp8d / "wp8d-d-cell-summary.csv",
    "profile":
        wp8d / "wp8d-d-profile-summary.csv",
}


for label, path in paths.items():

    if not path.is_file():
        raise RuntimeError(
            f"{label} missing: {path}"
        )


def read_table(path):

    text = path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    delimiter = (
        "\t"
        if path.suffix.lower() == ".tsv"
        else ","
    )

    reader = csv.DictReader(
        text.splitlines(),
        delimiter=delimiter,
    )

    rows = list(reader)

    return (
        reader.fieldnames or [],
        rows,
        text,
    )


tables = {}

for label, path in paths.items():

    fields, rows, text = read_table(
        path
    )

    tables[label] = {
        "fields":
            fields,
        "rows":
            rows,
        "text":
            text,
    }


profile_re = re.compile(
    r"direct[-_]?k(2|4|8|16)[-_]?d17",
    re.I,
)


def profile_hits(text):

    return sorted(
        set(
            int(x)
            for x in profile_re.findall(
                text
            )
        )
    )


hits = {
    label:
        profile_hits(
            data["text"]
        )
    for label, data in tables.items()
}


def matching_rows(data):

    result = {
        2: [],
        4: [],
        8: [],
        16: [],
    }

    for row in data["rows"]:

        packed = " | ".join(
            str(v)
            for v in row.values()
        )

        m = profile_re.search(
            packed
        )

        if m:
            result[
                int(
                    m.group(1)
                )
            ].append(
                row
            )

    return result


raw_matches = matching_rows(
    tables["raw"]
)

plan_matches = matching_rows(
    tables["plan"]
)

profile_matches = matching_rows(
    tables["profile"]
)

cell_matches = matching_rows(
    tables["cell"]
)


all_levels = [
    2,
    4,
    8,
    16,
]


plan_complete = all(
    plan_matches[k]
    for k in all_levels
)

raw_complete = all(
    raw_matches[k]
    for k in all_levels
)

profile_complete = all(
    profile_matches[k]
    for k in all_levels
)

cell_complete = all(
    cell_matches[k]
    for k in all_levels
)


all_fields = sorted(
    set(
        field
        for data in tables.values()
        for field in data["fields"]
        if field
    )
)


field_text = " ".join(
    all_fields
).lower()


crypto_tokens = [
    "proof",
    "proving",
    "witness",
    "verify",
    "verification",
    "r1cs",
    "constraint",
    "wasm",
    "zkey",
]


onchain_tokens = [
    "gas",
    "tx",
    "transaction",
    "receipt",
    "calldata",
    "rpc",
    "block",
]


crypto_metric_fields = [
    f
    for f in all_fields
    if any(
        token in f.lower()
        for token in crypto_tokens
    )
]


onchain_metric_fields = [
    f
    for f in all_fields
    if any(
        token in f.lower()
        for token in onchain_tokens
    )
]


# Also inspect raw textual content because some metric names may
# appear in values rather than headers.

all_text = "\n".join(
    data["text"]
    for data in tables.values()
).lower()


has_crypto_terms = any(
    token in all_text
    for token in [
        "proof",
        "proving",
        "witness",
        "verification",
        "verify",
        "r1cs",
    ]
)


has_onchain_terms = any(
    token in all_text
    for token in [
        "gas_used",
        "gas used",
        "receipt_status",
        "tx_hash",
        "calldata_bytes",
        "cast send",
    ]
)


if (
    plan_complete
    and raw_complete
    and has_crypto_terms
    and not has_onchain_terms
):
    classification = (
        "COMPILE_TIME_CIRCUIT_PROFILE_SCALING"
    )

elif (
    plan_complete
    and raw_complete
    and has_onchain_terms
):
    classification = (
        "CONTAINS_ONCHAIN_MEASUREMENT"
    )

else:
    classification = (
        "REQUIRES_MANUAL_REVIEW"
    )


raw_counts = {
    str(k):
        len(
            raw_matches[k]
        )
    for k in all_levels
}


report = {
    "status":
        "PASS",
    "wp8dFinalCampaign":
        wp8d.as_posix(),
    "tableHeaders": {
        label:
            data["fields"]
        for label, data in tables.items()
    },
    "rowCounts": {
        label:
            len(
                data["rows"]
            )
        for label, data in tables.items()
    },
    "directD17LevelsByArtifact":
        hits,
    "directD17RawRowsPerK":
        raw_counts,
    "directD17PlanComplete":
        plan_complete,
    "directD17RawComplete":
        raw_complete,
    "directD17ProfileSummaryComplete":
        profile_complete,
    "directD17CellSummaryComplete":
        cell_complete,
    "allTableFields":
        all_fields,
    "cryptoMetricFields":
        crypto_metric_fields,
    "onchainMetricFields":
        onchain_metric_fields,
    "hasCryptoScalingTerms":
        has_crypto_terms,
    "hasOnchainVoteMeasurementTerms":
        has_onchain_terms,
    "classification":
        classification,
}


out.write_text(
    json.dumps(
        report,
        indent=2,
    )
    + "\n",
    encoding="utf-8",
    newline="\n",
)


print(
    "WP8D_FINAL_PLAN_ROWS="
    + str(
        len(
            tables[
                "plan"
            ][
                "rows"
            ]
        )
    )
)

print(
    "WP8D_FINAL_RAW_ROWS="
    + str(
        len(
            tables[
                "raw"
            ][
                "rows"
            ]
        )
    )
)

print(
    "WP8D_FINAL_CELL_SUMMARY_ROWS="
    + str(
        len(
            tables[
                "cell"
            ][
                "rows"
            ]
        )
    )
)

print(
    "WP8D_FINAL_PROFILE_SUMMARY_ROWS="
    + str(
        len(
            tables[
                "profile"
            ][
                "rows"
            ]
        )
    )
)

print(
    "WP8D_ALL_TABLE_FIELDS="
    + ",".join(
        all_fields
    )
)

print(
    "WP8D_CRYPTO_METRIC_FIELDS="
    + (
        ",".join(
            crypto_metric_fields
        )
        if crypto_metric_fields
        else "NONE"
    )
)

print(
    "WP8D_ONCHAIN_METRIC_FIELDS="
    + (
        ",".join(
            onchain_metric_fields
        )
        if onchain_metric_fields
        else "NONE"
    )
)

for k in all_levels:

    print(
        f"WP8D_DIRECT_K{k}_D17_PLAN_ROWS="
        + str(
            len(
                plan_matches[k]
            )
        )
    )

    print(
        f"WP8D_DIRECT_K{k}_D17_RAW_ROWS="
        + str(
            len(
                raw_matches[k]
            )
        )
    )

    print(
        f"WP8D_DIRECT_K{k}_D17_PROFILE_SUMMARY_ROWS="
        + str(
            len(
                profile_matches[k]
            )
        )
    )

    print(
        f"WP8D_DIRECT_K{k}_D17_CELL_SUMMARY_ROWS="
        + str(
            len(
                cell_matches[k]
            )
        )
    )


print(
    "WP8D_DIRECT_D17_PLAN_COMPLETE="
    + (
        "YES"
        if plan_complete
        else "NO"
    )
)

print(
    "WP8D_DIRECT_D17_RAW_COMPLETE="
    + (
        "YES"
        if raw_complete
        else "NO"
    )
)

print(
    "WP8D_DIRECT_D17_PROFILE_SUMMARY_COMPLETE="
    + (
        "YES"
        if profile_complete
        else "NO"
    )
)

print(
    "WP8D_DIRECT_D17_CELL_SUMMARY_COMPLETE="
    + (
        "YES"
        if cell_complete
        else "NO"
    )
)

print(
    "WP8D_HAS_CRYPTO_SCALING_TERMS="
    + (
        "YES"
        if has_crypto_terms
        else "NO"
    )
)

print(
    "WP8D_HAS_ONCHAIN_VOTE_MEASUREMENT_TERMS="
    + (
        "YES"
        if has_onchain_terms
        else "NO"
    )
)

print(
    "WP8D_EXPERIMENT_CLASSIFICATION="
    + classification
)

print(
    "WP8D_CLASSIFIER=PASS"
)
