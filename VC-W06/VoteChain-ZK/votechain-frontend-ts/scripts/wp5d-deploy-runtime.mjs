import fs from "node:fs"
import {
  ContractFactory,
  JsonRpcProvider,
} from "ethers"
import {
  buildBabyjub,
  buildPoseidon,
} from "circomlibjs"

const [
  ,
  ,
  rpcUrl,
  appProfilePath,
  wp3ProfilePath,
  verifierArtifactPath,
  directArtifactPath,
  evidenceFixturePath,
  publicFixturePath,
] = process.argv

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
      (_key, item) =>
        typeof item === "bigint"
          ? item.toString()
          : item,
      2,
    ) + "\n",
  )
}

const appProfile =
  readJson(
    appProfilePath,
  )

const wp3Profile =
  readJson(
    wp3ProfilePath,
  )

if (
  appProfile
    .candidateManifest
    .algorithm !==
  "POSEIDON_INDEXED_CHAIN_V1"
) {
  throw new Error(
    "WP5 indexed manifest freeze missing",
  )
}

const verifierArtifact =
  readJson(
    verifierArtifactPath,
  )

const directArtifact =
  readJson(
    directArtifactPath,
  )

const verifierBytecode =
  verifierArtifact
    .bytecode
    .object

const directBytecode =
  directArtifact
    .bytecode
    .object

if (
  !verifierBytecode ||
  verifierBytecode === "0x"
) {
  throw new Error(
    "Verifier bytecode unavailable",
  )
}

if (
  !directBytecode ||
  directBytecode === "0x"
) {
  throw new Error(
    "VoteChainDirect bytecode unavailable",
  )
}

const provider =
  new JsonRpcProvider(
    rpcUrl,
  )

const signer =
  await provider.getSigner(0)

const signerAddress =
  await signer.getAddress()

const verifierFactory =
  new ContractFactory(
    verifierArtifact.abi,
    verifierBytecode,
    signer,
  )

const verifier =
  await verifierFactory.deploy()

await verifier.waitForDeployment()

const verifierAddress =
  await verifier.getAddress()

const directFactory =
  new ContractFactory(
    directArtifact.abi,
    directBytecode,
    signer,
  )

const direct =
  await directFactory.deploy(
    verifierAddress,
  )

await direct.waitForDeployment()

const contractAddress =
  await direct.getAddress()

const poseidon =
  await buildPoseidon()

const babyjub =
  await buildBabyjub()

const PF =
  poseidon.F

const BF =
  babyjub.F

function H(values) {
  return BigInt(
    PF.toObject(
      poseidon(
        values.map(
          value =>
            BigInt(value),
        ),
      ),
    ),
  )
}

function pointBig(point) {
  return [
    BigInt(
      BF.toObject(
        point[0],
      ),
    ),
    BigInt(
      BF.toObject(
        point[1],
      ),
    ),
  ]
}

const MAX =
  Number(
    appProfile.maxCandidates,
  )

const DEPTH =
  Number(
    appProfile.merkleDepth,
  )

const D_ID =
  BigInt(
    appProfile
      .domains
      .identity,
  )

const D_CTX =
  BigInt(
    appProfile
      .domains
      .electionContext,
  )

const D_MANIFEST =
  BigInt(
    appProfile
      .domains
      .candidateManifest,
  )

/*
 * Synthetic-only voter.
 */
const secret =
  42424242424242n

const identityCommitment =
  H([
    D_ID,
    secret,
  ])

/*
 * Deterministic synthetic Merkle witness.
 *
 * The contract stores only the resulting root.
 * The circuit validates the private witness.
 */
const siblings =
  Array.from(
    {
      length:
        DEPTH,
    },
    (
      _unused,
      index,
    ) =>
      (
        3001n +
        BigInt(index)
      ).toString(),
  )

const pathBits =
  Array.from(
    {
      length:
        DEPTH,
    },
    (
      _unused,
      index,
    ) =>
      String(
        index % 2,
      ),
  )

let root =
  identityCommitment

for (
  let index = 0;
  index < DEPTH;
  index += 1
) {
  const sibling =
    BigInt(
      siblings[index],
    )

  const bit =
    BigInt(
      pathBits[index],
    )

  root =
    bit === 0n
      ? H([
          root,
          sibling,
        ])
      : H([
          sibling,
          root,
        ])
}

/*
 * Candidate list is public metadata.
 * Only the selected candidate remains local.
 */
const candidates = [
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

const candidateIds =
  candidates.map(
    candidate =>
      BigInt(
        candidate.candidateId,
      ),
  )

const candidateCount =
  candidateIds.length

if (
  candidateCount < 1 ||
  candidateCount > MAX
) {
  throw new Error(
    "Synthetic candidate count invalid",
  )
}

/*
 * Frozen WP5 K=16-safe manifest:
 *
 * state0 = Poseidon(D_MANIFEST, candidateCount)
 * state(i+1) = Poseidon(state(i), i, candidateId[i])
 */
let manifest =
  H([
    D_MANIFEST,
    BigInt(
      candidateCount,
    ),
  ])

for (
  let index = 0;
  index < candidateIds.length;
  index += 1
) {
  manifest =
    H([
      manifest,
      BigInt(index),
      candidateIds[index],
    ])
}

const electionId =
  202609300005n

const contractDomain =
  BigInt(
    wp3Profile
      .testContractDomain,
  )

const electionSecretKey =
  123456789n

const Y =
  babyjub
    .mulPointEscalar(
      babyjub.Base8,
      electionSecretKey,
    )

const [
  Yx,
  Yy,
] =
  pointBig(Y)

const context =
  H([
    D_CTX,
    electionId,
    manifest,
    BigInt(
      candidateCount,
    ),
    contractDomain,
    Yx,
    Yy,
  ])

const configTuple = [
  root.toString(),
  electionId.toString(),
  manifest.toString(),
  String(
    candidateCount,
  ),
  contractDomain.toString(),
  Yx.toString(),
  Yy.toString(),
  context.toString(),
]

const configureTx =
  await direct.configure(
    configTuple,
  )

await configureTx.wait()

const activateTx =
  await direct.activate()

await activateTx.wait()

const configured =
  await direct.configured()

const phase =
  await direct.phase()

if (
  configured !== true
) {
  throw new Error(
    "DIRECT contract did not configure",
  )
}

if (
  Number(phase) !== 1
) {
  throw new Error(
    "DIRECT contract did not activate",
  )
}

const publicConfig = {
  profile:
    "VoteChain-ZK-WP5D-Synthetic-v1",

  phase: 1,

  configured: true,

  acceptedBallotCount:
    "0",

  candidates,

  manifestAlgorithm:
    "POSEIDON_INDEXED_CHAIN_V1",

  config: {
    eligibleRoot:
      root.toString(),

    electionId:
      electionId.toString(),

    candidateManifestHash:
      manifest.toString(),

    candidateCount:
      String(
        candidateCount,
      ),

    contractDomain:
      contractDomain.toString(),

    Yx:
      Yx.toString(),

    Yy:
      Yy.toString(),

    electionContextHash:
      context.toString(),
  },
}

const fixture = {
  syntheticOnly: true,

  rpcUrl,

  chainId:
    "31337",

  deployer:
    signerAddress,

  verifierAddress,

  contractAddress,

  selectedCandidateId:
    102,

  secret:
    secret.toString(),

  membership: {
    identityCommitment:
      identityCommitment.toString(),

    index: 0,

    eligibleRoot:
      root.toString(),

    siblings,

    pathBits,
  },

  publicConfig,
}

writeJson(
  evidenceFixturePath,
  fixture,
)

writeJson(
  publicFixturePath,
  fixture,
)

console.log(
  "SYNTHETIC_CONTRACT_DEPLOY=PASS",
)

console.log(
  "SYNTHETIC_CONTRACT_CONFIGURE=PASS",
)

console.log(
  "SYNTHETIC_CONTRACT_ACTIVATE=PASS",
)

console.log(
  `VERIFIER_ADDRESS=${verifierAddress}`,
)

console.log(
  `DIRECT_ADDRESS=${contractAddress}`,
)

console.log(
  `ELIGIBLE_ROOT=${root}`,
)

console.log(
  `CANDIDATE_MANIFEST_HASH=${manifest}`,
)
