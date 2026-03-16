import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2 } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { vaultsApi, metadataApi, usersApi } from '@/lib/api'
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

interface EditVaultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vault: {
    id: string
    name: string
    description?: string | null
    color?: string | null
    metadataClassId?: string | null
    isPublic?: boolean
    allowedRoles?: string | string[]
    allowedUserIds?: string | string[]
  } | null
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

export function EditVaultDialog({ open, onOpenChange, vault }: EditVaultDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [metadataClassId, setMetadataClassId] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [allowedRoles, setAllowedRoles] = useState<string[]>([])
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: metadataClasses } = useQuery({
    queryKey: ['metadata-classes'],
    queryFn: () => metadataApi.listClasses().then((r) => r.data.data),
    enabled: open,
  })

  // Fetch users for permission selection
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data.data),
    enabled: open,
  })

  // Helper to parse JSON fields
  const parseJsonArray = (value: any): string[] => {
    if (!value) return []
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }

  useEffect(() => {
    if (vault) {
      setName(vault.name)
      setDescription(vault.description || '')
      setColor(vault.color || COLORS[0])
      setMetadataClassId(vault.metadataClassId || null)
      setIsPublic(vault.isPublic !== false)
      setAllowedRoles(parseJsonArray(vault.allowedRoles))
      setAllowedUserIds(parseJsonArray(vault.allowedUserIds))
    }
  }, [vault])

  const updateMutation = useMutation({
    mutationFn: () => {
      const data: any = {
        name,
        description: description || null,
        color,
        metadataClassId: metadataClassId || null,
        isPublic,
      }
      if (!isPublic) {
        data.allowedRoles = allowedRoles.length > 0 ? allowedRoles : null
        data.allowedUserIds = allowedUserIds.length > 0 ? allowedUserIds : null
      } else {
        data.allowedRoles = null
        data.allowedUserIds = null
      }
      return vaultsApi.update(vault!.id, data)
    },
    onSuccess: () => {
      toast({
        title: 'Vault aggiornato',
        description: 'Le modifiche sono state salvate',
      })
      queryClient.invalidateQueries({ queryKey: ['vaults'] })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante il salvataggio',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => vaultsApi.delete(vault!.id),
    onSuccess: () => {
      toast({
        title: 'Vault eliminato',
        description: `Il vault "${vault?.name}" è stato eliminato`,
      })
      queryClient.invalidateQueries({ queryKey: ['vaults'] })
      setDeleteOpen(false)
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante l\'eliminazione',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Vault</DialogTitle>
            <DialogDescription>
              Modifica le impostazioni del vault
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="edit-vault-name">Nome vault *</Label>
              <Input
                id="edit-vault-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome del vault"
                required
              />
            </div>

            {/* Descrizione */}
            <div className="space-y-2">
              <Label htmlFor="edit-vault-description">Descrizione</Label>
              <Input
                id="edit-vault-description"
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

            {/* Classe Metadata */}
            <div className="space-y-2">
              <Label>Classe Metadata</Label>
              <Select
                value={metadataClassId || 'none'}
                onValueChange={(value) => setMetadataClassId(value === 'none' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona una classe metadata" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna classe</SelectItem>
                  {metadataClasses?.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.fields?.length || 0} campi)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                I documenti in questo vault avranno i campi della classe selezionata
              </p>
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

            {/* Zona pericolosa */}
            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina Vault
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={!name || updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  'Salva Modifiche'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il vault?</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il vault "{vault?.name}"?
              <br />
              <strong className="text-destructive">
                Tutti i documenti al suo interno verranno eliminati.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                'Elimina'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
