import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { EditUserDialog } from '@/components/users/EditUserDialog'
import { usersApi } from '@/lib/api'
import { formatDateTime, getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

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
  const [editUser, setEditUser] = useState<{
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  } | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

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

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      toast({ title: 'Utente disattivato' })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante la disattivazione',
        variant: 'destructive',
      })
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => {
      toast({ title: 'Utente riattivato' })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante la riattivazione',
        variant: 'destructive',
      })
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Utenti</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci gli utenti dell'organizzazione
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Utente
        </Button>
      </div>

      {/* Search */}
      <div className="w-full sm:max-w-sm">
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
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-3 px-4 text-left text-sm font-medium">Utente</th>
                <th className="py-3 px-4 text-left text-sm font-medium hidden sm:table-cell">Email</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Ruolo</th>
                <th className="py-3 px-4 text-left text-sm font-medium hidden md:table-cell">Stato</th>
                <th className="py-3 px-4 text-left text-sm font-medium hidden lg:table-cell">Ultimo accesso</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-medium shrink-0"
                        style={{ backgroundColor: roleColors[user.role] || '#6b7280' }}
                      >
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground sm:hidden truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{user.email}</td>
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
                  <td className="py-3 px-4 hidden md:table-cell">
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
                  <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
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
                        <DropdownMenuItem
                          onClick={() => setEditUser({
                            id: user.id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            role: user.role,
                          })}
                        >
                          Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem>Visualizza audit</DropdownMenuItem>
                        {user.isActive ? (
                          <DropdownMenuItem
                            className="text-orange-600"
                            onClick={() => deactivateMutation.mutate(user.id)}
                          >
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Disattiva
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() => activateMutation.mutate(user.id)}
                          >
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

      {/* Edit User Dialog */}
      <EditUserDialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        user={editUser}
      />
    </div>
  )
}
