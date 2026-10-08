import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const root = path.resolve(path.dirname(__filename), '..')
const artifactPath = path.join(root, 'out', 'ZKLocalVoting.sol', 'ZKLocalVoting.json')
const destinations = [
  path.join(root, 'votechain-frontend-ts', 'src', 'abi', 'ZKLocalVoting.json'),
  path.join(root, 'votechain-central-server', 'abi', 'ZKLocalVoting.json'),
]

const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
if (!Array.isArray(artifact.abi)) throw new Error('ZKLocalVoting Foundry artifact did not contain an ABI array')
const serialized = `${JSON.stringify(artifact.abi, null, 2)}\n`
for (const destination of destinations) {
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.writeFileSync(destination, serialized)
  console.log(`Wrote ${path.relative(root, destination)}`)
}
