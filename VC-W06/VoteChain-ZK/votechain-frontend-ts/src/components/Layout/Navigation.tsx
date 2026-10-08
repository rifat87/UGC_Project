import { useLocation, Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { WalletButton } from "@/components/Wallet/WalletButton"
import { useWallet } from "@/components/ui/wallet-provider"
import { useState } from "react"
import { 
  Home, 
  Vote, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight,
  Info
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiresConnection?: boolean
}

const navItems: NavItem[] = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
{
    title: "Results",
    href: "/results",
    icon: Home,
  },
  {
    title: "Vote",
    href: "/vote",
    icon: Vote,
    requiresConnection: true,
  },
  {
    title: "Register as Voter",
    href: "/register",
    icon: UserPlus,
    requiresConnection: true,
  },
  {
    title: "About",
    href: "/about",
    icon: Info,
  },
]

export function Navigation() {
  const location = useLocation()
  const { isConnected, isWalletChecked } = useWallet()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredNavItems = navItems.filter((item) => {
    if (item.requiresConnection && (!isWalletChecked || !isConnected)) return false
    return true
  })

  if (!isWalletChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    )
  }

  return (
    <div className={cn(
      "flex h-screen flex-col border-r bg-background transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-14 items-center border-b px-4">
        {!isCollapsed && (
          <span className="text-lg font-semibold">VoteChain</span>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              location.pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              isCollapsed ? "justify-center" : "justify-start"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
              <span className="truncate">{item.title}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4 space-y-4">
        <div className="flex items-center justify-between">
          <WalletButton />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 