/// <reference types="vite/client" />

interface EthereumProvider {
  request(args: { method: "eth_accounts" | "eth_requestAccounts"; params?: unknown[] | object }): Promise<string[]>
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>
  on(event: "accountsChanged", handler: (accounts: string[]) => void): void
  on(event: "chainChanged", handler: (chainId: string) => void): void
  removeListener(event: "accountsChanged", handler: (accounts: string[]) => void): void
  removeListener(event: "chainChanged", handler: (chainId: string) => void): void
}

interface Window {
  ethereum?: EthereumProvider
}
