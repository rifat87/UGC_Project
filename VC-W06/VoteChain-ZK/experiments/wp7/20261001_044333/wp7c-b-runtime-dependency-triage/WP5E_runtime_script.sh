#!/usr/bin/env bash
set -euo pipefail

ROOT="$PWD"

if [ "$(basename "$ROOT")" != "VoteChain-ZK" ]; then
    echo "ERROR: run from VoteChain-ZK root."
    exit 2
fi

BACK="$ROOT/votechain-central-server"
FRONT="$ROOT/votechain-frontend-ts"
FOUNDRY="$ROOT/contracts/wp4-foundry"

DIRECT_ARTIFACT="$FOUNDRY/out/VoteChainWP4.sol/VoteChainDirect.json"
VERIFIER_ARTIFACT="$FOUNDRY/out/VoteChainVoteDirectVerifier.sol/VoteChainVoteDirectVerifier.json"
WP3_PROFILE="$ROOT/crypto/config/wp3-build-profile.json"

RUN_ID="$(date +%Y%m%d_%H%M%S)"
EVIDENCE="$ROOT/experiments/wp5/$RUN_ID/wp5e-auth-network"

OUTROOT="../VoteChain_VC-W03_FinalZK/Output/VC-W07"
SUMMARY="$OUTROOT/VC-W07_WP5E_BACKEND_AUTH_NETWORK_SUMMARY.txt"

ANVIL_PORT=8547
BACKEND_PORT=5007
VITE_PORT=4175
CDP_PORT=9225

RPC="http://127.0.0.1:$ANVIL_PORT"
BACKEND_URL="http://127.0.0.1:$BACKEND_PORT"
VITE_URL="http://127.0.0.1:$VITE_PORT"
CDP_URL="http://127.0.0.1:$CDP_PORT"

ANVIL_PID=""
BACKEND_PID=""
VITE_PID=""
BROWSER_PID=""

mkdir -p "$EVIDENCE" "$OUTROOT" "$BACK/scripts"

cleanup() {
    echo
    echo "=== CLEANUP ==="

    for pid in \
        "${BROWSER_PID:-}" \
        "${VITE_PID:-}" \
        "${BACKEND_PID:-}" \
        "${ANVIL_PID:-}"
    do
        if [ -n "$pid" ]; then
            kill "$pid" 2>/dev/null || true
            wait "$pid" 2>/dev/null || true
        fi
    done

    rm -f \
        "$BACK/scripts/wp5e-research-server.mjs" \
        "$FRONT/wp5e-runtime.html" \
        "$FRONT/src/wp5e-runtime.ts" \
        "$FRONT/.env.wp5e" \
        "$FRONT/scripts/wp5e-submit.mjs"

    echo "TEMPORARY_RESEARCH_FILES_REMOVED=YES"
}

trap cleanup EXIT INT TERM

echo
echo "======================================================================"
echo "VOTECHAIN-ZK WP5E — BACKEND AUTHORIZATION / NETWORK PRIVACY RUNTIME"
echo "======================================================================"
echo "RUN_ID=$RUN_ID"
echo
echo "Synthetic voter only."
echo "Mocked biometric-success boundary."
echo "Actual WP5 authorization service."
echo "Actual HTTP."
echo "Actual browser worker."
echo "Actual Groth16."
echo "Actual DIRECT contract."
echo "MongoDB access forbidden."
echo

###############################################################################
# 1. REQUIRE WP5D
###############################################################################

echo "=== 1. REQUIRE WP5D-v2 PASS ==="

WP5D_SUMMARY="$OUTROOT/VC-W07_WP5D_V2_SYNTHETIC_RUNTIME_SUMMARY.txt"

grep -q \
    '^STATUS=PASS_WP5D_V2_SYNTHETIC_RUNTIME$' \
    "$WP5D_SUMMARY"

echo "WP5D_V2_ACCEPTED=PASS"

###############################################################################
# 2. SOURCE INTEGRITY BASELINE
###############################################################################

echo
echo "=== 2. APPLICATION SOURCE BASELINE ==="

SOURCE_FILES=(
    "$BACK/routes/wp5Routes.js"
    "$BACK/controllers/wp5Controller.js"
    "$BACK/services/zk/wp5PrivacyService.js"
    "$BACK/models/Voter.js"
    "$BACK/utils/wp5Contract.js"
    "$FRONT/src/services/api.ts"
    "$FRONT/src/privacy/wp5Privacy.worker.ts"
    "$FRONT/src/privacy/wp5PrivacyClient.ts"
    "$FRONT/src/components/Biometric/VerificationModal.tsx"
    "$FRONT/src/components/Voter/VoteCasting.tsx"
)

sha256sum "${SOURCE_FILES[@]}" \
    > "$EVIDENCE/application-before.sha256"

echo "APPLICATION_SOURCE_BASELINE=PASS"

###############################################################################
# 3. PORT / TOOL PREFLIGHT
###############################################################################

echo
echo "=== 3. PORT / TOOL PREFLIGHT ==="

for command in \
    node \
    forge \
    anvil \
    cast \
    curl
do
    command -v "$command" >/dev/null 2>&1 || {
        echo "ERROR: $command not found."
        exit 10
    }
done

if cast chain-id --rpc-url "$RPC" >/dev/null 2>&1; then
    echo "ERROR: Anvil research port $ANVIL_PORT already occupied."
    exit 11
fi

for url in \
    "$BACKEND_URL/health" \
    "$VITE_URL" \
    "$CDP_URL/json/version"
do
    if curl -fsS "$url" >/dev/null 2>&1; then
        echo "ERROR: research port already occupied: $url"
        exit 12
    fi
done

echo "RESEARCH_PORTS=FREE"

###############################################################################
# 4. LOCATE CHROMIUM
###############################################################################

echo
echo "=== 4. LOCATE CHROMIUM ==="

BROWSER=""

for candidate in \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files/Microsoft/Edge/Application/msedge.exe" \
    "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
do
    if [ -f "$candidate" ]; then
        BROWSER="$candidate"
        break
    fi
done

if [ -z "$BROWSER" ]; then
    echo "ERROR: Chrome/Edge not found."
    exit 20
fi

echo "BROWSER=$BROWSER"

###############################################################################
# 5. FOUNDRY BUILD
###############################################################################

echo
echo "=== 5. FOUNDRY BUILD ==="

cd "$FOUNDRY"

forge build \
    > "$EVIDENCE/forge-build.log" \
    2>&1

cd "$ROOT"

echo "FOUNDRY_BUILD=PASS"

###############################################################################
# 6. START ISOLATED ANVIL
###############################################################################

echo
echo "=== 6. START ANVIL ==="

anvil \
    --host 127.0.0.1 \
    --port "$ANVIL_PORT" \
    --chain-id 31337 \
    > "$EVIDENCE/anvil.log" \
    2>&1 &

ANVIL_PID=$!

for _i in $(seq 1 30); do
    if cast chain-id \
        --rpc-url "$RPC" \
        >/dev/null 2>&1
    then
        break
    fi
    sleep 1
done

cast chain-id \
    --rpc-url "$RPC" \
    >/dev/null

echo "ANVIL_RUNTIME=PASS"

###############################################################################
# 7. WRITE RESEARCH BACKEND
###############################################################################

echo
echo "=== 7. WRITE WP5E RESEARCH BACKEND ==="

SERVER="$BACK/scripts/wp5e-research-server.mjs"

cat > "$SERVER" <<'NODE'
import fs from "node:fs"
import path from "node:path"
import mongoose from "mongoose"
import express from "express"

import {
  ContractFactory,
  JsonRpcProvider,
} from "ethers"

import {
  buildBabyjub,
} from "circomlibjs"

const [
  ,
  ,
  rpcUrl,
  portText,
  verifierArtifactPath,
  directArtifactPath,
  profilePath,
  evidenceDir,
] = process.argv

const port =
  Number(portText)

process.env.RPC_URL =
  rpcUrl

/*
 * Synthetic research key only.
 * Exactly 32 UTF-8 bytes.
 */
process.env.WP5_CREDENTIAL_SECRET_KEY =
  "0123456789abcdef0123456789abcdef"

function readJson(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8",
    ),
  )
}

function writeJson(
  file,
  value,
) {
  fs.writeFileSync(
    file,
    JSON.stringify(
      value,
      null,
      2,
    ) + "\n",
  )
}

function appendEvent(
  event,
  data = {},
) {
  fs.appendFileSync(
    path.join(
      evidenceDir,
      "backend-http.jsonl",
    ),
    JSON.stringify({
      event,
      ...data,
    }) + "\n",
  )
}

const Voter =
  (
    await import(
      "../models/Voter.js"
    )
  ).default

const Candidate =
  (
    await import(
      "../models/Candidate.js"
    )
  ).default

const {
  authorizeWp5Voter,
  buildWp5MerkleSnapshot,
  createWp5Credential,
  getWp5PublicConfig,
  hashCandidateManifest,
  wp5Hash,
} =
  await import(
    "../services/zk/wp5PrivacyService.js"
  )

if (
  mongoose.connection.readyState !== 0
) {
  throw new Error(
    "Research backend unexpectedly connected to MongoDB",
  )
}

const profile =
  readJson(
    profilePath,
  )

const verifierArtifact =
  readJson(
    verifierArtifactPath,
  )

const directArtifact =
  readJson(
    directArtifactPath,
  )

const provider =
  new JsonRpcProvider(
    rpcUrl,
  )

const signer =
  await provider.getSigner(0)

const verifier =
  await new ContractFactory(
    verifierArtifact.abi,
    verifierArtifact.bytecode.object,
    signer,
  ).deploy()

await verifier.waitForDeployment()

const verifierAddress =
  await verifier.getAddress()

const direct =
  await new ContractFactory(
    directArtifact.abi,
    directArtifact.bytecode.object,
    signer,
  ).deploy(
    verifierAddress,
  )

await direct.waitForDeployment()

const contractAddress =
  await direct.getAddress()

process.env.WP5_CONTRACT_ADDRESS =
  contractAddress

/*
 * The shared backend blockchain-config helper requires the historical
 * CONTRACT_ADDRESS variable even though the WP5 adapter itself uses
 * WP5_CONTRACT_ADDRESS. For this isolated research runtime both point
 * to the freshly deployed DIRECT contract.
 */
process.env.CONTRACT_ADDRESS =
  contractAddress

/*
 * Synthetic registered voter.
 * Secret remains in process memory only.
 */
const credential =
  await createWp5Credential({
    secret:
      42424242424242n,
  })

const syntheticVoter = {
  nationalId:
    "1000000001",

  wp5RegistrationStatus:
    "registered",

  wp5IdentityCommitment:
    credential.identityCommitment,

  wp5Credential:
    credential.encryptedCredential,

  wp5GroupIndex:
    0,
}

/*
 * Public election metadata.
 * This is not the voter's selected candidate.
 */
const publicCandidates = [
  {
    candidateId: 101,
    name: "Synthetic Candidate 101",
    party: "Synthetic Party A",
    location: "Synthetic District",
  },
  {
    candidateId: 102,
    name: "Synthetic Candidate 102",
    party: "Synthetic Party B",
    location: "Synthetic District",
  },
  {
    candidateId: 103,
    name: "Synthetic Candidate 103",
    party: "Synthetic Party C",
    location: "Synthetic District",
  },
  {
    candidateId: 104,
    name: "Synthetic Candidate 104",
    party: "Synthetic Party D",
    location: "Synthetic District",
  },
]

function queryResult(rows) {
  return {
    sort() {
      return this
    },

    select() {
      return this
    },

    async lean() {
      return rows.map(
        item => ({
          ...item,
        }),
      )
    },
  }
}

/*
 * Replace DB reads at the model boundary.
 * No mongoose.connect() is performed.
 */
Voter.find =
  () =>
    queryResult([
      {
        wp5RegistrationStatus:
          syntheticVoter.wp5RegistrationStatus,

        wp5IdentityCommitment:
          syntheticVoter.wp5IdentityCommitment,

        wp5GroupIndex:
          syntheticVoter.wp5GroupIndex,
      },
    ])

Candidate.find =
  () =>
    queryResult(
      publicCandidates,
    )

const snapshot =
  await buildWp5MerkleSnapshot(
    [
      {
        wp5GroupIndex: 0,
        wp5IdentityCommitment:
          credential.identityCommitment,
      },
    ],
    0,
  )

const candidateIds =
  publicCandidates.map(
    item =>
      item.candidateId,
  )

const manifest =
  await hashCandidateManifest(
    candidateIds,
  )

const babyjub =
  await buildBabyjub()

const Y =
  babyjub.mulPointEscalar(
    babyjub.Base8,
    123456789n,
  )

const Yx =
  BigInt(
    babyjub.F.toObject(
      Y[0],
    ),
  )

const Yy =
  BigInt(
    babyjub.F.toObject(
      Y[1],
    ),
  )

const electionId =
  202609300006n

const contractDomain =
  BigInt(
    profile.testContractDomain,
  )

const D_CTX =
  BigInt(
    profile.domains.electionContext,
  )

const context =
  await wp5Hash([
    D_CTX,
    electionId,
    manifest,
    BigInt(
      candidateIds.length,
    ),
    contractDomain,
    Yx,
    Yy,
  ])

await (
  await direct.configure([
    snapshot.root,
    electionId.toString(),
    manifest.toString(),
    String(
      candidateIds.length,
    ),
    contractDomain.toString(),
    Yx.toString(),
    Yy.toString(),
    context.toString(),
  ])
).wait()

await (
  await direct.activate()
).wait()

const configCheck =
  await getWp5PublicConfig()

if (
  configCheck.config.eligibleRoot !==
    snapshot.root ||
  Number(
    configCheck.phase,
  ) !== 1
) {
  throw new Error(
    "Actual WP5 public-config service did not match research contract",
  )
}

writeJson(
  path.join(
    evidenceDir,
    "runtime-metadata.json",
  ),
  {
    rpcUrl,
    verifierAddress,
    contractAddress,
    eligibleRoot:
      snapshot.root,
    candidateManifestHash:
      manifest.toString(),
    mongoReadyState:
      mongoose.connection.readyState,
    biometricBoundary:
      "MOCKED_SUCCESS",
    authorizationService:
      "ACTUAL_authorizeWp5Voter",
  },
)

const app =
  express()

app.use(
  express.json(),
)

app.use(
  (
    req,
    res,
    next,
  ) => {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "http://127.0.0.1:4175",
    )

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type",
    )

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,OPTIONS",
    )

    if (
      req.method === "OPTIONS"
    ) {
      return res.sendStatus(204)
    }

    next()
  },
)

app.get(
  "/health",
  (
    _req,
    res,
  ) => {
    res.json({
      ok: true,
    })
  },
)

app.get(
  "/api/wp5/config",
  async (
    _req,
    res,
  ) => {
    try {
      const data =
        await getWp5PublicConfig()

      appendEvent(
        "config_response",
        {
          status: 200,
        },
      )

      res.json({
        success: true,
        data,
      })
    } catch (error) {
      appendEvent(
        "config_error",
        {
          message:
            error instanceof Error
              ? error.message
              : String(error),
        },
      )

      res.status(500).json({
        success: false,
        message:
          "WP5 research configuration failed",
      })
    }
  },
)

app.post(
  "/api/wp5/authorize/face",
  async (
    req,
    res,
  ) => {
    const body =
      req.body ?? {}

    const bodyKeys =
      Object.keys(
        body,
      ).sort()

    const forbiddenFields =
      bodyKeys.filter(
        key =>
          /candidateId|candidateIndex|selectedCandidate|voteChoice|candidateChoice/i.test(
            key,
          ),
      )

    writeJson(
      path.join(
        evidenceDir,
        "authorization-request-server.json",
      ),
      {
        method:
          req.method,

        path:
          req.path,

        body,
      },
    )

    appendEvent(
      "auth_request",
      {
        method:
          req.method,

        path:
          req.path,

        bodyKeys,

        forbiddenFieldCount:
          forbiddenFields.length,
      },
    )

    if (
      !body.credentialPublicKey
    ) {
      return res.status(400).json({
        success: false,
        message:
          "credentialPublicKey is required",
      })
    }

    try {
      /*
       * The biometric-success boundary is mocked.
       * Credential issuance itself is the actual production service.
       */
      const authorization =
        await authorizeWp5Voter({
          voter:
            syntheticVoter,

          clientPublicKey:
            body.credentialPublicKey,
        })

      appendEvent(
        "auth_success",
        {
          status: 200,
          responseKeys:
            Object.keys(
              authorization,
            ).sort(),
        },
      )

      return res.json({
        success: true,
        message:
          "Synthetic biometric boundary accepted; WP5 authorization issued",
        data:
          authorization,
      })
    } catch (error) {
      appendEvent(
        "auth_error",
        {
          message:
            error instanceof Error
              ? error.message
              : String(error),
        },
      )

      return res.status(500).json({
        success: false,
        message:
          "WP5 authorization failed",
      })
    }
  },
)

const server =
  app.listen(
    port,
    "127.0.0.1",
    () => {
      console.log(
        "WP5E_RESEARCH_BACKEND_READY=PASS",
      )

      console.log(
        `DIRECT_ADDRESS=${contractAddress}`,
      )

      console.log(
        `MONGOOSE_READY_STATE=${mongoose.connection.readyState}`,
      )
    },
  )

function stop() {
  server.close(
    () =>
      process.exit(0),
  )
}

process.on(
  "SIGTERM",
  stop,
)

process.on(
  "SIGINT",
  stop,
)
NODE

###############################################################################
# 8. START RESEARCH BACKEND
###############################################################################

echo
echo "=== 8. START RESEARCH BACKEND ==="

cd "$BACK"

node \
    scripts/wp5e-research-server.mjs \
    "$RPC" \
    "$BACKEND_PORT" \
    "$VERIFIER_ARTIFACT" \
    "$DIRECT_ARTIFACT" \
    "$WP3_PROFILE" \
    "$EVIDENCE" \
    > "$EVIDENCE/backend-process.log" \
    2>&1 &

BACKEND_PID=$!

cd "$ROOT"

BACKEND_READY=0

for _i in $(seq 1 60); do
    if curl -fsS \
        "$BACKEND_URL/health" \
        >/dev/null 2>&1
    then
        BACKEND_READY=1
        break
    fi

    sleep 1
done

if [ "$BACKEND_READY" != "1" ]; then
    echo "ERROR: research backend failed."
    cat "$EVIDENCE/backend-process.log"
    exit 30
fi

cat "$EVIDENCE/backend-process.log"

echo "WP5E_RESEARCH_BACKEND=PASS"

###############################################################################
# 9. VERIFY NO MONGODB CONNECTION
###############################################################################

echo
echo "=== 9. VERIFY NO MONGODB ==="

MONGO_STATE="$(
    node -e '
const fs=require("fs");
const x=JSON.parse(
  fs.readFileSync(
    process.argv[1],
    "utf8"
  )
);
process.stdout.write(
  String(x.mongoReadyState)
);
' "$EVIDENCE/runtime-metadata.json"
)"

echo "MONGOOSE_READY_STATE=$MONGO_STATE"

if [ "$MONGO_STATE" != "0" ]; then
    echo "ERROR: MongoDB connection was unexpectedly active."
    exit 31
fi

echo "MONGODB_ACCESSED=NO"

###############################################################################
# 10. CREATE TEMPORARY VITE RESEARCH MODE
###############################################################################

echo
echo "=== 10. CREATE VITE RESEARCH MODE ==="

cat > "$FRONT/.env.wp5e" <<EOF
VITE_API_BASE_URL=$BACKEND_URL
VITE_RPC_URL=$RPC
EOF

cat > "$FRONT/wp5e-runtime.html" <<'HTML'
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>VoteChain-ZK WP5E</title>
</head>
<body
  data-wp5e-status="RUNNING"
  data-wp5e-result=""
>
  <pre id="status">RUNNING</pre>

  <script
    type="module"
    src="/src/wp5e-runtime.ts"
  ></script>
</body>
</html>
HTML

cat > "$FRONT/src/wp5e-runtime.ts" <<'TS'
import {
  authorizeWp5,
  getWp5PublicConfig,
} from "./services/api"

import {
  beginWp5Authorization,
  prepareWp5EncryptedBallot,
  resetWp5PrivacySession,
} from "./privacy/wp5PrivacyClient"

function bytesToBase64(
  bytes: Uint8Array,
) {
  let binary = ""

  for (
    let index = 0;
    index < bytes.length;
    index += 1
  ) {
    binary +=
      String.fromCharCode(
        bytes[index],
      )
  }

  return btoa(binary)
}

function encodeResult(
  value: unknown,
) {
  return bytesToBase64(
    new TextEncoder()
      .encode(
        JSON.stringify(
          value,
        ),
      ),
  )
}

function forbiddenKey(
  value: unknown,
): boolean {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false
  }

  for (
    const [
      key,
      child,
    ] of Object.entries(
      value as Record<
        string,
        unknown
      >,
    )
  ) {
    if (
      /candidateId|candidateIndex|selectedCandidate|voteChoice|candidateChoice/i.test(
        key,
      )
    ) {
      return true
    }

    if (
      forbiddenKey(
        child,
      )
    ) {
      return true
    }
  }

  return false
}

async function run() {
  const overallStart =
    performance.now()

  /*
   * Public candidate metadata is intentionally available.
   * The private choice is introduced only after config retrieval.
   */
  const publicConfig =
    await getWp5PublicConfig()

  const selected =
    publicConfig.candidates.find(
      item =>
        Number(
          item.candidateId,
        ) === 102,
    )

  if (!selected) {
    throw new Error(
      "Synthetic local candidate not present in public config",
    )
  }

  /*
   * Keep selected candidate local from this point onward.
   */
  const selectedCandidateId =
    selected.candidateId

  const network: {
    authRequestUrl?: string
    authRequestMethod?: string
    authRequestBody?: unknown
  } = {}

  const originalFetch =
    globalThis.fetch.bind(
      globalThis,
    )

  ;(globalThis as any).fetch =
    async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url

      if (
        url.includes(
          "/api/wp5/authorize/face",
        )
      ) {
        network.authRequestUrl =
          url

        network.authRequestMethod =
          init?.method ?? "GET"

        network.authRequestBody =
          typeof init?.body ===
            "string"
            ? JSON.parse(
                init.body,
              )
            : null
      }

      return originalFetch(
        input,
        init,
      )
    }

  const {
    credentialPublicKey,
  } =
    await beginWp5Authorization()

  const authorizationStart =
    performance.now()

  const authorization =
    await authorizeWp5(
      "/api/wp5/authorize/face",
      credentialPublicKey,
    )

  const authorizationMs =
    performance.now() -
    authorizationStart

  if (
    !network.authRequestBody
  ) {
    throw new Error(
      "Authorization network request was not captured",
    )
  }

  if (
    forbiddenKey(
      network.authRequestBody,
    )
  ) {
    throw new Error(
      "Selected-candidate field entered authorization request",
    )
  }

  if (
    forbiddenKey(
      authorization,
    )
  ) {
    throw new Error(
      "Selected-candidate field entered authorization response",
    )
  }

  const privacyStart =
    performance.now()

  const ballot =
    await prepareWp5EncryptedBallot(
      selectedCandidateId,
      authorization,
      publicConfig,
    )

  const privacyMs =
    performance.now() -
    privacyStart

  const ballotKeys =
    Object.keys(
      ballot,
    ).sort()

  if (
    ballotKeys.some(
      key =>
        /candidate/i.test(
          key,
        ),
    )
  ) {
    throw new Error(
      "Candidate plaintext field entered encrypted ballot object",
    )
  }

  const result = {
    status:
      "PASS",

    biometricBoundary:
      "MOCKED_SUCCESS",

    actualAuthorizationService:
      true,

    candidateSelectionLocalOnly:
      true,

    candidatePlaintextInAuthorizationRequest:
      false,

    candidatePlaintextInAuthorizationResponse:
      false,

    authorizationMs,

    privacyMs,

    overallMs:
      performance.now() -
      overallStart,

    network,

    authorizationShape: {
      topLevelKeys:
        Object.keys(
          authorization,
        ).sort(),

      membershipKeys:
        Object.keys(
          authorization.membership,
        ).sort(),

      credentialEnvelopeKeys:
        Object.keys(
          authorization.credentialEnvelope,
        ).sort(),
    },

    ballot,
  }

  resetWp5PrivacySession()

  document.body.dataset.wp5eResult =
    encodeResult(
      result,
    )

  document.body.dataset.wp5eStatus =
    "PASS"

  document
    .getElementById(
      "status",
    )!
    .textContent =
      "PASS"
}

try {
  await run()
} catch (error) {
  resetWp5PrivacySession()

  const result = {
    status:
      "FAIL",

    error:
      error instanceof Error
        ? error.message
        : String(error),
  }

  document.body.dataset.wp5eResult =
    encodeResult(
      result,
    )

  document.body.dataset.wp5eStatus =
    "FAIL"

  document
    .getElementById(
      "status",
    )!
    .textContent =
      `FAIL: ${result.error}`
}
TS

###############################################################################
# 11. START VITE
###############################################################################

echo
echo "=== 11. START VITE ==="

cd "$FRONT"

node \
    node_modules/vite/bin/vite.js \
    --mode wp5e \
    --host 127.0.0.1 \
    --port "$VITE_PORT" \
    --strictPort \
    > "$EVIDENCE/vite.log" \
    2>&1 &

VITE_PID=$!

cd "$ROOT"

for _i in $(seq 1 60); do
    if curl -fsS \
        "$VITE_URL/wp5e-runtime.html" \
        >/dev/null 2>&1
    then
        break
    fi
    sleep 1
done

curl -fsS \
    "$VITE_URL/wp5e-runtime.html" \
    >/dev/null

echo "VITE_RUNTIME_SERVER=PASS"

###############################################################################
# 12. START CHROME CDP
###############################################################################

echo
echo "=== 12. START CHROME CDP ==="

CHROME_PROFILE="$EVIDENCE/chrome-profile"

"$BROWSER" \
    --headless=new \
    --disable-gpu \
    --no-first-run \
    --no-default-browser-check \
    --disable-background-networking \
    --disable-extensions \
    --disable-sync \
    --remote-debugging-address=127.0.0.1 \
    --remote-debugging-port="$CDP_PORT" \
    --user-data-dir="$CHROME_PROFILE" \
    "$VITE_URL/wp5e-runtime.html" \
    > "$EVIDENCE/chrome.log" \
    2>&1 &

BROWSER_PID=$!

for _i in $(seq 1 60); do
    if curl -fsS \
        "$CDP_URL/json/version" \
        >/dev/null 2>&1
    then
        break
    fi
    sleep 1
done

curl -fsS \
    "$CDP_URL/json/version" \
    >/dev/null

echo "CHROME_CDP=PASS"

###############################################################################
# 13. CDP COLLECTOR
###############################################################################

echo
echo "=== 13. WAIT FOR BACKEND → WORKER RUNTIME ==="

CDP_RUNNER="$EVIDENCE/wp5e-cdp-runner.mjs"

cat > "$CDP_RUNNER" <<'NODE'
import fs from "node:fs"

const [
  ,
  ,
  cdpBase,
  outputPath,
] = process.argv

const sleep =
  ms =>
    new Promise(
      resolve =>
        setTimeout(
          resolve,
          ms,
        ),
    )

let target

for (
  let attempt = 0;
  attempt < 120;
  attempt += 1
) {
  const response =
    await fetch(
      `${cdpBase}/json/list`,
    )

  const targets =
    await response.json()

  target =
    targets.find(
      item =>
        item.type ===
          "page" &&
        String(
          item.url,
        ).includes(
          "wp5e-runtime.html",
        ),
    )

  if (target) break

  await sleep(500)
}

if (!target) {
  throw new Error(
    "WP5E browser target missing",
  )
}

const ws =
  new WebSocket(
    target.webSocketDebuggerUrl,
  )

await new Promise(
  (
    resolve,
    reject,
  ) => {
    ws.addEventListener(
      "open",
      resolve,
      {
        once: true,
      },
    )

    ws.addEventListener(
      "error",
      () =>
        reject(
          new Error(
            "CDP websocket failed",
          ),
        ),
      {
        once: true,
      },
    )
  },
)

let nextId = 0

const pending =
  new Map()

ws.addEventListener(
  "message",
  event => {
    const message =
      JSON.parse(
        typeof event.data ===
          "string"
          ? event.data
          : Buffer.from(
              event.data,
            ).toString(
              "utf8",
            ),
      )

    if (
      !message.id ||
      !pending.has(
        message.id,
      )
    ) {
      return
    }

    const item =
      pending.get(
        message.id,
      )

    pending.delete(
      message.id,
    )

    if (message.error) {
      item.reject(
        new Error(
          JSON.stringify(
            message.error,
          ),
        ),
      )
    } else {
      item.resolve(
        message.result,
      )
    }
  },
)

function send(
  method,
  params = {},
) {
  const id =
    ++nextId

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      pending.set(
        id,
        {
          resolve,
          reject,
        },
      )

      ws.send(
        JSON.stringify({
          id,
          method,
          params,
        }),
      )
    },
  )
}

async function evaluate(
  expression,
) {
  const result =
    await send(
      "Runtime.evaluate",
      {
        expression,
        returnByValue:
          true,
      },
    )

  return result.result.value
}

await send(
  "Runtime.enable",
)

let status =
  "RUNNING"

for (
  let iteration = 0;
  iteration < 600;
  iteration += 1
) {
  status =
    await evaluate(`
      document.body
        ? (
            document.body.dataset.wp5eStatus ||
            "MISSING"
          )
        : "NO_BODY"
    `)

  if (
    iteration % 10 === 0
  ) {
    console.log(
      `CDP_STATUS_${iteration}=${status}`,
    )
  }

  if (
    status === "PASS" ||
    status === "FAIL"
  ) {
    break
  }

  await sleep(1000)
}

const encoded =
  await evaluate(`
    document.body.dataset.wp5eResult || ""
  `)

if (!encoded) {
  throw new Error(
    `WP5E result missing; terminal status=${status}`,
  )
}

const result =
  JSON.parse(
    Buffer.from(
      encoded,
      "base64",
    ).toString(
      "utf8",
    ),
  )

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    result,
    null,
    2,
  ) + "\n",
)

console.log(
  `BROWSER_RESULT_STATUS=${result.status}`,
)

if (
  result.status !==
  "PASS"
) {
  console.log(
    `BROWSER_RESULT_ERROR=${result.error}`,
  )

  ws.close()

  process.exitCode = 3
} else {
  console.log(
    "BACKEND_HTTP_TO_BROWSER_WORKER=PASS",
  )

  console.log(
    `BACKEND_AUTHORIZATION_MS=${result.authorizationMs}`,
  )

  console.log(
    `BROWSER_LOCAL_PRIVACY_MS=${result.privacyMs}`,
  )

  ws.close()
}
NODE

BROWSER_RESULT="$EVIDENCE/browser-result.json"

node \
    "$CDP_RUNNER" \
    "$CDP_URL" \
    "$BROWSER_RESULT" \
    | tee "$EVIDENCE/cdp.log"

###############################################################################
# 14. WAIT FOR SERVER-SIDE REQUEST CAPTURE
###############################################################################

echo
echo "=== 14. VERIFY AUTH REQUEST CAPTURE ==="

SERVER_REQUEST="$EVIDENCE/authorization-request-server.json"

for _i in $(seq 1 20); do
    [ -f "$SERVER_REQUEST" ] && break
    sleep 1
done

[ -f "$SERVER_REQUEST" ] || {
    echo "ERROR: server request capture missing."
    exit 40
}

echo "AUTHORIZATION_REQUEST_CAPTURE=PASS"

###############################################################################
# 15. WRITE ONCHAIN SUBMISSION
###############################################################################

echo
echo "=== 15. WRITE ONCHAIN SUBMISSION HARNESS ==="

SUBMIT="$FRONT/scripts/wp5e-submit.mjs"

cat > "$SUBMIT" <<'NODE'
import fs from "node:fs"

import {
  Contract,
  JsonRpcProvider,
} from "ethers"

const [
  ,
  ,
  metadataPath,
  browserResultPath,
  artifactPath,
  outputPath,
] = process.argv

const metadata =
  JSON.parse(
    fs.readFileSync(
      metadataPath,
      "utf8",
    ),
  )

const browser =
  JSON.parse(
    fs.readFileSync(
      browserResultPath,
      "utf8",
    ),
  )

const artifact =
  JSON.parse(
    fs.readFileSync(
      artifactPath,
      "utf8",
    ),
  )

if (
  browser.status !==
  "PASS"
) {
  throw new Error(
    "Browser authorization/privacy result not PASS",
  )
}

const ballot =
  browser.ballot

const provider =
  new JsonRpcProvider(
    metadata.rpcUrl,
  )

const signer =
  await provider.getSigner(0)

const contract =
  new Contract(
    metadata.contractAddress,
    artifact.abi,
    signer,
  )

const before =
  await contract
    .acceptedBallotCount()

const start =
  performance.now()

const tx =
  await contract.castVote(
    ballot.a,
    ballot.b,
    ballot.c,
    ballot.nullifier,
    ballot.rx,
    ballot.ry,
    ballot.sx,
    ballot.sy,
  )

let receipt = null

for (
  let attempt = 0;
  attempt < 300;
  attempt += 1
) {
  receipt =
    await provider
      .getTransactionReceipt(
        tx.hash,
      )

  if (receipt) break

  await new Promise(
    resolve =>
      setTimeout(
        resolve,
        100,
      ),
  )
}

if (
  !receipt ||
  receipt.status !== 1
) {
  throw new Error(
    "Integrated encrypted vote was not mined successfully",
  )
}

const latencyMs =
  performance.now() -
  start

const after =
  await contract
    .acceptedBallotCount()

const used =
  await contract
    .usedNullifier(
      ballot.nullifier,
    )

if (
  before !== 0n ||
  after !== 1n ||
  used !== true
) {
  throw new Error(
    "Integrated on-chain state mismatch",
  )
}

for (
  let slot = 0;
  slot < 16;
  slot += 1
) {
  const tally =
    await contract
      .getTally(slot)

  const expected = [
    BigInt(
      ballot.rx[slot],
    ),
    BigInt(
      ballot.ry[slot],
    ),
    BigInt(
      ballot.sx[slot],
    ),
    BigInt(
      ballot.sy[slot],
    ),
  ]

  for (
    let coordinate = 0;
    coordinate < 4;
    coordinate += 1
  ) {
    if (
      BigInt(
        tally[coordinate],
      ) !==
      expected[coordinate]
    ) {
      throw new Error(
        "Integrated encrypted tally mismatch",
      )
    }
  }
}

let duplicateRejected =
  false

try {
  const duplicate =
    await contract.castVote(
      ballot.a,
      ballot.b,
      ballot.c,
      ballot.nullifier,
      ballot.rx,
      ballot.ry,
      ballot.sx,
      ballot.sy,
    )

  await duplicate.wait()
} catch {
  duplicateRejected =
    true
}

if (
  !duplicateRejected
) {
  throw new Error(
    "Duplicate nullifier accepted",
  )
}

const fragment =
  contract.interface
    .getFunction(
      "castVote",
    )

const candidateInputs =
  fragment.inputs.filter(
    input =>
      /candidate/i.test(
        input.name || "",
      ),
  )

if (
  candidateInputs.length !== 0
) {
  throw new Error(
    "Candidate-named DIRECT input found",
  )
}

const result = {
  status:
    "PASS",

  txHash:
    receipt.hash,

  gasUsed:
    receipt.gasUsed.toString(),

  calldataBytes:
    (
      tx.data.length -
      2
    ) / 2,

  latencyMs,

  acceptedBefore:
    before.toString(),

  acceptedAfter:
    after.toString(),

  nullifierUsed:
    used,

  firstBallotTallyMatch:
    true,

  duplicateNullifierRejected:
    true,

  candidateNamedCastInputs:
    candidateInputs.length,
}

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    result,
    null,
    2,
  ) + "\n",
)

console.log(
  "INTEGRATED_ONCHAIN_CAST=PASS",
)

console.log(
  `INTEGRATED_CAST_GAS=${result.gasUsed}`,
)

console.log(
  `INTEGRATED_CALLDATA_BYTES=${result.calldataBytes}`,
)

console.log(
  "INTEGRATED_DUPLICATE_NULLIFIER_REJECTED=PASS",
)
NODE

ONCHAIN_RESULT="$EVIDENCE/onchain-result.json"

cd "$FRONT"

node \
    scripts/wp5e-submit.mjs \
    "$EVIDENCE/runtime-metadata.json" \
    "$BROWSER_RESULT" \
    "$DIRECT_ARTIFACT" \
    "$ONCHAIN_RESULT" \
    | tee "$EVIDENCE/onchain.log"

cd "$ROOT"

###############################################################################
# 16. NETWORK / LOG PRIVACY GATE
###############################################################################

echo
echo "=== 16. NETWORK / LOG PRIVACY GATE ==="

PRIVACY_CHECKER="$EVIDENCE/wp5e-privacy-check.mjs"

cat > "$PRIVACY_CHECKER" <<'NODE'
import fs from "node:fs"
import {
  isDeepStrictEqual,
} from "node:util"

const [
  ,
  ,
  browserPath,
  serverRequestPath,
  backendLogPath,
  onchainPath,
] = process.argv

const browser =
  JSON.parse(
    fs.readFileSync(
      browserPath,
      "utf8",
    ),
  )

const serverRequest =
  JSON.parse(
    fs.readFileSync(
      serverRequestPath,
      "utf8",
    ),
  )

const backendLog =
  fs.readFileSync(
    backendLogPath,
    "utf8",
  )

const onchain =
  JSON.parse(
    fs.readFileSync(
      onchainPath,
      "utf8",
    ),
  )

const outgoing =
  browser.network
    .authRequestBody

const incoming =
  serverRequest.body

if (
  !isDeepStrictEqual(
    outgoing,
    incoming,
  )
) {
  throw new Error(
    "Client/server authorization payload mismatch",
  )
}

const requestKeys =
  Object.keys(
    incoming,
  ).sort()

if (
  requestKeys.length !== 1 ||
  requestKeys[0] !==
    "credentialPublicKey"
) {
  throw new Error(
    "Authorization request contains unexpected fields",
  )
}

function forbiddenKey(
  value,
) {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return false
  }

  return Object.entries(
    value,
  ).some(
    (
      [
        key,
        child,
      ],
    ) =>
      /candidateId|candidateIndex|selectedCandidate|voteChoice|candidateChoice/i.test(
        key,
      ) ||
      forbiddenKey(
        child,
      ),
  )
}

if (
  forbiddenKey(
    outgoing,
  ) ||
  forbiddenKey(
    incoming,
  )
) {
  throw new Error(
    "Selected-candidate field present in authorization payload",
  )
}

if (
  /candidateId|candidateIndex|selectedCandidate|voteChoice|candidateChoice/i.test(
    backendLog,
  )
) {
  throw new Error(
    "Selected-candidate field name appears in backend runtime log",
  )
}

for (
  const group of Object.values(
    browser.authorizationShape,
  )
) {
  if (
    group.some(
      key =>
        /candidate/i.test(
          key,
        ),
    )
  ) {
    throw new Error(
      "Authorization response shape contains candidate field",
    )
  }
}

if (
  onchain.status !==
    "PASS" ||
  onchain.acceptedAfter !==
    "1" ||
  onchain.nullifierUsed !==
    true ||
  onchain.firstBallotTallyMatch !==
    true ||
  onchain.duplicateNullifierRejected !==
    true ||
  onchain.candidateNamedCastInputs !==
    0
) {
  throw new Error(
    "Integrated on-chain gate mismatch",
  )
}

console.log(
  "CLIENT_SERVER_AUTH_PAYLOAD_MATCH=PASS",
)

console.log(
  "AUTH_REQUEST_KEYS=credentialPublicKey",
)

console.log(
  "SELECTED_CANDIDATE_IN_AUTH_REQUEST=NO",
)

console.log(
  "SELECTED_CANDIDATE_IN_AUTH_RESPONSE_SHAPE=NO",
)

console.log(
  "SELECTED_CANDIDATE_FIELD_IN_BACKEND_RUNTIME_LOG=NO",
)

console.log(
  "PUBLIC_CANDIDATE_METADATA_EXCLUDED_FROM_PRIVATE_CHOICE_LEAK_TEST=YES",
)

console.log(
  "BACKEND_TO_BROWSER_TO_CONTRACT=PASS",
)
NODE

node \
    "$PRIVACY_CHECKER" \
    "$BROWSER_RESULT" \
    "$SERVER_REQUEST" \
    "$EVIDENCE/backend-http.jsonl" \
    "$ONCHAIN_RESULT"

###############################################################################
# 17. APPLICATION SOURCE INTEGRITY
###############################################################################

echo
echo "=== 17. APPLICATION SOURCE INTEGRITY ==="

sha256sum "${SOURCE_FILES[@]}" \
    > "$EVIDENCE/application-after.sha256"

cmp \
    "$EVIDENCE/application-before.sha256" \
    "$EVIDENCE/application-after.sha256"

echo "APPLICATION_SOURCE_CHANGED_DURING_WP5E=NO"

###############################################################################
# 18. SMOKE METRICS
###############################################################################

echo
echo "=== 18. WP5E SMOKE METRICS ==="

METRICS="$EVIDENCE/wp5e-smoke-metrics.json"

node -e '
const fs=require("fs");

const browser=JSON.parse(
  fs.readFileSync(
    process.argv[1],
    "utf8"
  )
);

const chain=JSON.parse(
  fs.readFileSync(
    process.argv[2],
    "utf8"
  )
);

const out={
  classification:
    "FUNCTIONAL_SMOKE_ONLY_NOT_FINAL_BENCHMARK",

  samples: 1,

  backendAuthorizationMs:
    browser.authorizationMs,

  localPrivacyMs:
    browser.privacyMs,

  browserOverallMs:
    browser.overallMs,

  castGas:
    chain.gasUsed,

  calldataBytes:
    chain.calldataBytes,

  transactionLatencyMs:
    chain.latencyMs
};

fs.writeFileSync(
  process.argv[3],
  JSON.stringify(
    out,
    null,
    2
  ) + "\n"
);

console.log(
  JSON.stringify(
    out,
    null,
    2
  )
);
' \
    "$BROWSER_RESULT" \
    "$ONCHAIN_RESULT" \
    "$METRICS"

###############################################################################
# 19. EVIDENCE HASHES
###############################################################################

echo
echo "=== 19. EVIDENCE HASHES ==="

sha256sum \
    "$EVIDENCE/runtime-metadata.json" \
    "$EVIDENCE/authorization-request-server.json" \
    "$EVIDENCE/backend-http.jsonl" \
    "$BROWSER_RESULT" \
    "$ONCHAIN_RESULT" \
    "$METRICS" \
    > "$EVIDENCE/wp5e-evidence.sha256"

cat "$EVIDENCE/wp5e-evidence.sha256"

###############################################################################
# 20. EXTRACT SUMMARY VALUES
###############################################################################

AUTH_MS="$(
    node -e '
const x=require(process.argv[1]);
process.stdout.write(
  String(x.authorizationMs)
);
' "$BROWSER_RESULT"
)"

PRIVACY_MS="$(
    node -e '
const x=require(process.argv[1]);
process.stdout.write(
  String(x.privacyMs)
);
' "$BROWSER_RESULT"
)"

CAST_GAS="$(
    node -e '
const x=require(process.argv[1]);
process.stdout.write(
  String(x.gasUsed)
);
' "$ONCHAIN_RESULT"
)"

CALLDATA="$(
    node -e '
const x=require(process.argv[1]);
process.stdout.write(
  String(x.calldataBytes)
);
' "$ONCHAIN_RESULT"
)"

###############################################################################
# 21. REMOVE TEMPORARY ACTIVE-TREE RESEARCH FILES
###############################################################################

echo
echo "=== 21. CLEAN ACTIVE TREE ==="

rm -f \
    "$BACK/scripts/wp5e-research-server.mjs" \
    "$FRONT/wp5e-runtime.html" \
    "$FRONT/src/wp5e-runtime.ts" \
    "$FRONT/.env.wp5e" \
    "$FRONT/scripts/wp5e-submit.mjs"

echo "TEMPORARY_RESEARCH_SOURCE_LEFT_IN_ACTIVE_TREE=NO"

###############################################################################
# 22. SUMMARY
###############################################################################

echo
echo "=== 22. WRITE WP5E SUMMARY ==="

{
    echo "======================================================================"
    echo "VOTECHAIN-ZK WP5E — BACKEND AUTHORIZATION / NETWORK PRIVACY RUNTIME"
    echo "======================================================================"
    echo
    echo "STATUS=PASS_WP5E_BACKEND_AUTH_NETWORK_RUNTIME"
    echo "RUN_ID=$RUN_ID"
    echo
    echo "WP5D_V2_ACCEPTED=PASS"
    echo
    echo "BIOMETRIC_BOUNDARY=MOCKED_SUCCESS"
    echo "REAL_BIOMETRIC_EXECUTION=NO"
    echo "MONGODB_ACCESSED=NO"
    echo
    echo "ACTUAL_WP5_AUTHORIZATION_SERVICE_RUNTIME=PASS"
    echo "ACTUAL_ECDH_P256_CREDENTIAL_ENVELOPE=PASS"
    echo "ACTUAL_HKDF_SHA256=PASS"
    echo "ACTUAL_AES_256_GCM=PASS"
    echo
    echo "HTTP_AUTHORIZATION_REQUEST=PASS"
    echo "AUTH_REQUEST_KEYS=credentialPublicKey"
    echo "CLIENT_SERVER_AUTH_PAYLOAD_MATCH=PASS"
    echo "SELECTED_CANDIDATE_IN_AUTH_REQUEST=NO"
    echo "SELECTED_CANDIDATE_IN_AUTH_RESPONSE_SHAPE=NO"
    echo "SELECTED_CANDIDATE_FIELD_IN_BACKEND_RUNTIME_LOG=NO"
    echo
    echo "PUBLIC_CANDIDATE_METADATA_ON_CONFIG_ENDPOINT=EXPECTED"
    echo "PUBLIC_CANDIDATE_METADATA_IS_PRIVATE_CHOICE_LEAK=NO"
    echo
    echo "BROWSER_WORKER_AFTER_BACKEND_AUTH=PASS"
    echo "BROWSER_DIRECT_GROTH16=PASS"
    echo "INTEGRATED_ONCHAIN_CAST=PASS"
    echo "ONCHAIN_ACCEPTED_BALLOT_COUNT=1"
    echo "ONCHAIN_NULLIFIER_USED=PASS"
    echo "ONCHAIN_FIRST_BALLOT_TALLY_MATCH=PASS"
    echo "ONCHAIN_DUPLICATE_NULLIFIER_REJECTED=PASS"
    echo "DIRECT_CALLDATA_CANDIDATE_ARGUMENT=NO"
    echo
    echo "BACKEND_TO_BROWSER_TO_CONTRACT=PASS"
    echo
    echo "BACKEND_AUTHORIZATION_MS=$AUTH_MS"
    echo "BROWSER_LOCAL_PRIVACY_MS=$PRIVACY_MS"
    echo "ONCHAIN_CAST_GAS=$CAST_GAS"
    echo "ONCHAIN_CALLDATA_BYTES=$CALLDATA"
    echo
    echo "FUNCTIONAL_SMOKE_SAMPLE_COUNT=1"
    echo "FINAL_BENCHMARK=NO"
    echo "WP8_REPEATED_MEASUREMENTS=PENDING"
    echo
    echo "APPLICATION_SOURCE_CHANGED_DURING_WP5E=NO"
    echo "TEMPORARY_RESEARCH_SOURCE_LEFT_IN_ACTIVE_TREE=NO"
    echo
    echo "WP5_RESEARCH_INTEGRATION_GATE=PASS"
    echo "REAL_FACE_FINGERPRINT_MANUAL_E2E=PENDING_FINAL_SHOWCASE"
    echo
    echo "TRUSTED_SETUP=DEV_ONLY"
    echo "PRODUCTION_TRUSTED_SETUP_CLAIM=NO"
    echo
    echo "EVIDENCE=$EVIDENCE"
    echo
    echo "NEXT_ACTION=WP6_THRESHOLD_TALLY_SUBSYSTEM"
    echo "======================================================================"
} | tee "$SUMMARY"

echo
echo "======================================================================"
echo "WP5E COMPLETE"
echo "======================================================================"
echo
echo "Send me:"
echo "$SUMMARY"
