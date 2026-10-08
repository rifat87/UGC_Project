#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
FRONTEND="$ROOT/votechain-frontend-ts"

API="$FRONTEND/src/services/api.ts"
STATUS="$FRONTEND/src/components/Admin/ElectionStatus.tsx"
ADMIN_NAV="$FRONTEND/src/components/Layout/AdminNavigation.tsx"

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP="$ROOT/artifacts/chatgpt/backups/create-election-ui-$STAMP"
TMP="$ROOT/artifacts/chatgpt/staging/create-election-ui-$STAMP.mjs"

fail() {
  echo
  echo "CREATE_ELECTION_UI_PATCH=FAILED"
  echo "$1"
  exit 1
}

echo "============================================================"
echo "VOTECHAIN — CREATE ELECTION UI PATCH"
echo "============================================================"
echo "ROOT=$ROOT"
echo
echo "FILES_TO_UPDATE:"
echo "  votechain-frontend-ts/src/services/api.ts"
echo "  votechain-frontend-ts/src/components/Admin/ElectionStatus.tsx"
echo "  votechain-frontend-ts/src/components/Layout/AdminNavigation.tsx"
echo
echo "BACKEND_CHANGED=NO"
echo "CONTRACT_CHANGED=NO"
echo "CRYPTO_CHANGED=NO"
echo "BENCHMARK_CHANGED=NO"
echo "RESULT_FILES_CHANGED=NO"
echo "HARDCODED_ELECTION_ID=NO"
echo "============================================================"

[[ -f "$API" ]] || fail "Missing $API"
[[ -f "$STATUS" ]] || fail "Missing $STATUS"
[[ -f "$ADMIN_NAV" ]] || fail "Missing $ADMIN_NAV"
command -v node >/dev/null 2>&1 || fail "node was not found"

mkdir -p "$BACKUP" "$(dirname "$TMP")"

cp "$API" "$BACKUP/api.ts"
cp "$STATUS" "$BACKUP/ElectionStatus.tsx"
cp "$ADMIN_NAV" "$BACKUP/AdminNavigation.tsx"

echo
echo "BACKUP=$BACKUP"
echo "BACKUP_CREATED=YES"

cat > "$TMP" <<'NODE'
import fs from "node:fs"

const [apiPath, statusPath, adminNavPath] =
  process.argv.slice(2)

function replaceOnce(text, from, to, label) {
  const count =
    text.split(from).length - 1

  if (count !== 1) {
    throw new Error(
      `${label}: expected exactly one match, found ${count}`
    )
  }

  return text.replace(from, to)
}

const apiRaw =
  fs.readFileSync(apiPath, "utf8")

const statusRaw =
  fs.readFileSync(statusPath, "utf8")

const adminNavRaw =
  fs.readFileSync(adminNavPath, "utf8")

const apiEol =
  apiRaw.includes("\r\n")
    ? "\r\n"
    : "\n"

const statusEol =
  statusRaw.includes("\r\n")
    ? "\r\n"
    : "\n"

const adminNavEol =
  adminNavRaw.includes("\r\n")
    ? "\r\n"
    : "\n"

let api =
  apiRaw.replace(/\r\n/g, "\n")

let status =
  statusRaw.replace(/\r\n/g, "\n")

let adminNav =
  adminNavRaw.replace(/\r\n/g, "\n")

if (
  api.includes(
    "export async function createElection()"
  )
) {
  throw new Error(
    "api.ts already contains createElection(); refusing duplicate patch"
  )
}

if (
  status.includes(
    "const runCreate ="
  )
) {
  throw new Error(
    "ElectionStatus.tsx already contains runCreate; refusing duplicate patch"
  )
}

/* --------------------------------------------------------- */
/* api.ts                                                    */
/* --------------------------------------------------------- */

api = replaceOnce(
  api,
  `export interface CurrentElectionLifecycle {\n`,
  `export interface CreatedElection {
  electionId: string
  status: "registration"
  chainId: string
  createdAt: string
}

export async function createElection() {
  return request<CreatedElection>(
    "/api/elections",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  )
}

export interface CurrentElectionLifecycle {
`,
  "insert createElection API"
)

/* --------------------------------------------------------- */
/* ElectionStatus.tsx                                        */
/* --------------------------------------------------------- */

status = replaceOnce(
  status,
  `import {
  useContract,
} from "@/hooks/useContract"
`,
  `import {
  useContract,
} from "@/hooks/useContract"

import {
  useWallet,
} from "@/components/ui/wallet-provider"
`,
  "import useWallet"
)

status = replaceOnce(
  status,
  `import {
  endCurrentElection,
`,
  `import {
  createElection,
  endCurrentElection,
`,
  "import createElection"
)

status = replaceOnce(
  status,
  `type LifecycleAction =
  | "start"
`,
  `type LifecycleAction =
  | "create"
  | "start"
`,
  "add create lifecycle action"
)

status = replaceOnce(
  status,
  `  const {
    isAdmin,
    isInitialized,
    isLoading:
      contractLoading,
  } =
    useContract()
`,
  `  const {
    isAdmin,
    isInitialized,
    isLoading:
      contractLoading,
  } =
    useContract()

  const {
    isConnected,
  } =
    useWallet()
`,
  "read wallet connection state"
)

status = replaceOnce(
  status,
  `

  const runStart =
`,
  `

  const runCreate =
    async () => {
      if (election) {
        return
      }

      if (!isConnected) {
        toast({
          title:
            "Admin wallet required",

          description:
            "Connect the Election Commission wallet before creating an election.",

          variant:
            "destructive",
        })

        return
      }

      const confirmed =
        window.confirm(
          "Create a new election in Registration state?",
        )

      if (!confirmed) {
        return
      }

      setAction(
        "create",
      )

      try {
        const created =
          await createElection()

        toast({
          title:
            "Election Created",

          description:
            "Election " +
            created.electionId +
            " is now in Registration state.",
        })

        await refresh()
      } catch (
        actionError
      ) {
        toast({
          title:
            "Create Election failed",

          description:
            actionError
              instanceof Error
              ? actionError.message
              : "Could not create a new election",

          variant:
            "destructive",
        })
      } finally {
        setAction(
          null,
        )
      }
    }


  const runStart =
`,
  "insert runCreate"
)

status = replaceOnce(
  status,
  `  if (
    !isInitialized ||
    loading ||
    contractLoading
  ) {
`,
  `  if (
    loading ||
    contractLoading
  ) {
`,
  "allow lifecycle page before registration contract deployment"
)

status = replaceOnce(
  status,
  `          <CardContent>
            No election record is available.
          </CardContent>
`,
  `          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No election record is available. Create the next election to open Registration.
            </p>

            {!isConnected && (
              <Alert>
                <AlertDescription>
                  Connect the Election Commission wallet to create an election.
                </AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              onClick={
                runCreate
              }
              disabled={
                !isConnected ||
                action ===
                  "create"
              }
            >
              {
                action ===
                  "create"
                  ? "Creating Election..."
                  : "Create Election"
              }
            </Button>

            <p className="text-xs text-muted-foreground">
              The backend verifies the connected administrator wallet before creating the election.
            </p>
          </CardContent>
`,
  "replace empty election view"
)

status = replaceOnce(
  status,
  `          {
            election.status ===
              "registration" &&
            !transcriptReady &&
`,
  `          {
            election.status ===
              "registration" &&
            !isInitialized &&
            (
              <Alert>
                <AlertDescription>
                  The registration contract is not initialized at the configured address yet. Deploy and synchronize the election-scoped registration contract before registering candidates or voters.
                </AlertDescription>
              </Alert>
            )
          }

          {
            election.status ===
              "registration" &&
            !transcriptReady &&
`,
  "add undeployed registration-contract guidance"
)

/* --------------------------------------------------------- */
/* AdminNavigation.tsx                                       */
/* --------------------------------------------------------- */

adminNav = replaceOnce(
  adminNav,
  `  {
    title: "Election Status",
    href: "/admin/status",
    icon: BarChart,
    requiresConnection: true,
    requiresAdmin: true,
  },
`,
  `  {
    title: "Election Status",
    href: "/admin/status",
    icon: BarChart,
    requiresConnection: true,
    /*
     * This route must remain reachable before the registration
     * contract exists. Mutations are still enforced by the
     * backend's signed administrator challenge.
     */
    requiresAdmin: false,
  },
`,
  "allow pre-deployment election lifecycle navigation"
)

fs.writeFileSync(
  apiPath,
  api.replace(/\n/g, apiEol)
)

fs.writeFileSync(
  statusPath,
  status.replace(/\n/g, statusEol)
)

fs.writeFileSync(
  adminNavPath,
  adminNav.replace(/\n/g, adminNavEol)
)
NODE

rollback() {
  cp "$BACKUP/api.ts" "$API"
  cp "$BACKUP/ElectionStatus.tsx" "$STATUS"
  cp "$BACKUP/AdminNavigation.tsx" "$ADMIN_NAV"
}

echo
echo "===== APPLY SOURCE PATCH ====="

if ! node \
  "$TMP" \
  "$API" \
  "$STATUS" \
  "$ADMIN_NAV"
then
  rollback
  rm -f "$TMP"

  fail \
    "Source transform failed; original files restored"
fi

rm -f "$TMP"

echo "SOURCE_PATCH=PASS"

echo
echo "===== PATCHED FILES ====="
printf '%s\n' \
  "votechain-frontend-ts/src/services/api.ts" \
  "votechain-frontend-ts/src/components/Admin/ElectionStatus.tsx" \
  "votechain-frontend-ts/src/components/Layout/AdminNavigation.tsx"

echo
echo "===== FRONTEND BUILD ====="

if [[ ! -f "$FRONTEND/package.json" ]]; then
  rollback

  fail \
    "Frontend package.json not found; source restored"
fi

if (
  cd "$FRONTEND"
  npm run build
); then
  echo "FRONTEND_BUILD=PASS"
else
  echo "FRONTEND_BUILD=FAILED"
  echo "Rolling back patched source..."

  rollback

  echo "SOURCE_ROLLBACK=PASS"
  exit 1
fi

cd "$ROOT"

echo
echo "===== SOURCE DIFF ====="

if command -v git >/dev/null 2>&1 &&
  git -C "$ROOT" \
    rev-parse \
    --is-inside-work-tree \
    >/dev/null 2>&1
then
  git -C "$ROOT" diff -- \
    votechain-frontend-ts/src/services/api.ts \
    votechain-frontend-ts/src/components/Admin/ElectionStatus.tsx \
    votechain-frontend-ts/src/components/Layout/AdminNavigation.tsx
else
  echo "GIT_DIFF=SKIPPED"
fi

echo
echo "============================================================"
echo "CREATE_ELECTION_UI_PATCH=PASS"
echo "BACKEND_CHANGED=NO"
echo "CONTRACT_CHANGED=NO"
echo "CRYPTO_CHANGED=NO"
echo "BENCHMARK_CHANGED=NO"
echo "RESULT_FILES_CHANGED=NO"
echo "HARDCODED_ELECTION_ID=NO"
echo
echo "NEXT:"
echo "Start backend/frontend."
echo "Open /admin/status."
echo "Connect the Election Commission wallet."
echo "Click Create Election."
echo "============================================================"
