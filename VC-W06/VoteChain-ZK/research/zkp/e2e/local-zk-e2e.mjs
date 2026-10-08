import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '../../..')

async function loadModule(modulePath, label) {
  try {
    return await import(modulePath)
  } catch (error) {
    throw new Error(`${label} is unavailable. Run the documented setup first. ${error.message}`)
  }
}

function artifact(name, file) {
  return path.join(root, 'out', file, `${name}.json`)
}

async function readArtifact(name, file) {
  const value = JSON.parse(await fs.readFile(artifact(name, file), 'utf8'))
  const bytecode = value.bytecode?.object || value.bytecode
  if (!bytecode) throw new Error(`Missing deployable bytecode for ${name}`)
  return { abi: value.abi, bytecode: bytecode.startsWith('0x') ? bytecode : `0x${bytecode}` }
}

function normalizeProof(proof) {
  return {
    merkleTreeDepth: Number(proof.merkleTreeDepth),
    merkleTreeRoot: proof.merkleTreeRoot.toString(),
    nullifier: proof.nullifier.toString(),
    message: proof.message.toString(),
    scope: proof.scope.toString(),
    points: proof.points.map((point) => point.toString()),
  }
}

async function expectRevert(action, label) {
  try {
    const tx = await action()
    if (tx?.wait) await tx.wait()
  } catch {
    return true
  }
  throw new Error(`${label} unexpectedly succeeded`)
}

const ethersModule = await loadModule(path.join(root, 'votechain-central-server/node_modules/ethers/lib.esm/index.js'), 'Backend ethers dependency')
const core = await loadModule(path.join(root, '.zk-deps/node_modules/@semaphore-protocol/core/src/index.js'), 'Semaphore V4 runtime')
const { ethers } = ethersModule
const { Identity, Group, generateProof, verifyProof } = core

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545')
const admin = await provider.getSigner(0)
const voteWallet = await provider.getSigner(1)
const electionId = BigInt(process.env.ELECTION_ID || '20260818')

const snarkArtifacts = process.env.ZK_SNARK_WASM && process.env.ZK_SNARK_ZKEY
  ? { wasm: process.env.ZK_SNARK_WASM, zkey: process.env.ZK_SNARK_ZKEY }
  : undefined
if (Boolean(process.env.ZK_SNARK_WASM) !== Boolean(process.env.ZK_SNARK_ZKEY)) {
  throw new Error('ZK_SNARK_WASM and ZK_SNARK_ZKEY must be configured together')
}

const verifierArtifact = await readArtifact('SemaphoreVerifier', 'SemaphoreVerifier.sol')
const semaphoreArtifact = await readArtifact('Semaphore', 'Semaphore.sol')
const votingArtifact = await readArtifact('ZKLocalVoting', 'ZKLocalVoting.sol')

const verifier = await new ethers.ContractFactory(verifierArtifact.abi, verifierArtifact.bytecode, admin).deploy()
await verifier.waitForDeployment()
const semaphore = await new ethers.ContractFactory(semaphoreArtifact.abi, semaphoreArtifact.bytecode, admin).deploy(await verifier.getAddress())
await semaphore.waitForDeployment()
const voting = await new ethers.ContractFactory(votingArtifact.abi, votingArtifact.bytecode, admin).deploy(
  await semaphore.getAddress(),
  electionId,
  7 * 24 * 60 * 60,
)
await voting.waitForDeployment()

const voters = [new Identity(), new Identity(), new Identity()]
const group = new Group()
const gas = {}

for (const candidateId of [1n, 2n]) {
  const receipt = await (await voting.registerCandidate(candidateId)).wait()
  gas[`registerCandidate_${candidateId}`] = receipt.gasUsed.toString()
}
for (let index = 0; index < voters.length; index += 1) {
  const commitment = voters[index].commitment
  const receipt = await (await voting.registerVoterCommitment(commitment)).wait()
  gas[`registerVoterCommitment_${index}`] = receipt.gasUsed.toString()
  group.addMember(commitment)
}

assert.equal((await voting.getGroupSize()).toString(), String(voters.length))
assert.equal((await voting.getGroupRoot()).toString(), group.root.toString(), 'JS group root must equal the official on-chain group root')

const startReceipt = await (await voting.startElection()).wait()
gas.startElection = startReceipt.gasUsed.toString()

async function makeProof(identity, candidateId) {
  const started = performance.now()
  const proof = await generateProof(identity, group, candidateId, electionId, undefined, snarkArtifacts)
  const generationMs = performance.now() - started
  assert.equal(await verifyProof(proof), true)
  return { proof, generationMs }
}

const voterA = await makeProof(voters[0], 1n)
const voterB = await makeProof(voters[1], 2n)

const voteAReceipt = await (await voting.connect(voteWallet).castVote(1n, normalizeProof(voterA.proof))).wait()
const voteBReceipt = await (await voting.connect(voteWallet).castVote(2n, normalizeProof(voterB.proof))).wait()
gas.castVoteVoterA = voteAReceipt.gasUsed.toString()
gas.castVoteVoterB = voteBReceipt.gasUsed.toString()

assert.equal((await voting.getVoteCount(1n)).toString(), '1')
assert.equal((await voting.getVoteCount(2n)).toString(), '1')

const duplicate = await makeProof(voters[0], 2n)
assert.equal(duplicate.proof.nullifier.toString(), voterA.proof.nullifier.toString(), 'same scope must reuse voter A nullifier')
await expectRevert(
  () => voting.connect(voteWallet).castVote(2n, normalizeProof(duplicate.proof)),
  'duplicate nullifier vote',
)

const endReceipt = await (await voting.endElection()).wait()
gas.endElection = endReceipt.gasUsed.toString()
const afterEnd = await makeProof(voters[2], 1n)
await expectRevert(
  () => voting.connect(voteWallet).castVote(1n, normalizeProof(afterEnd.proof)),
  'post-election vote',
)

const result = {
  semaphoreVersion: '4.14.3',
  electionId: electionId.toString(),
  sameVoteWallet: await voteWallet.getAddress(),
  voterAAndBVotedFromSameWallet: true,
  duplicateVoteRejected: true,
  postElectionVoteRejected: true,
  tallyCandidate1: (await voting.getVoteCount(1n)).toString(),
  tallyCandidate2: (await voting.getVoteCount(2n)).toString(),
  proofGenerationMs: {
    voterA: Number(voterA.generationMs.toFixed(3)),
    voterB: Number(voterB.generationMs.toFixed(3)),
  },
  proofJsonBytes: Buffer.byteLength(JSON.stringify(normalizeProof(voterA.proof))),
  gas,
  addresses: {
    semaphoreVerifier: await verifier.getAddress(),
    semaphore: await semaphore.getAddress(),
    zkLocalVoting: await voting.getAddress(),
  },
}

const outputPath = path.join(root, 'research/zkp/logs/local-zk-e2e-result.json')
await fs.mkdir(path.dirname(outputPath), { recursive: true })
await fs.writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result, null, 2))
