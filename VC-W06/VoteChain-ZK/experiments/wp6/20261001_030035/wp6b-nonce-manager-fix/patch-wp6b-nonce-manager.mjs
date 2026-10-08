import fs from "node:fs"

const file =
  process.argv[2]

let source =
  fs.readFileSync(
    file,
    "utf8",
  )

/*
 * 1. Add ethers v6 NonceManager to the generated harness import.
 */
if (
  !source.includes(
    "NonceManager,"
  )
) {
  const importAnchor =
`  JsonRpcProvider,
  Wallet,
} from "ethers"
`

  const importReplacement =
`  JsonRpcProvider,
  NonceManager,
  Wallet,
} from "ethers"
`

  if (
    !source.includes(
      importAnchor,
    )
  ) {
    throw new Error(
      "Cannot locate ethers import block in WP6B master script",
    )
  }

  source =
    source.replace(
      importAnchor,
      importReplacement,
    )

  console.log(
    "NONCE_MANAGER_IMPORT=PATCHED",
  )
} else {
  console.log(
    "NONCE_MANAGER_IMPORT=ALREADY_PRESENT",
  )
}

/*
 * 2. Wrap the raw Wallet with NonceManager.
 */
if (
  !source.includes(
    "new NonceManager("
  )
) {
  const walletAnchor =
`const wallet =
  new Wallet(
    privateKey,
    provider,
  )

`

  const walletReplacement =
`const wallet =
  new Wallet(
    privateKey,
    provider,
  )

/*
 * Anvil automines faster than provider nonce caching can reliably
 * refresh between sequential transactions. NonceManager maintains
 * the sender nonce locally after each successful submission.
 */
const signer =
  new NonceManager(
    wallet,
  )

`

  if (
    !source.includes(
      walletAnchor,
    )
  ) {
    throw new Error(
      "Cannot locate raw Wallet initialization block",
    )
  }

  source =
    source.replace(
      walletAnchor,
      walletReplacement,
    )

  console.log(
    "NONCE_MANAGER_SIGNER=PATCHED",
  )
} else {
  console.log(
    "NONCE_MANAGER_SIGNER=ALREADY_PRESENT",
  )
}

/*
 * 3. ContractFactory and Contract transactions must use the managed signer.
 *
 * The generated WP6B onchain harness has exactly three signer constructor
 * positions:
 *   - mock verifier ContractFactory
 *   - VoteChainDirect ContractFactory
 *   - VoteChainDirect finalization Contract
 */
const rawPattern =
`\n      wallet,\n    )`

const managedPattern =
`\n      signer,\n    )`

const rawCount =
  source.split(
    rawPattern,
  ).length - 1

const managedCountBefore =
  source.split(
    managedPattern,
  ).length - 1

if (
  rawCount > 0
) {
  if (
    rawCount !== 3
  ) {
    throw new Error(
      `Expected exactly 3 raw Wallet signer uses; found ${rawCount}`,
    )
  }

  source =
    source.split(
      rawPattern,
    ).join(
      managedPattern,
    )

  console.log(
    "MANAGED_SIGNER_USES_PATCHED=3",
  )
} else if (
  managedCountBefore === 3
) {
  console.log(
    "MANAGED_SIGNER_USES=ALREADY_PATCHED",
  )
} else {
  throw new Error(
    `Unexpected signer shape: raw=${rawCount}, managed=${managedCountBefore}`,
  )
}

fs.writeFileSync(
  file,
  source,
)

console.log(
  "WP6B_NONCE_MANAGER_PATCH=PASS",
)
