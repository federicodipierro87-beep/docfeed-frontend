import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Database,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { metadataApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Testo' },
  { value: 'NUMBER', label: 'Numero' },
  { value: 'DATE', label: 'Data' },
  { value: 'BOOLEAN', label: 'Sì/No' },
  { value: 'SELECT', label: 'Selezione singola' },
  { value: 'MULTISELECT', label: 'Selezione multipla' },
]

interface MetadataField {
  id: string
  name: string
  label: string
  type: string
  isRequired: boolean
  isSearchable: boolean
  options?: string[]
  order: number
}

interface MetadataClass {
  id: string
  name: string
  description?: string
  fields: MetadataField[]
  _count?: { vaults: number }
}

export default function MetadataPage() {
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set())
  const [createClassOpen, setCreateClassOpen] = useState(false)
  const [editClass, setEditClass] = useState<MetadataClass | null>(null)
  const [deleteClass, setDeleteClass] = useState<MetadataClass | null>(null)
  const [addFieldTo, setAddFieldTo] = useState<string | null>(null)
  const [editField, setEditField] = useState<{ classId: string; field: MetadataField } | null>(null)
  const [deleteField, setDeleteField] = useState<{ classId: string; field: MetadataField } | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: classes, isLoading } = useQuery({
    queryKey: ['metadata-classes'],
    queryFn: () => metadataApi.listClasses().then((r) => r.data.data),
  })

  const toggleExpand = (classId: string) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev)
      if (next.has(classId)) {
        next.delete(classId)
      } else {
        next.add(classId)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Classi Metadata
          </h1>
          <p className="text-muted-foreground">
            Definisci i campi metadata da associare ai vault
          </p>
        </div>
        <Button onClick={() => setCreateClassOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Classe
        </Button>
      </div>

      {/* Classes List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : classes && classes.length > 0 ? (
        <div className="space-y-4">
          {classes.map((cls: MetadataClass) => (
            <Card key={cls.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 cursor-pointer flex-1"
                    onClick={() => toggleExpand(cls.id)}
                  >
                    {expandedClasses.has(cls.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {cls.fields?.length || 0} campi
                    </Badge>
                    {cls._count?.vaults ? (
                      <Badge variant="outline" className="ml-1">
                        {cls._count.vaults} vault
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAddFieldTo(cls.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditClass(cls)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteClass(cls)}
                      disabled={cls._count?.vaults && cls._count.vaults > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {cls.description && (
                  <p className="text-sm text-muted-foreground ml-6">
                    {cls.description}
                  </p>
                )}
              </CardHeader>

              {expandedClasses.has(cls.id) && (
                <CardContent className="pt-0">
                  {cls.fields && cls.fields.length > 0 ? (
                    <div className="border rounded-md">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-2 px-3 text-left text-sm font-medium w-8"></th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Nome</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Etichetta</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Tipo</th>
                            <th className="py-2 px-3 text-center text-sm font-medium">Obbligatorio</th>
                            <th className="py-2 px-3 text-right text-sm font-medium">Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cls.fields.map((field) => (
                            <tr key={field.id} className="border-b last:border-0">
                              <td className="py-2 px-3">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </td>
                              <td className="py-2 px-3 font-mono text-sm">{field.name}</td>
                              <td className="py-2 px-3">{field.label}</td>
                              <td className="py-2 px-3">
                                <Badge variant="outline">
                                  {FIELD_TYPES.find((t) => t.value === field.type)?.label || field.type}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-center">
                                {field.isRequired ? '✓' : '-'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditField({ classId: cls.id, field })}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteField({ classId: cls.id, field })}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nessun campo definito.{' '}
                      <button
                        className="text-primary hover:underline"
                        onClick={() => setAddFieldTo(cls.id)}
                      >
                        Aggiungi il primo campo
                      </button>
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessuna classe metadata</p>
            <p className="text-muted-foreground">
              Crea la prima classe per definire i campi dei tuoi documenti
            </p>
            <Button className="mt-4" onClick={() => setCreateClassOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crea Classe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Class Dialog */}
      <CreateClassDialog
        open={createClassOpen}
        onOpenChange={setCreateClassOpen}
      />

      {/* Edit Class Dialog */}
      <EditClassDialog
        open={!!editClass}
        onOpenChange={(open) => !open && setEditClass(null)}
        metadataClass={editClass}
      />

      {/* Delete Class Dialog */}
      <DeleteClassDialog
        open={!!deleteClass}
        onOpenChange={(open) => !open && setDeleteClass(null)}
        metadataClass={deleteClass}
      />

      {/* Add Field Dialog */}
      <FieldDialog
        open={!!addFieldTo}
        onOpenChange={(open) => !open && setAddFieldTo(null)}
        classId={addFieldTo}
        field={null}
      />

      {/* Edit Field Dialog */}
      <FieldDialog
        open={!!editField}
        onOpenChange={(open) => !open && setEditField(null)}
        classId={editField?.classId || null}
        field={editField?.field || null}
      />

      {/* Delete Field Dialog */}
      <DeleteFieldDialog
        open={!!deleteField}
        onOpenChange={(open) => !open && setDeleteField(null)}
        classId={deleteField?.classId || null}
        field={deleteField?.field || null}
      />
    </div>
  )
}

// === CREATE CLASS DIALOG ===
function CreateClassDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: () => metadataApi.createClass({ name, description: description || undefined }),
    onSuccess: () => {
      toast({ title: 'Classe creata', description: `La classe "${name}" è stata creata` })
      queryClient.invalidateQueries({ queryKey: ['metadata-classes'] })
      onOpenChange(false)
      setName('')
      setDescription('')
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante la creazione',
        variant: 'destructive',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuova Classe Metadata</DialogTitle>
          <DialogDescription>
            Crea una nuova classe per raggruppare i campi metadata
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate()
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="class-name">Nome classe *</Label>
            <Input
              id="class-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Contratto, Fattura, Documento HR..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-description">Descrizione</Label>
            <Input
              id="class-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrizione della classe"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!name || createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Crea Classe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// === EDIT CLASS DIALOG ===
function EditClassDialog({
  open,
  onOpenChange,
  metadataClass,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  metadataClass: MetadataClass | null
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useState(() => {
    if (metadataClass) {
      setName(metadataClass.name)
      setDescription(metadataClass.description || '')
    }
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      metadataApi.updateClass(metadataClass!.id, { name, description: description || null }),
    onSuccess: () => {
      toast({ title: 'Classe aggiornata' })
      queryClient.invalidateQueries({ queryKey: ['metadata-classes'] })
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

  // Update form when metadataClass changes
  if (metadataClass && name !== metadataClass.name && !updateMutation.isPending) {
    setName(metadataClass.name)
    setDescription(metadataClass.description || '')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica Classe</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateMutation.mutate()
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="edit-class-name">Nome classe *</Label>
            <Input
              id="edit-class-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-class-description">Descrizione</Label>
            <Input
              id="edit-class-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!name || updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// === DELETE CLASS DIALOG ===
function DeleteClassDialog({
  open,
  onOpenChange,
  metadataClass,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  metadataClass: MetadataClass | null
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => metadataApi.deleteClass(metadataClass!.id),
    onSuccess: () => {
      toast({ title: 'Classe eliminata' })
      queryClient.invalidateQueries({ queryKey: ['metadata-classes'] })
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
          <AlertDialogTitle>Eliminare la classe?</AlertDialogTitle>
          <AlertDialogDescription>
            Sei sicuro di voler eliminare la classe "{metadataClass?.name}"?
            Tutti i campi associati verranno eliminati.
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

// === FIELD DIALOG (Create/Edit) ===
function FieldDialog({
  open,
  onOpenChange,
  classId,
  field,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string | null
  field: MetadataField | null
}) {
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [type, setType] = useState('TEXT')
  const [isRequired, setIsRequired] = useState(false)
  const [isSearchable, setIsSearchable] = useState(true)
  const [options, setOptions] = useState('')

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const isEdit = !!field

  // Reset form when opening
  const resetForm = () => {
    if (field) {
      setName(field.name)
      setLabel(field.label)
      setType(field.type)
      setIsRequired(field.isRequired)
      setIsSearchable(field.isSearchable)
      setOptions(field.options?.join(', ') || '')
    } else {
      setName('')
      setLabel('')
      setType('TEXT')
      setIsRequired(false)
      setIsSearchable(true)
      setOptions('')
    }
  }

  // Update form when field changes
  if (open && field && name !== field.name) {
    resetForm()
  } else if (open && !field && name !== '') {
    resetForm()
  }

  const createMutation = useMutation({
    mutationFn: () => {
      const data: any = { name, label, type, isRequired, isSearchable }
      if (type === 'SELECT' || type === 'MULTISELECT') {
        data.options = options.split(',').map((o) => o.trim()).filter(Boolean)
      }
      return metadataApi.createField(classId!, data)
    },
    onSuccess: () => {
      toast({ title: 'Campo creato' })
      queryClient.invalidateQueries({ queryKey: ['metadata-classes'] })
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
      const data: any = { label, isRequired, isSearchable }
      if (type === 'SELECT' || type === 'MULTISELECT') {
        data.options = options.split(',').map((o) => o.trim()).filter(Boolean)
      }
      return metadataApi.updateField(field!.id, data)
    },
    onSuccess: () => {
      toast({ title: 'Campo aggiornato' })
      queryClient.invalidateQueries({ queryKey: ['metadata-classes'] })
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
          <DialogTitle>{isEdit ? 'Modifica Campo' : 'Nuovo Campo'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modifica le proprietà del campo' : 'Aggiungi un nuovo campo alla classe'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="field-name">Nome (ID) *</Label>
              <Input
                id="field-name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="es. data_scadenza"
                required
                disabled={isEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field-label">Etichetta *</Label>
              <Input
                id="field-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="es. Data Scadenza"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo campo *</Label>
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
              <Label htmlFor="field-options">Opzioni (separate da virgola)</Label>
              <Input
                id="field-options"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="es. Opzione 1, Opzione 2, Opzione 3"
              />
            </div>
          )}

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="field-required"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked as boolean)}
              />
              <Label htmlFor="field-required" className="cursor-pointer">
                Obbligatorio
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="field-searchable"
                checked={isSearchable}
                onCheckedChange={(checked) => setIsSearchable(checked as boolean)}
              />
              <Label htmlFor="field-searchable" className="cursor-pointer">
                Ricercabile
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!name || !label || isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? 'Salva' : 'Crea Campo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// === DELETE FIELD DIALOG ===
function DeleteFieldDialog({
  open,
  onOpenChange,
  classId,
  field,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string | null
  field: MetadataField | null
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => metadataApi.deleteField(field!.id),
    onSuccess: () => {
      toast({ title: 'Campo eliminato' })
      queryClient.invalidateQueries({ queryKey: ['metadata-classes'] })
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
          <AlertDialogTitle>Eliminare il campo?</AlertDialogTitle>
          <AlertDialogDescription>
            Sei sicuro di voler eliminare il campo "{field?.label}"?
            I valori associati ai documenti verranno eliminati.
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
