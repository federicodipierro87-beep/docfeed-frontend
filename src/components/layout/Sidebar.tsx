import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Search,
  Users,
  GitBranch,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Documenti', href: '/documents', icon: FileText },
  { name: 'Vault', href: '/vaults', icon: FolderOpen },
  { name: 'Ricerca', href: '/search', icon: Search },
]

const adminNavigation = [
  { name: 'Utenti', href: '/users', icon: Users },
  { name: 'Workflow', href: '/workflows', icon: GitBranch },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  return (
    <div className="flex w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">DocuVault</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="my-4 border-t" />
            <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
              Amministrazione
            </p>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )
          }
        >
          <Settings className="h-5 w-5" />
          Impostazioni
        </NavLink>

        <Button
          variant="ghost"
          className="mt-2 w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={() => logout()}
        >
          <LogOut className="h-5 w-5" />
          Esci
        </Button>
      </div>
    </div>
  )
}
