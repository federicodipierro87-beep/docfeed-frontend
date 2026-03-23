import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  FolderSearch,
  Search,
  Trash2,
  Users,
  UsersRound,
  GitBranch,
  Tags,
  Database,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Documenti', href: '/documents', icon: FileText },
  { name: 'Viste', href: '/views', icon: FolderSearch },
  { name: 'Ricerca', href: '/search', icon: Search },
  { name: 'Cestino', href: '/trash', icon: Trash2 },
]

// Solo per ADMIN
const onlyAdminNavigation = [
  { name: 'Vault', href: '/vaults', icon: FolderOpen },
]

// Per ADMIN e MANAGER
const adminNavigation = [
  { name: 'Classi', href: '/metadata', icon: Database },
  { name: 'Attributi', href: '/attributes', icon: Tags },
  { name: 'Utenti', href: '/users', icon: Users },
  { name: 'Gruppi', href: '/user-groups', icon: UsersRound },
  { name: 'Workflow', href: '/workflows', icon: GitBranch },
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 md:h-16 flex items-center border-b px-4 md:px-6 flex-shrink-0">
        <h1 className="text-xl font-bold text-primary">DocuVault</h1>
      </div>

      {/* Navigation - scrollable */}
      <nav className="flex-1 overflow-y-auto p-3 md:p-4 space-y-1">
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
            <item.icon className="h-5 w-5 flex-shrink-0" />
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
                <item.icon className="h-5 w-5 flex-shrink-0" />
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
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 md:p-4 flex-shrink-0">
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
          <Settings className="h-5 w-5 flex-shrink-0" />
          Impostazioni
        </NavLink>

        <Button
          variant="ghost"
          className="mt-2 w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={() => logout()}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Esci
        </Button>
      </div>
    </div>
  )
}
