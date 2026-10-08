import test from "node:test"
import assert from "node:assert/strict"
import {
  readFile,
} from "node:fs/promises"


async function source(
  relative,
) {
  return readFile(
    new URL(
      "../" + relative,
      import.meta.url,
    ),
    "utf8",
  )
}


test(
  "runtime pointer model has no automatic secondary index or collection creation",
  async () => {
    const model =
      await import(
        "../models/ElectionRuntimeState.js"
      )

    assert.equal(
      model.default
        .schema
        .options
        .autoCreate,
      false,
    )

    assert.equal(
      model.default
        .schema
        .options
        .autoIndex,
      false,
    )

    assert.equal(
      model.default
        .schema
        .indexes()
        .length,
      0,
    )

    assert.equal(
      model.default
        .schema
        .path(
          "currentElection",
        )
        .options
        .ref,
      "Election",
    )
  },
)


test(
  "runtime resolver has explicit pointer mode and legacy fallback",
  async () => {
    const text =
      await source(
        "services/elections/electionRuntimeService.js",
      )

    assert.match(
      text,
      /mode:\s*"pointer"/,
    )

    assert.match(
      text,
      /mode:\s*"legacy"/,
    )

    assert.match(
      text,
      /lifecycleSlot:\s*"current"/,
    )

    assert.match(
      text,
      /if \(state\)[\s\S]*?!state\.currentElection/,
    )
  },
)


test(
  "lifecycle creation uses runtime pointer when migration mode is enabled",
  async () => {
    const text =
      await source(
        "services/elections/electionLifecycleService.js",
      )

    assert.match(
      text,
      /runtimePointerModeEnabled/,
    )

    assert.match(
      text,
      /claimRuntimeElection/,
    )

    assert.match(
      text,
      /if \(!pointerMode\)[\s\S]*?payload\.lifecycleSlot/,
    )
  },
)


test(
  "runtime consumers do not directly select lifecycleSlot",
  async () => {
    const files = [
      "services/admin/adminAuthorityService.js",
      "services/elections/electionTrusteeService.js",
      "utils/wp5Contract.js",
      "scripts/check-active-election.mjs",
      "scripts/local-election-finalize.mjs",
      "scripts/reanchor-local-registration.mjs",
      "services/registration/registrationReceiptService.js",
      "services/elections/electionSnapshotService.js",
      "services/elections/electionStartService.js",
      "services/elections/electionCandidateService.js",
      "services/elections/electionMembershipService.js",
      "services/elections/electionFinalizationService.js",
      "controllers/electionController.js",
      "scripts/local-election-admin.mjs",
    ]

    for (
      const file
      of files
    ) {
      const text =
        await source(
          file,
        )

      assert.doesNotMatch(
        text,
        /lifecycleSlot\s*:/,
        file,
      )
    }
  },
)


test(
  "reconciliation keeps legacy compatibility but supports pointer release",
  async () => {
    const text =
      await source(
        "services/elections/electionReconciliationService.js",
      )

    assert.match(
      text,
      /getRuntimeElectionContext/,
    )

    assert.match(
      text,
      /clearRuntimeElectionIfMatches/,
    )

    assert.match(
      text,
      /runtimeMode ===[\s\S]*?"pointer"/,
    )
  },
)


test(
  "registration reanchor candidates are election scoped",
  async () => {
    const text =
      await source(
        "scripts/reanchor-local-registration.mjs",
      )

    assert.match(
      text,
      /Candidate[\s\S]*?\.find\(\{[\s\S]*?electionId:[\s\S]*?election\.electionId/,
    )
  },
)


test(
  "snapshot still uses the unchanged candidate manifest function",
  async () => {
    const text =
      await source(
        "services/elections/electionSnapshotService.js",
      )

    assert.match(
      text,
      /hashCandidateManifest\(/,
    )
  },
)
