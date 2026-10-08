import { useLocation, Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { WalletButton } from "@/components/Wallet/WalletButton"
import { useContract } from "@/hooks/useContract"
import { useWallet } from "@/components/ui/wallet-provider"
import { useState } from "react"
import { 
  Shield, 
  UserPlus, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  BarChart
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiresConnection?: boolean
  requiresAdmin?: boolean
}

const navItems: NavItem[] = [
  {
    title: "Admin Dashboard",
    href: "/admin",
    icon: Shield,
    requiresConnection: true,
    requiresAdmin: true,
  },
  {
    title: "Register Voter",
    href: "/admin/register-voter",
    icon: UserPlus,
    requiresConnection: true,
    requiresAdmin: true,
  },
  {
    title: "Register Candidate",
    href: "/admin/register-candidate",
    icon: Users,
    requiresConnection: true,
    requiresAdmin: true,
  },
  {
    title: "Election Status",
    href: "/admin/status",
    icon: BarChart,
    requiresConnection: true,
    requiresAdmin: true,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    requiresConnection: true,
    requiresAdmin: true,
  },
]

export function AdminNavigation() {
  const location = useLocation()
  const { isConnected } = useWallet()
  const { isAdmin } = useContract()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredNavItems = navItems.filter((item) => {
    if (item.requiresConnection && !isConnected) return false
    if (item.requiresAdmin && !isAdmin) return false
    return true
  })

  return (
    <div className={cn(
      "flex h-screen flex-col border-r bg-background transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-14 items-center border-b px-4">
        {!isCollapsed && (
          <span className="text-lg font-semibold">VoteChain Admin</span>
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