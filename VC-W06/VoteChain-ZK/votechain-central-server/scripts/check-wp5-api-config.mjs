const base =
  (
    process.env
      .VOTECHAIN_API_BASE_URL ||
    "http://127.0.0.1:5000"
  )
    .replace(
      /\/$/,
      "",
    )


async function json(
  path,
) {
  const response =
    await fetch(
      base +
      path,
    )

  const body =
    await response.json()

  if (
    !response.ok ||
    body?.success === false
  ) {
    throw new Error(
      `${path} failed: HTTP ${response.status} ${body?.message || ""}`,
    )
  }

  return body.data
}


const [
  election,
  wp5,
] =
  await Promise.all([
    json(
      "/api/elections/current",
    ),

    json(
      "/api/wp5/config",
    ),
  ])


if (!election) {
  throw new Error(
    "No current election returned by API",
  )
}


console.log(
  `CURRENT_DIRECT=${election.directContractAddress}`,
)

console.log(
  `WP5_CONFIG_DIRECT=${wp5.directContractAddress}`,
)


const addressMatch =
  String(
    election
      .directContractAddress,
  )
    .toLowerCase() ===
  String(
    wp5
      .directContractAddress,
  )
    .toLowerCase()


const electionMatch =
  BigInt(
    election.electionId,
  ) ===
  BigInt(
    wp5
      .config
      .electionId,
  )


const rootMatch =
  BigInt(
    election.eligibleRoot,
  ) ===
  BigInt(
    wp5
      .config
      .eligibleRoot,
  )


const manifestMatch =
  BigInt(
    election
      .candidateManifestHash,
  ) ===
  BigInt(
    wp5
      .config
      .candidateManifestHash,
  )


console.log(
  `DIRECT_ADDRESS_MATCH=${addressMatch ? "PASS" : "FAIL"}`,
)

console.log(
  `ELECTION_ID_MATCH=${electionMatch ? "PASS" : "FAIL"}`,
)

console.log(
  `ROOT_MATCH=${rootMatch ? "PASS" : "FAIL"}`,
)

console.log(
  `MANIFEST_MATCH=${manifestMatch ? "PASS" : "FAIL"}`,
)

console.log(
  `WP5_PHASE=${wp5.phase}`,
)

console.log(
  `WP5_CONFIGURED=${wp5.configured}`,
)

console.log(
  `WP5_CANDIDATE_COUNT=${wp5.candidates.length}`,
)


if (
  !addressMatch ||
  !electionMatch ||
  !rootMatch ||
  !manifestMatch
) {
  process.exit(1)
}


console.log(
  "WP5_API_CONFIG_CHECK=PASS",
)
