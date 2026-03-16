import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tags, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { attributesApi, usersApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Testo' },
  { value: 'NUMBER', label: 'Numero' },
  { value: 'DATE', label: 'Data' },
  { value: 'BOOLEAN', label: 'Sì/No' },
  { value: 'SELECT', label: 'Selezione singola' },
  { value: 'MULTISELECT', label: 'Selezione multipla' },
]

interface Attribute {
  id: string
  name: string
  label: string
  type: string
  isRequired: boolean
  isSearchable: boolean
  options?: string | string[]
  isPublic: boolean
  allowedRoles?: string | string[]
  allowedUserIds?: string | string[]
  _count?: { classAttributes: number }
}

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

export default function AttributesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editAttr, setEditAttr] = useState<Attribute | null>(null)
  const [deleteAttr, setDeleteAttr] = useState<Attribute | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: attributes, isLoading } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => attributesApi.list().then((r) => r.data.data),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tags className="h-6 w-6" />
            Attributi
          </h1>
          <p className="text-muted-foreground">
            Definisci gli attributi da usare nelle classi metadata
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Attributo
        </Button>
      </div>

      {/* Attributes List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : attributes && attributes.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-3 px-4 text-left text-sm font-medium">Nome</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Etichetta</th>
                <th className="py-3 px-4 text-left text-sm font-medium">Tipo</th>
                <th className="py-3 px-4 text-center text-sm font-medium">Obbligatorio</th>
                <th className="py-3 px-4 text-center text-sm font-medium">Visibilità</th>
                <th className="py-3 px-4 text-center text-sm font-medium">Usato in</th>
                <th className="py-3 px-4 text-right text-sm font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr: Attribute) => (
                <tr key={attr.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-4 font-mono text-sm">{attr.name}</td>
                  <td className="py-3 px-4">{attr.label}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">
                      {FIELD_TYPES.find((t) => t.value === attr.type)?.label || attr.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {attr.isRequired ? '✓' : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={attr.isPublic ? 'secondary' : 'outline'}>
                      {attr.isPublic ? 'Pubblico' : 'Riservato'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="secondary">
                      {attr._count?.classAttributes || 0} classi
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditAttr(attr)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteAttr(attr)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tags className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun attributo</p>
            <p className="text-muted-foreground">
              Crea il primo attributo per iniziare
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crea Attributo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <AttributeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        attribute={null}
      />

      {/* Edit Dialog */}
      <AttributeDialog
        open={!!editAttr}
        onOpenChange={(open) => !open && setEditAttr(null)}
        attribute={editAttr}
      />

      {/* Delete Dialog */}
      <DeleteAttributeDialog
        open={!!deleteAttr}
        onOpenChange={(open) => !open && setDeleteAttr(null)}
        attribute={deleteAttr}
      />
    </div>
  )
}

// === ATTRIBUTE DIALOG (Create/Edit) ===
function AttributeDialog({
  open,
  onOpenChange,
  attribute,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute: Attribute | null
}) {
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [type, setType] = useState('TEXT')
  const [isRequired, setIsRequired] = useState(false)
  const [isSearchable, setIsSearchable] = useState(true)
  const [options, setOptions] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [allowedRoles, setAllowedRoles] = useState<string[]>([])
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([])

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const isEdit = !!attribute

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

  // Reset form when opening
  const resetForm = () => {
    if (attribute) {
      setName(attribute.name)
      setLabel(attribute.label)
      setType(attribute.type)
      setIsRequired(attribute.isRequired)
      setIsSearchable(attribute.isSearchable)
      const opts = attribute.options
      if (typeof opts === 'string') {
        try {
          setOptions(JSON.parse(opts).join(', '))
        } catch {
          setOptions(opts)
        }
      } else if (Array.isArray(opts)) {
        setOptions(opts.join(', '))
      } else {
        setOptions('')
      }
      setIsPublic(attribute.isPublic !== false)
      setAllowedRoles(parseJsonArray(attribute.allowedRoles))
      setAllowedUserIds(parseJsonArray(attribute.allowedUserIds))
    } else {
      setName('')
      setLabel('')
      setType('TEXT')
      setIsRequired(false)
      setIsSearchable(true)
      setOptions('')
      setIsPublic(true)
      setAllowedRoles([])
      setAllowedUserIds([])
    }
  }

  // Update form when attribute changes
  if (open && attribute && name !== attribute.name) {
    resetForm()
  } else if (open && !attribute && name !== '') {
    resetForm()
  }

  const createMutation = useMutation({
    mutationFn: () => {
      const data: any = { name, label, type, isRequired, isSearchable, isPublic }
      if (type === 'SELECT' || type === 'MULTISELECT') {
        data.options = options.split(',').map((o) => o.trim()).filter(Boolean)
      }
      if (!isPublic) {
        if (allowedRoles.length > 0) data.allowedRoles = allowedRoles
        if (allowedUserIds.length > 0) data.allowedUserIds = allowedUserIds
      }
      return attributesApi.create(data)
    },
    onSuccess: () => {
      toast({ title: 'Attributo creato' })
      queryClient.invalidateQueries({ queryKey: ['attributes'] })
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

  const updateMutation = useMutation({
    mutationFn: () => {
      const data: any = { label, isRequired, isSearchable, isPublic }
      if (type === 'SELECT' || type === 'MULTISELECT') {
        data.options = options.split(',').map((o) => o.trim()).filter(Boolean)
      }
      if (!isPublic) {
        data.allowedRoles = allowedRoles.length > 0 ? allowedRoles : null
        data.allowedUserIds = allowedUserIds.length > 0 ? allowedUserIds : null
      } else {
        data.allowedRoles = null
        data.allowedUserIds = null
      }
      return attributesApi.update(attribute!.id, data)
    },
    onSuccess: () => {
      toast({ title: 'Attributo aggiornato' })
      queryClient.invalidateQueries({ queryKey: ['attributes'] })
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica Attributo' : 'Nuovo Attributo'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifica le proprietà dell\'attributo'
              : 'Crea un nuovo attributo da usare nelle classi'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attr-name">Nome (ID) *</Label>
              <Input
                id="attr-name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="es. data_scadenza"
                required
                disabled={isEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attr-label">Etichetta *</Label>
              <Input
                id="attr-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="es. Data Scadenza"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={type} onValueChange={setType} disabled={isEdit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(type === 'SELECT' || type === 'MULTISELECT') && (
            <div className="space-y-2">
              <Label htmlFor="attr-options">Opzioni (separate da virgola)</Label>
              <Input
                id="attr-options"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="es. Opzione 1, Opzione 2, Opzione 3"
              />
            </div>
          )}

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="attr-required"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked as boolean)}
              />
              <Label htmlFor="attr-required" className="cursor-pointer">
                Obbligatorio di default
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="attr-searchable"
                checked={isSearchable}
                onCheckedChange={(checked) => setIsSearchable(checked as boolean)}
              />
              <Label htmlFor="attr-searchable" className="cursor-pointer">
                Ricercabile
              </Label>
            </div>
          </div>

          {/* Permessi */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Visibilità</Label>
                <p className="text-sm text-muted-foreground">
                  {isPublic ? 'Tutti possono vedere questo attributo' : 'Solo utenti autorizzati'}
                </p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
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
            <Button type="submit" disabled={!name || !label || isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? 'Salva' : 'Crea Attributo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// === DELETE ATTRIBUTE DIALOG ===
function DeleteAttributeDialog({
  open,
  onOpenChange,
  attribute,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute: Attribute | null
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => attributesApi.delete(attribute!.id),
    onSuccess: () => {
      toast({ title: 'Attributo eliminato' })
      queryClient.invalidateQueries({ queryKey: ['attributes'] })
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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare l'attributo?</AlertDialogTitle>
          <AlertDialogDescription>
            Sei sicuro di voler eliminare l'attributo "{attribute?.label}"?
            {attribute?._count?.classAttributes && attribute._count.classAttributes > 0 && (
              <>
                <br />
                <strong className="text-destructive">
                  L'attributo verrà rimosso da {attribute._count.classAttributes} classi.
                </strong>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Elimina
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
