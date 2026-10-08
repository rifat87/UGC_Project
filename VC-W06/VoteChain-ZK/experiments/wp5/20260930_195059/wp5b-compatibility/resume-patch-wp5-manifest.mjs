import fs from "node:fs"

const servicePath =
  process.argv[2]

if (!servicePath) {
  throw new Error(
    "wp5PrivacyService path missing",
  )
}

let source =
  fs.readFileSync(
    servicePath,
    "utf8",
  )

/*
 * Load the new application-level compatibility profile.
 */
if (
  !source.includes(
    "const appProfile = JSON.parse(",
  )
) {
  const anchor = `const profile = JSON.parse(
  fs.readFileSync(
    new URL('../../../crypto/config/wp3-build-profile.json', import.meta.url),
    'utf8',
  ),
)
`

  if (!source.includes(anchor)) {
    throw new Error(
      "WP3 profile-load anchor not found",
    )
  }

  source =
    source.replace(
      anchor,
      anchor + `
const appProfile = JSON.parse(
  fs.readFileSync(
    new URL('../../../crypto/config/wp5-application-profile.json', import.meta.url),
    'utf8',
  ),
)
`,
    )
}

/*
 * Freeze algorithm choice from one authoritative profile.
 */
if (
  !source.includes(
    "const WP5_MANIFEST_ALGORITHM =",
  )
) {
  const anchor =
    "const D_MANIFEST = BigInt(profile.domains.candidateManifest)\n"

  if (!source.includes(anchor)) {
    throw new Error(
      "D_MANIFEST anchor not found",
    )
  }

  source =
    source.replace(
      anchor,
      anchor +
      "const WP5_MANIFEST_ALGORITHM = appProfile.candidateManifest.algorithm\n",
    )
}

/*
 * Replace the Phase-A rolling construction.
 *
 * The K16-safe construction is:
 *
 * state0 = Poseidon(D_MANIFEST, candidateCount)
 * state(i+1) = Poseidon(state(i), i, candidateId[i])
 *
 * The alternative historical one-shot construction remains supported
 * only if a future authoritative profile explicitly selects it.
 */
if (
  !source.includes(
    "Unsupported WP5 candidate-manifest algorithm",
  )
) {
  const pattern =
    /export async function hashCandidateManifest\(candidateIds\) \{[\s\S]*?\n\}\n\nexport async function getRegisteredWp5Candidates/

  const matches =
    source.match(pattern)

  if (!matches) {
    throw new Error(
      "hashCandidateManifest block not found",
    )
  }

  const replacement = `export async function hashCandidateManifest(candidateIds) {
  const ids = candidateIds.map(
    (candidateId) => BigInt(candidateId),
  )

  if (
    ids.length < 1 ||
    ids.length > Number(profile.maxCandidates)
  ) {
    throw new Error(
      'Candidate manifest length is outside the frozen WP5 range',
    )
  }

  if (
    WP5_MANIFEST_ALGORITHM ===
    'POSEIDON_DOMAIN_PLUS_IDS_V1'
  ) {
    return wp5Hash([
      D_MANIFEST,
      ...ids,
    ])
  }

  if (
    WP5_MANIFEST_ALGORITHM ===
    'POSEIDON_INDEXED_CHAIN_V1'
  ) {
    let state = await wp5Hash([
      D_MANIFEST,
      BigInt(ids.length),
    ])

    for (
      let index = 0;
      index < ids.length;
      index += 1
    ) {
      state = await wp5Hash([
        state,
        BigInt(index),
        ids[index],
      ])
    }

    return state
  }

  throw new Error(
    \`Unsupported WP5 candidate-manifest algorithm: \${WP5_MANIFEST_ALGORITHM}\`,
  )
}

export async function getRegisteredWp5Candidates`

  source =
    source.replace(
      pattern,
      replacement,
    )
}

/*
 * Public config must disclose which canonicalization convention
 * produced candidateManifestHash.
 */
source =
  source.replace(
    /manifestAlgorithm:\s*['"]ROLLING_POSEIDON_V1['"]/,
    "manifestAlgorithm: WP5_MANIFEST_ALGORITHM",
  )

fs.writeFileSync(
  servicePath,
  source,
)

console.log(
  "WP5_MANIFEST_BACKEND_PATCH=PASS",
)
