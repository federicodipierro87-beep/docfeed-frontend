import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Search,
  Trash2,
  Users,
  GitBranch,
  Tags,
  Database,
  Network,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Documenti', href: '/documents', icon: FileText },
  { name: 'Ricerca', href: '/search', icon: Search },
  { name: 'Cestino', href: '/trash', icon: Trash2 },
]

// Solo per ADMIN
const onlyAdminNavigation = [
  { name: 'Vault', href: '/vaults', icon: FolderOpen },
]

// Per ADMIN e MANAGER
const adminNavigation = [
  { name: 'Utenti', href: '/users', icon: Users },
  { name: 'Workflow', href: '/workflows', icon: GitBranch },
  { name: 'Attributi', href: '/attributes', icon: Tags },
  { name: 'Classi', href: '/metadata', icon: Database },
  { name: 'Struttura', href: '/structure', icon: Network },
]

interface SidebarContentProps {
  onNavigate?: () => void
}

export default function SidebarContent({ onNavigate }: SidebarContentProps) {
  const { user, logout } = useAuthStore()

  const isOnlyAdmin = user?.role === 'ADMIN'
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const handleClick = () => {
    onNavigate?.()
  }

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">DocuVault</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={handleClick}
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
            {isOnlyAdmin && onlyAdminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={handleClick}
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
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={handleClick}
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
          onClick={handleClick}
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
    </>
  )
}
