const modules = [
  "../utils/wp5Contract.js",
  "../services/elections/electionTrusteeService.js",
  "../services/elections/electionChainService.js",
  "../services/elections/electionStartService.js",
  "../services/elections/electionSnapshotService.js",
  "../services/elections/electionMembershipService.js",
  "../services/elections/electionCandidateService.js",
  "../services/zk/wp5PrivacyService.js",
  "../controllers/electionController.js",
  "../routes/electionRoutes.js",
]

for (
  const path
  of modules
) {
  try {
    await import(path)

    console.log(
      "IMPORT_OK",
      path,
    )
  } catch (error) {
    console.error(
      "IMPORT_FAIL",
      path,
    )

    console.error(
      error?.stack ||
      error?.message ||
      String(error),
    )

    process.exit(1)
  }
}

console.log(
  "RUNTIME_IMPORT_SMOKE=PASS",
)
