import { useLocation } from "react-router-dom"
import { Navigation } from "./Navigation"
import { AdminNavigation } from "./AdminNavigation"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith("/admin")

  return (
    <div className="flex min-h-screen">
      {isAdminRoute ? <AdminNavigation /> : <Navigation />}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
} 