import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const corePath = path.resolve(__dirname, '../../../.zk-deps/node_modules/@semaphore-protocol/core/src/index.js')

async function loadRuntime() {
  try {
    return await import(corePath)
  } catch (error) {
    throw new Error(
      `Semaphore V4 runtime is not installed. Run "npm run setup:zk" first. Original error: ${error.message}`,
    )
  }
}

function proofClone(proof) {
  return {
    merkleTreeDepth: proof.merkleTreeDepth,
    merkleTreeRoot: proof.merkleTreeRoot,
    nullifier: proof.nullifier,
    message: proof.message,
    scope: proof.scope,
    points: [...proof.points],
  }
}

const runtime = await loadRuntime()
const { Identity, Group, generateProof, verifyProof } = runtime

const candidateId = 11n
const alternateCandidateId = 12n
const electionId = 20260818n
const alternateElectionId = electionId + 1n

const snarkArtifacts = process.env.ZK_SNARK_WASM && process.env.ZK_SNARK_ZKEY
  ? { wasm: process.env.ZK_SNARK_WASM, zkey: process.env.ZK_SNARK_ZKEY }
  : undefined
if (Boolean(process.env.ZK_SNARK_WASM) !== Boolean(process.env.ZK_SNARK_ZKEY)) {
  throw new Error('ZK_SNARK_WASM and ZK_SNARK_ZKEY must be configured together')
}

const voterA = new Identity()
const voterB = new Identity()
const outsider = new Identity()
const group = new Group([voterA.commitment, voterB.commitment])

const proofStart = performance.now()
const proofA = await generateProof(voterA, group, candidateId, electionId, undefined, snarkArtifacts)
const proofGenerationMs = performance.now() - proofStart

const verifyStart = performance.now()
const proofValid = await verifyProof(proofA)
const proofVerificationMs = performance.now() - verifyStart
assert.equal(proofValid, true, 'registered member proof must verify')

let nonMemberRejected = false
try {
  const outsiderProof = await generateProof(outsider, group, candidateId, electionId, undefined, snarkArtifacts)
  nonMemberRejected = !(await verifyProof(outsiderProof))
} catch {
  nonMemberRejected = true
}
assert.equal(nonMemberRejected, true, 'non-member proof must not be accepted')

const changedMessageProof = proofClone(proofA)
changedMessageProof.message = alternateCandidateId
assert.equal(await verifyProof(changedMessageProof), false, 'changing candidate/message must invalidate the proof')

const changedScopeProof = proofClone(proofA)
changedScopeProof.scope = alternateElectionId
assert.equal(await verifyProof(changedScopeProof), false, 'changing election scope must invalidate the proof')

const proofSameScopeDifferentMessage = await generateProof(voterA, group, alternateCandidateId, electionId, undefined, snarkArtifacts)
assert.equal(
  proofSameScopeDifferentMessage.nullifier.toString(),
  proofA.nullifier.toString(),
  'same identity + same election scope must produce the same nullifier regardless of candidate message',
)

const proofDifferentScope = await generateProof(voterA, group, candidateId, alternateElectionId, undefined, snarkArtifacts)
assert.notEqual(
  proofDifferentScope.nullifier.toString(),
  proofA.nullifier.toString(),
  'different election scope must produce a different nullifier',
)

const serializableProof = {
  merkleTreeDepth: Number(proofA.merkleTreeDepth),
  merkleTreeRoot: proofA.merkleTreeRoot.toString(),
  nullifier: proofA.nullifier.toString(),
  message: proofA.message.toString(),
  scope: proofA.scope.toString(),
  points: proofA.points.map((value) => value.toString()),
}

const result = {
  semaphoreVersion: '4.14.3',
  groupSize: group.size,
  candidateId: candidateId.toString(),
  electionId: electionId.toString(),
  validMemberProofVerified: proofValid,
  nonMemberRejected,
  changedMessageRejected: !(await verifyProof(changedMessageProof)),
  changedScopeRejected: !(await verifyProof(changedScopeProof)),
  sameScopeNullifierStable: proofSameScopeDifferentMessage.nullifier.toString() === proofA.nullifier.toString(),
  differentScopeNullifierDifferent: proofDifferentScope.nullifier.toString() !== proofA.nullifier.toString(),
  proofGenerationMs: Number(proofGenerationMs.toFixed(3)),
  proofVerificationMs: Number(proofVerificationMs.toFixed(3)),
  proofJsonBytes: Buffer.byteLength(JSON.stringify(serializableProof), 'utf8'),
  merkleTreeDepth: Number(proofA.merkleTreeDepth),
  merkleTreeRoot: proofA.merkleTreeRoot.toString(),
  nullifier: proofA.nullifier.toString(),
}

const logDir = path.resolve(__dirname, '../logs')
await fs.mkdir(logDir, { recursive: true })
await fs.writeFile(path.join(logDir, 'semaphore-poc-result.json'), `${JSON.stringify(result, null, 2)}\n`)

console.log(JSON.stringify(result, null, 2))
