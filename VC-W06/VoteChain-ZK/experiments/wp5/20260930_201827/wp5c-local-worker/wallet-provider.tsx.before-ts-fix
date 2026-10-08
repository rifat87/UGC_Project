import { createContext, useContext, useEffect, useState, useRef } from "react"
import { BrowserProvider, JsonRpcSigner } from "ethers"
import { useNavigate } from "react-router-dom"

interface WalletState {
  isConnected: boolean
  address: string | null
  provider: BrowserProvider | null
  signer: JsonRpcSigner | null
  isConnecting: boolean
  isWalletChecked: boolean
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  provider: null,
  signer: null,
  isConnecting: false,
  isWalletChecked: false
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>(initialState)
  const mountedRef = useRef(true)
  const connectionRequested = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    mountedRef.current = true
    async function checkWallet() {
      if (typeof window.ethereum === 'undefined') {
        setState(prev => ({ ...prev, isWalletChecked: true }))
        return
      }
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          const provider = new BrowserProvider(window.ethereum)
          const signer = await provider.getSigner()
          setState({
            isConnected: true,
            address: accounts[0],
            provider,
            signer,
            isConnecting: false,
            isWalletChecked: true
          })
        } else {
          setState(prev => ({ ...prev, isWalletChecked: true }))
        }
      } catch {
        setState(prev => ({ ...prev, isWalletChecked: true }))
      }
    }
    checkWallet()
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (typeof window.ethereum === 'undefined') {
      return
    }

    const handleAccountsChanged = async (accounts: string[]) => {
      if (!mountedRef.current) return

      if (accounts.length === 0) {
        // User disconnected their wallet
        setState({
          ...initialState,
          isWalletChecked: true
        })
        navigate('/', { replace: true })
      } else {
        // Only update state if we're already connected
        if (state.isConnected) {
          const provider = new BrowserProvider(window.ethereum)
          const signer = await provider.getSigner()
          setState(prev => ({
            ...prev,
            address: accounts[0],
            provider,
            signer
          }))
        }
      }
    }

    const handleChainChanged = () => {
      if (!mountedRef.current) return
      window.location.reload()
    }

    // Set up event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [state.isConnected])

  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed')
    }

    // Prevent multiple simultaneous connection attempts
    if (connectionRequested.current || state.isConnecting) {
      return
    }

    try {
      connectionRequested.current = true
      setState(prev => ({ ...prev, isConnecting: true }))
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (accounts.length > 0) {
        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        
        setState({
          isConnected: true,
          address: accounts[0],
          provider,
          signer,
          isConnecting: false,
          isWalletChecked: true
        })
        
        // Role-based routing: Check if user is admin
        try {
          const { createContract } = await import('@/config/contract')
          const contractInstance = createContract(signer)
          const commission = await contractInstance.electionCommission()
          
          if (accounts[0].toLowerCase() === commission.toLowerCase()) {
            // User is admin - redirect to admin dashboard
        navigate('/admin', { replace: true })
          } else {
            // User is voter - redirect to voter dashboard
            navigate('/voter', { replace: true })
          }
        } catch (contractError) {
          console.error('Error determining role:', contractError)
          // If role determination fails, stay on current page
          // User can manually navigate where they need to go
        }
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error)
      setState(prev => ({ ...prev, isConnecting: false, isWalletChecked: true }))
      throw error
    } finally {
      connectionRequested.current = false
    }
  }

  const disconnect = async () => {
    try {
      if (window.ethereum) {
        // Revoke all permissions from MetaMask
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }]
        });
      }

      // Reset all state
      setState({
        ...initialState,
        isWalletChecked: true
      })
      
      // Clear any cached data
      localStorage.removeItem('walletConnected')
      
      // Force a page reload to ensure clean state
      window.location.reload()
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
      // Even if there's an error, we still want to reset everything
      setState({
        ...initialState,
        isWalletChecked: true
      })
      localStorage.removeItem('walletConnected')
      window.location.reload()
    }
  }

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
} 