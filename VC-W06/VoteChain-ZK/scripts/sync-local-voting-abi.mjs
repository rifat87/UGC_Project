import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')
const defaultArtifactPath = path.join(rootDir, 'out', 'LocalVoting.sol', 'LocalVoting.json')
const artifactPath = process.env.LOCAL_VOTING_ARTIFACT_PATH
  ? path.resolve(process.env.LOCAL_VOTING_ARTIFACT_PATH)
  : defaultArtifactPath

const destinations = [
  path.join(rootDir, 'votechain-frontend-ts', 'src', 'abi', 'LocalVoting.json'),
  path.join(rootDir, 'votechain-central-server', 'abi', 'LocalVoting.json'),
]

const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))
if (!Array.isArray(artifact.abi)) {
  throw new Error(`Foundry artifact does not contain an ABI array: ${artifactPath}`)
}

const serializedAbi = `${JSON.stringify(artifact.abi, null, 2)}\n`
for (const destination of destinations) {
  await mkdir(path.dirname(destination), { recursive: true })
  await writeFile(destination, serializedAbi)
  console.log(`Synchronized LocalVoting ABI -> ${path.relative(rootDir, destination)}`)
}
