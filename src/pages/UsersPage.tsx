import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Plus, MoreVertical, Shield, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usersApi } from '@/lib/api'
import { formatDateTime, getInitials } from '@/lib/utils'

const roleLabels: Record<string, string> = {
  ADMIN: 'Amministratore',
  MANAGER: 'Manager',
  USER: 'Utente',
  READONLY: 'Solo lettura',
}

const roleColors: Record<string, string> = {
  ADMIN: '#ef4444',
  MANAGER: '#f59e0b',
  USER: '#3b82f6',
  READONLY: '#6b7280',
}

export default function UsersPage() {
  const [search, setSearch] = useState('')

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () =>
      usersApi
        .list({
          ...(search && { search }),
          limit: 50,
        })
        .then((r) => r.data.data),
  })

  const users = usersData?.items || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utenti</h1>
          <p className="text-muted-foreground">
            Gestisci gli utenti dell'organizzazione
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Utente
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Cerca utenti..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun utente trovato</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-3 px-4 text-left text-sm font-medium">Utente</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Email</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Ruolo</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Stato</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Ultimo accesso</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-medium"
                        style={{ backgroundColor: roleColors[user.role] || '#6b7280' }}
                      >
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${roleColors[user.role]}20`,
                        color: roleColors[user.role],
                      }}
                    >
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <span className="h-2 w-2 rounded-full bg-green-600" />
                        Attivo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                        Disattivato
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Mai'}
                  </td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Modifica</DropdownMenuItem>
                        <DropdownMenuItem>Visualizza audit</DropdownMenuItem>
                        {user.isActive ? (
                          <DropdownMenuItem className="text-orange-600">
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Disattiva
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600">
                            <Shield className="mr-2 h-4 w-4" />
                            Riattiva
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
