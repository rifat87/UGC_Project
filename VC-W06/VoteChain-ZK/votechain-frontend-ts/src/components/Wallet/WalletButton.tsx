import { Button } from "@/components/ui/button"
import { useWallet } from "@/components/ui/wallet-provider"
import { Copy, LogOut } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"

export function WalletButton() {
  const { address, isConnected, isWalletChecked, connect, disconnect } = useWallet()
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      await connect()
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been successfully connected.",
      })
    } catch (error: any) {
      if (error.code !== 4001) {
        toast({
          title: "Connection Error",
          description: error.message || "Failed to connect wallet",
          variant: "destructive",
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been successfully disconnected.",
      })
    } catch (error: any) {
      toast({
        title: "Disconnection Error",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      })
    }
  }

  // Only show wallet button UI if wallet is checked
  if (!isWalletChecked) {
    return null // or a loader if you prefer
  }

  if (!isConnected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full"
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <span className="truncate">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Address</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 