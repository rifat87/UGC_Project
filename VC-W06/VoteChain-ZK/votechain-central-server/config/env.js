import dotenv from 'dotenv'

dotenv.config()

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getBlockchainConfig() {
  return {
    rpcUrl: requireEnv('RPC_URL'),
    contractAddress: requireEnv('CONTRACT_ADDRESS'),
  }
}

export function getServerConfig() {
  return {
    port: Number(process.env.PORT || 5000),
    mongoUri: requireEnv('MONGO_URI'),
    frontendOrigins: (process.env.FRONTEND_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  }
}
