import {
  readFile,
  writeFile,
} from "node:fs/promises"

import {
  Contract,
  ContractFactory,
  JsonRpcProvider,
  NonceManager,
  Wallet,
} from "ethers"

function hexBytecode(
  artifact,
) {
  const object =
    artifact
      ?.bytecode
      ?.object

  if (
    typeof object !==
      "string" ||
    object.length === 0
  ) {
    throw new Error(
      "artifact bytecode missing",
    )
  }

  return object.startsWith(
    "0x",
  )
    ? object
    : `0x${object}`
}

async function json(
  file,
) {
  return JSON.parse(
    await readFile(
      file,
      "utf8",
    ),
  )
}

async function save(
  file,
  value,
) {
  await writeFile(
    file,
    JSON.stringify(
      value,
      null,
      2,
    ) + "\n",
    "utf8",
  )
}

function sameCiphertext(
  actual,
  expected,
) {
  return (
    String(
      actual.R[0],
    ) ===
      String(
        expected.R[0],
      ) &&
    String(
      actual.R[1],
    ) ===
      String(
        expected.R[1],
      ) &&
    String(
      actual.S[0],
    ) ===
      String(
        expected.S[0],
      ) &&
    String(
      actual.S[1],
    ) ===
      String(
        expected.S[1],
      )
  )
}

const [
  ,
  ,
  command,
  rpc,
  privateKey,
  directArtifactFile,
  ...rest
] = process.argv

if (
  !command ||
  !rpc ||
  !privateKey ||
  !directArtifactFile
) {
  throw new Error(
    "invalid WP6B onchain arguments",
  )
}

const provider =
  new JsonRpcProvider(
    rpc,
  )

const wallet =
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

const directArtifact =
  await json(
    directArtifactFile,
  )

if (
  command ===
    "setup"
) {
  const [
    mockArtifactFile,
    dkgFile,
    ballotsFile,
    outFile,
  ] = rest

  const mockArtifact =
    await json(
      mockArtifactFile,
    )

  const dkg =
    await json(
      dkgFile,
    )

  const ballots =
    await json(
      ballotsFile,
    )

  const mockFactory =
    new ContractFactory(
      mockArtifact.abi,
      hexBytecode(
        mockArtifact,
      ),
      signer,
    )

  const verifier =
    await mockFactory.deploy()

  await verifier
    .waitForDeployment()

  const directFactory =
    new ContractFactory(
      directArtifact.abi,
      hexBytecode(
        directArtifact,
      ),
      signer,
    )

  const direct =
    await directFactory.deploy(
      await verifier
        .getAddress(),
    )

  await direct
    .waitForDeployment()

  const electionId =
    202610010006n

  const publicKey =
    dkg
      .transcript
      .publicKey

  let tx =
    await direct.configure({
      eligibleRoot:
        111111n,

      electionId,

      candidateManifestHash:
        222222n,

      candidateCount:
        BigInt(
          ballots
            .candidateCount,
        ),

      contractDomain:
        333333n,

      Yx:
        BigInt(
          publicKey[0],
        ),

      Yy:
        BigInt(
          publicKey[1],
        ),

      electionContextHash:
        444444n,
    })

  await tx.wait()

  tx =
    await direct
      .setTrusteeTranscriptHash(
        `0x${dkg.transcriptHash}`,
      )

  await tx.wait()

  tx =
    await direct.activate()

  await tx.wait()

  const castGas = []

  for (
    let i = 0;
    i <
      ballots
        .ballots
        .length;
    i++
  ) {
    const ballot =
      ballots
        .ballots[i]

    tx =
      await direct.castVote(
        [
          0n,
          0n,
        ],
        [
          [
            0n,
            0n,
          ],
          [
            0n,
            0n,
          ],
        ],
        [
          0n,
          0n,
        ],
        BigInt(
          100000 +
          i,
        ),
        ballot.rx,
        ballot.ry,
        ballot.sx,
        ballot.sy,
      )

    const receipt =
      await tx.wait()

    castGas.push(
      receipt
        .gasUsed
        .toString(),
    )
  }

  tx =
    await direct
      .endElection()

  await tx.wait()

  const aggregateCiphertexts =
    []

  for (
    let slot = 0;
    slot < 16;
    slot++
  ) {
    const tally =
      await direct
        .getTally(
          slot,
        )

    aggregateCiphertexts.push({
      R: [
        tally[0]
          .toString(),

        tally[1]
          .toString(),
      ],

      S: [
        tally[2]
          .toString(),

        tally[3]
          .toString(),
      ],
    })
  }

  for (
    let slot = 0;
    slot < 16;
    slot++
  ) {
    if (
      !sameCiphertext(
        aggregateCiphertexts[
          slot
        ],
        ballots
          .expectedAggregateCiphertexts[
            slot
          ],
      )
    ) {
      throw new Error(
        `onchain/local encrypted aggregate mismatch at slot ${slot}`,
      )
    }
  }

  const result = {
    status:
      "PASS_WP6B_ONCHAIN_ENCRYPTED_TALLY_SETUP",

    rpc,

    chainId:
      Number(
        (
          await provider
            .getNetwork()
        ).chainId,
      ),

    admin:
      wallet.address,

    verifierAddress:
      await verifier
        .getAddress(),

    contractAddress:
      await direct
        .getAddress(),

    verifierClassification:
      "WP6B_RESEARCH_MOCK_ALWAYS_TRUE",

    electionId:
      electionId
        .toString(),

    candidateCount:
      Number(
        await direct
          .candidateCount(),
      ),

    acceptedBallotCount:
      Number(
        await direct
          .acceptedBallotCount(),
      ),

    phase:
      Number(
        await direct
          .phase(),
      ),

    dkgTranscriptHash:
      dkg.transcriptHash,

    publicKey,

    expectedTotals:
      ballots
        .expectedTotals,

    aggregateCiphertexts,

    localAggregateMatch:
      true,

    castGas,
  }

  if (
    result.phase !== 2
  ) {
    throw new Error(
      "contract did not reach Ended",
    )
  }

  await save(
    outFile,
    result,
  )

  console.log(
    "WP6B_ONCHAIN_SETUP=PASS",
  )

  console.log(
    `DIRECT_ADDRESS=${result.contractAddress}`,
  )

  console.log(
    `ACCEPTED_BALLOT_COUNT=${result.acceptedBallotCount}`,
  )

  console.log(
    "ONCHAIN_LOCAL_ENCRYPTED_TALLY_MATCH=PASS",
  )

  process.exit(0)
}

if (
  command ===
    "finalize"
) {
  const [
    aggregateFile,
    dkgFile,
    transcriptFile,
    verifiedFile,
    outFile,
  ] = rest

  const aggregate =
    await json(
      aggregateFile,
    )

  const dkg =
    await json(
      dkgFile,
    )

  const transcript =
    await json(
      transcriptFile,
    )

  const verified =
    await json(
      verifiedFile,
    )

  if (
    verified.status !==
      "PASS_WP6_FINALIZATION_TRANSCRIPT_VERIFY"
  ) {
    throw new Error(
      "finalization transcript not independently verified",
    )
  }

  if (
    transcript.dkgTranscriptHash !==
      dkg.transcriptHash ||
    aggregate.dkgTranscriptHash !==
      dkg.transcriptHash
  ) {
    throw new Error(
      "DKG transcript binding mismatch",
    )
  }

  const direct =
    new Contract(
      aggregate
        .contractAddress,
      directArtifact.abi,
      signer,
    )

  const phaseBefore =
    Number(
      await direct
        .phase(),
    )

  if (
    phaseBefore !== 2
  ) {
    throw new Error(
      "contract is not Ended before finalization",
    )
  }

  const contractYx =
    (
      await direct
        .Yx()
    )
      .toString()

  const contractYy =
    (
      await direct
        .Yy()
    )
      .toString()

  if (
    contractYx !==
      String(
        dkg
          .transcript
          .publicKey[0],
      ) ||
    contractYy !==
      String(
        dkg
          .transcript
          .publicKey[1],
      )
  ) {
    throw new Error(
      "contract election public key does not match DKG transcript",
    )
  }

  const pinnedDkgHash =
    (
      await direct
        .trusteeTranscriptHash()
    )
      .toLowerCase()

  if (
    pinnedDkgHash !==
      `0x${dkg.transcriptHash}`
        .toLowerCase()
  ) {
    throw new Error(
      "contract DKG transcript pin mismatch",
    )
  }

  const accepted =
    Number(
      await direct
        .acceptedBallotCount(),
    )

  if (
    accepted !==
      Number(
        transcript
          .acceptedBallotCount,
      )
  ) {
    throw new Error(
      "accepted ballot count mismatch",
    )
  }

  const candidateCount =
    Number(
      await direct
        .candidateCount(),
    )

  if (
    candidateCount !==
      Number(
        transcript
          .candidateCount,
      )
  ) {
    throw new Error(
      "candidate count mismatch",
    )
  }

  const expectedTotals =
    aggregate
      .expectedTotals

  if (
    JSON.stringify(
      verified
        .totals,
    ) !==
      JSON.stringify(
        expectedTotals,
      )
  ) {
    throw new Error(
      "verified threshold totals do not match synthetic truth",
    )
  }

  const tx =
    await direct
      .finalizeTally(
        verified
          .totals
          .map(
            value =>
              BigInt(
                value,
              ),
          ),

        `0x${verified.transcriptHash}`,
      )

  const receipt =
    await tx.wait()

  const phaseAfter =
    Number(
      await direct
        .phase(),
    )

  if (
    phaseAfter !== 3
  ) {
    throw new Error(
      "contract did not reach Finalized",
    )
  }

  const storedFinalHash =
    (
      await direct
        .finalizationTranscriptHash()
    )
      .toLowerCase()

  if (
    storedFinalHash !==
      `0x${verified.transcriptHash}`
        .toLowerCase()
  ) {
    throw new Error(
      "stored finalization transcript hash mismatch",
    )
  }

  const activeResults =
    []

  for (
    let slot = 0;
    slot <
      candidateCount;
    slot++
  ) {
    activeResults.push(
      Number(
        await direct
          .getFinalResult(
            slot,
          ),
      ),
    )
  }

  const expectedActive =
    expectedTotals.slice(
      0,
      candidateCount,
    )

  if (
    JSON.stringify(
      activeResults,
    ) !==
      JSON.stringify(
        expectedActive,
      )
  ) {
    throw new Error(
      "onchain final result mismatch",
    )
  }

  let duplicateRejected =
    false

  try {
    await direct
      .finalizeTally(
        verified
          .totals
          .map(
            value =>
              BigInt(
                value,
              ),
          ),

        `0x${verified.transcriptHash}`,
      )
  } catch {
    duplicateRejected =
      true
  }

  if (
    !duplicateRejected
  ) {
    throw new Error(
      "duplicate finalization was accepted",
    )
  }

  const result = {
    status:
      "PASS_WP6B_ONCHAIN_FINALIZATION",

    contractAddress:
      aggregate
        .contractAddress,

    phaseBefore,
    phaseAfter,

    dkgPublicKeyMatch:
      true,

    dkgTranscriptPinMatch:
      true,

    finalizationTranscriptHash:
      verified
        .transcriptHash,

    storedFinalizationTranscriptHash:
      storedFinalHash,

    verifiedTotals:
      verified
        .totals,

    activeResults,

    finalizeGas:
      receipt
        .gasUsed
        .toString(),

    duplicateFinalizationRejected:
      true,
  }

  await save(
    outFile,
    result,
  )

  console.log(
    "WP6B_ONCHAIN_FINALIZATION=PASS",
  )

  console.log(
    "ONCHAIN_DKG_PUBLIC_KEY_MATCH=PASS",
  )

  console.log(
    "ONCHAIN_DKG_TRANSCRIPT_PIN_MATCH=PASS",
  )

  console.log(
    "ONCHAIN_FINAL_RESULTS_MATCH=PASS",
  )

  console.log(
    "ONCHAIN_FINALIZATION_HASH_MATCH=PASS",
  )

  console.log(
    "DUPLICATE_FINALIZATION_REJECTED=PASS",
  )

  console.log(
    `FINALIZE_GAS=${result.finalizeGas}`,
  )

  process.exit(0)
}

throw new Error(
  `unknown WP6B onchain command: ${command}`,
)
