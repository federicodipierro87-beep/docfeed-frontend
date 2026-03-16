import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { vaultsApi, usersApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

const ROLES = [
  { value: 'ADMIN', label: 'Amministratore' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'USER', label: 'Utente' },
  { value: 'READONLY', label: 'Sola Lettura' },
]

interface CreateVaultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#64748b', // slate
]

export function CreateVaultDialog({ open, onOpenChange }: CreateVaultDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [isPublic, setIsPublic] = useState(true)
  const [allowedRoles, setAllowedRoles] = useState<string[]>([])
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([])

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch users for permission selection
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data.data),
    enabled: open,
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const data: any = { name, description: description || undefined, color, isPublic }
      if (!isPublic) {
        if (allowedRoles.length > 0) data.allowedRoles = allowedRoles
        if (allowedUserIds.length > 0) data.allowedUserIds = allowedUserIds
      }
      return vaultsApi.create(data)
    },
    onSuccess: () => {
      toast({
        title: 'Vault creato',
        description: `Il vault "${name}" è stato creato con successo`,
      })
      queryClient.invalidateQueries({ queryKey: ['vaults'] })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante la creazione',
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setName('')
    setDescription('')
    setColor(COLORS[0])
    setIsPublic(true)
    setAllowedRoles([])
    setAllowedUserIds([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuovo Vault</DialogTitle>
          <DialogDescription>
            Crea un nuovo archivio per organizzare i tuoi documenti
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="vault-name">Nome vault *</Label>
            <Input
              id="vault-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Contratti, Fatture, HR..."
              required
            />
          </div>

          {/* Descrizione */}
          <div className="space-y-2">
            <Label htmlFor="vault-description">Descrizione</Label>
            <Input
              id="vault-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrizione del vault"
            />
          </div>

          {/* Colore */}
          <div className="space-y-2">
            <Label>Colore</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Permessi */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Visibilità</Label>
                <p className="text-sm text-muted-foreground">
                  {isPublic ? 'Tutti possono vedere questo vault' : 'Solo utenti autorizzati'}
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            {!isPublic && (
              <>
                <div className="space-y-2">
                  <Label>Ruoli autorizzati</Label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((role) => (
                      <label
                        key={role.value}
                        className="flex items-center gap-2 px-3 py-1 rounded-md border cursor-pointer hover:bg-muted"
                      >
                        <Checkbox
                          checked={allowedRoles.includes(role.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAllowedRoles([...allowedRoles, role.value])
                            } else {
                              setAllowedRoles(allowedRoles.filter((r) => r !== role.value))
                            }
                          }}
                        />
                        <span className="text-sm">{role.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Utenti specifici autorizzati</Label>
                  {users && users.length > 0 ? (
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                      {users.map((user: User) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-muted"
                        >
                          <Checkbox
                            checked={allowedUserIds.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAllowedUserIds([...allowedUserIds, user.id])
                              } else {
                                setAllowedUserIds(allowedUserIds.filter((id) => id !== user.id))
                              }
                            }}
                          />
                          <span className="text-sm">
                            {user.firstName} {user.lastName} ({user.email})
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nessun utente disponibile</p>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!name || createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creazione...
                </>
              ) : (
                'Crea Vault'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
