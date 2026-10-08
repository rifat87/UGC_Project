#!/usr/bin/env bash
set -euo pipefail

ROOT="$PWD"

if [ "$(basename "$ROOT")" != "VoteChain-ZK" ]; then
    echo "ERROR: run from VoteChain-ZK root."
    exit 2
fi

BACK="$ROOT/votechain-central-server"
FRONT="$ROOT/votechain-frontend-ts"

RUN_ID="$(date +%Y%m%d_%H%M%S)"
EVIDENCE="$ROOT/experiments/wp5/$RUN_ID/wp5e-backend-preflight"

OUTROOT="../VoteChain_VC-W03_FinalZK/Output/VC-W07"
CAPTURE="$OUTROOT/VC-W07_WP5E_CURRENT_BACKEND_SOURCE_CAPTURE.txt"
SUMMARY="$OUTROOT/VC-W07_WP5E_BACKEND_PREFLIGHT_SUMMARY.txt"

mkdir -p \
    "$EVIDENCE" \
    "$OUTROOT"

echo
echo "======================================================================"
echo "VOTECHAIN-ZK WP5E — BACKEND AUTHORIZATION PREFLIGHT"
echo "======================================================================"
echo "RUN_ID=$RUN_ID"
echo
echo "READ_ONLY=YES"
echo "DATABASE_ACCESS=NO"
echo "BIOMETRIC_EXECUTION=NO"
echo "SERVER_START=NO"
echo "SOURCE_MODIFICATION=NO"
echo

###############################################################################
# 1. REQUIRE WP5D PASS
###############################################################################

echo "=== 1. REQUIRE WP5D-v2 PASS ==="

WP5D_SUMMARY="$OUTROOT/VC-W07_WP5D_V2_SYNTHETIC_RUNTIME_SUMMARY.txt"

if [ ! -f "$WP5D_SUMMARY" ]; then
    echo "ERROR: WP5D-v2 summary missing."
    exit 10
fi

if ! grep -q \
    '^STATUS=PASS_WP5D_V2_SYNTHETIC_RUNTIME$' \
    "$WP5D_SUMMARY"
then
    echo "ERROR: WP5D-v2 not accepted."
    exit 11
fi

echo "WP5D_V2_ACCEPTED=PASS"

###############################################################################
# 2. REQUIRED CURRENT BACKEND FILES
###############################################################################

echo
echo "=== 2. CURRENT WP5 BACKEND FILES ==="

FILES=(
    "$BACK/routes/wp5Routes.js"
    "$BACK/controllers/wp5Controller.js"
    "$BACK/services/zk/wp5PrivacyService.js"
    "$BACK/utils/wp5Contract.js"
    "$BACK/models/Voter.js"
    "$BACK/server.js"
    "$BACK/package.json"
    "$BACK/.env.example"
    "$FRONT/src/services/api.ts"
    "$FRONT/src/components/Biometric/VerificationModal.tsx"
)

MISSING=0

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "FOUND=${file#$ROOT/}"
    else
        echo "MISSING=${file#$ROOT/}"
        MISSING=1
    fi
done

if [ "$MISSING" -ne 0 ]; then
    echo
    echo "WP5E_PREFLIGHT=BLOCKED_MISSING_SOURCE"
    exit 20
fi

###############################################################################
# 3. HASH CURRENT FILES
###############################################################################

echo
echo "=== 3. CURRENT SOURCE HASHES ==="

HASHFILE="$EVIDENCE/current-source.sha256"

sha256sum \
    "${FILES[@]}" \
    > "$HASHFILE"

cat "$HASHFILE"

###############################################################################
# 4. CAPTURE EXACT CURRENT SOURCE
###############################################################################

echo
echo "=== 4. CAPTURE CURRENT SOURCE ==="

: > "$CAPTURE"

{
    echo "======================================================================"
    echo "VOTECHAIN-ZK WP5E — CURRENT BACKEND SOURCE CAPTURE"
    echo "======================================================================"
    echo "RUN_ID=$RUN_ID"
    echo
    echo "READ_ONLY=YES"
    echo "DATABASE_ACCESS=NO"
    echo "BIOMETRIC_EXECUTION=NO"
    echo
} >> "$CAPTURE"

for file in "${FILES[@]}"; do
    {
        echo
        echo
        echo "======================================================================"
        echo "FILE: ${file#$ROOT/}"
        echo "======================================================================"
        echo
        cat "$file"
        echo
    } >> "$CAPTURE"
done

echo "SOURCE_CAPTURE=$CAPTURE"

###############################################################################
# 5. ROUTE MOUNT / ENDPOINT DISCOVERY
###############################################################################

echo
echo "=== 5. WP5 ROUTE DISCOVERY ==="

{
    echo
    echo
    echo "======================================================================"
    echo "WP5 ROUTE DISCOVERY"
    echo "======================================================================"
} >> "$CAPTURE"

grep -nE \
    'wp5|authorize|config|face|fingerprint' \
    "$BACK/server.js" \
    "$BACK/routes/wp5Routes.js" \
    "$BACK/controllers/wp5Controller.js" \
    | tee "$EVIDENCE/route-discovery.txt" \
    | tee -a "$CAPTURE"

###############################################################################
# 6. CANDIDATE-LEAK STATIC SCAN
###############################################################################

echo
echo "=== 6. CANDIDATE-LEAK STATIC SCAN ==="

AUTH_FILES=(
    "$BACK/routes/wp5Routes.js"
    "$BACK/controllers/wp5Controller.js"
    "$BACK/services/zk/wp5PrivacyService.js"
)

LEAK_SCAN="$EVIDENCE/candidate-term-scan.txt"

: > "$LEAK_SCAN"

for file in "${AUTH_FILES[@]}"; do
    echo "----- ${file#$ROOT/} -----" \
        >> "$LEAK_SCAN"

    grep -niE \
        'candidateId|candidateIndex|selectedCandidate|voteChoice|candidateChoice' \
        "$file" \
        >> "$LEAK_SCAN" \
        || true
done

cat "$LEAK_SCAN"

if [ ! -s "$LEAK_SCAN" ]; then
    echo "WP5_AUTH_SOURCE_CANDIDATE_TERMS=0"
else
    MATCH_COUNT="$(
        grep -Ei \
            'candidateId|candidateIndex|selectedCandidate|voteChoice|candidateChoice' \
            "$LEAK_SCAN" \
            | wc -l \
            | tr -d ' '
    )"

    echo "WP5_AUTH_SOURCE_CANDIDATE_TERM_MATCHES=$MATCH_COUNT"
    echo "NOTE=Matches require contextual review; public config candidate metadata is permitted."
fi

###############################################################################
# 7. AUTHORIZATION REQUEST SHAPE
###############################################################################

echo
echo "=== 7. FRONTEND AUTHORIZATION REQUEST SHAPE ==="

grep -n \
    -A45 \
    -B10 \
    'authorizeWp5' \
    "$FRONT/src/services/api.ts" \
    | tee "$EVIDENCE/frontend-authorizeWp5.txt" \
    || true

echo
echo "--- VerificationModal WP5 callsites ---"

grep -nE \
    -A12 \
    -B12 \
    'authorizeWp5|credentialPublicKey|candidateId|selectedCandidate' \
    "$FRONT/src/components/Biometric/VerificationModal.tsx" \
    | tee "$EVIDENCE/verification-modal-auth.txt" \
    || true

###############################################################################
# 8. BACKEND BODY / LOGGING DISCOVERY
###############################################################################

echo
echo "=== 8. REQUEST-BODY / LOGGING DISCOVERY ==="

grep -nE \
    -A8 \
    -B8 \
    'req\.body|console\.|logger\.|credentialPublicKey|authorization|expiresAt' \
    "$BACK/controllers/wp5Controller.js" \
    "$BACK/services/zk/wp5PrivacyService.js" \
    | tee "$EVIDENCE/body-and-logging-discovery.txt" \
    || true

###############################################################################
# 9. DB / BIOMETRIC COUPLING DISCOVERY
###############################################################################

echo
echo "=== 9. DB / BIOMETRIC COUPLING DISCOVERY ==="

grep -nE \
    -A5 \
    -B5 \
    'mongoose|Mongo|Voter\.|findOne|findById|face|fingerprint|verify|biometric' \
    "$BACK/controllers/wp5Controller.js" \
    "$BACK/services/zk/wp5PrivacyService.js" \
    "$BACK/routes/wp5Routes.js" \
    | tee "$EVIDENCE/backend-coupling-discovery.txt" \
    || true

###############################################################################
# 10. ENVIRONMENT VARIABLE NAMES ONLY
###############################################################################

echo
echo "=== 10. WP5 ENVIRONMENT VARIABLE NAMES ==="

grep -hoE \
    'process\.env\.[A-Z0-9_]+' \
    "$BACK/routes/wp5Routes.js" \
    "$BACK/controllers/wp5Controller.js" \
    "$BACK/services/zk/wp5PrivacyService.js" \
    "$BACK/utils/wp5Contract.js" \
    "$BACK/server.js" \
    | sed 's/process\.env\.//' \
    | sort -u \
    | tee "$EVIDENCE/wp5-env-names.txt"

echo
echo "IMPORTANT: actual .env values were NOT read."

###############################################################################
# 11. PACKAGE / RUNTIME INFORMATION
###############################################################################

echo
echo "=== 11. BACKEND PACKAGE INFORMATION ==="

node -e '
const fs=require("fs");

const p=JSON.parse(
  fs.readFileSync(
    process.argv[1],
    "utf8"
  )
);

console.log(
  "PACKAGE_NAME=" +
  String(p.name)
);

console.log(
  "PACKAGE_TYPE=" +
  String(p.type)
);

console.log(
  "DEV_SCRIPT=" +
  String(p.scripts?.dev)
);

console.log(
  "START_SCRIPT=" +
  String(p.scripts?.start)
);

for (
  const name of [
    "express",
    "mongoose",
    "ethers",
    "circomlibjs"
  ]
) {
  console.log(
    `DEP_${name}=` +
    String(
      p.dependencies?.[name] ??
      p.devDependencies?.[name]
    )
  );
}
' "$BACK/package.json" \
    | tee "$EVIDENCE/package-info.txt"

###############################################################################
# 12. NODE SYNTAX
###############################################################################

echo
echo "=== 12. BACKEND SYNTAX ==="

node --check \
    "$BACK/routes/wp5Routes.js"

node --check \
    "$BACK/controllers/wp5Controller.js"

node --check \
    "$BACK/services/zk/wp5PrivacyService.js"

node --check \
    "$BACK/utils/wp5Contract.js"

echo "BACKEND_WP5_SYNTAX=PASS"

###############################################################################
# 13. WRITE PREFLIGHT SUMMARY
###############################################################################

echo
echo "=== 13. SUMMARY ==="

{
    echo "======================================================================"
    echo "VOTECHAIN-ZK WP5E — BACKEND AUTHORIZATION PREFLIGHT"
    echo "======================================================================"
    echo
    echo "STATUS=PASS_WP5E_BACKEND_PREFLIGHT"
    echo "RUN_ID=$RUN_ID"
    echo
    echo "WP5D_V2_ACCEPTED=PASS"
    echo "READ_ONLY=YES"
    echo "DATABASE_ACCESS=NO"
    echo "BIOMETRIC_EXECUTION=NO"
    echo "SERVER_START=NO"
    echo "SOURCE_MODIFICATION=NO"
    echo
    echo "BACKEND_WP5_SYNTAX=PASS"
    echo
    echo "ACTUAL_HTTP_AUTHORIZATION_RUNTIME=NOT_YET"
    echo "NETWORK_CAPTURE=NOT_YET"
    echo "BACKEND_LOG_LEAKAGE_RUNTIME=NOT_YET"
    echo
    echo "SOURCE_CAPTURE=$CAPTURE"
    echo "EVIDENCE=$EVIDENCE"
    echo
    echo "NEXT_ACTION=DESIGN_WP5E_SYNTHETIC_BACKEND_RUNTIME_FROM_CURRENT_SOURCE"
    echo "======================================================================"
} | tee "$SUMMARY"

echo
echo "======================================================================"
echo "WP5E PREFLIGHT COMPLETE"
echo "======================================================================"
echo
echo "Please send/upload:"
echo "$CAPTURE"
echo
echo "and terminal output from this run."
