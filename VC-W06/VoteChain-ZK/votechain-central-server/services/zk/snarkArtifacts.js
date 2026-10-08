export function getConfiguredSnarkArtifacts(env = process.env) {
  const wasm = env.ZK_SNARK_WASM?.trim()
  const zkey = env.ZK_SNARK_ZKEY?.trim()
  if (!wasm && !zkey) return undefined
  if (!wasm || !zkey) throw new Error('ZK_SNARK_WASM and ZK_SNARK_ZKEY must be configured together')
  return { wasm, zkey }
}
