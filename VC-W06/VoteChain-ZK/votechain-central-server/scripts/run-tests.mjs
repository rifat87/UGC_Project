import { spawnSync } from 'node:child_process'

// Intentionally ignore framework-specific passthrough flags such as --runInBand.
const result = spawnSync(process.execPath, ['--test'], {
  cwd: new URL('..', import.meta.url),
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
