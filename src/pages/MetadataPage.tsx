import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Database,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
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
import { metadataApi, attributesApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const FIELD_TYPES: Record<string, string> = {
  TEXT: 'Testo',
  NUMBER: 'Numero',
  DATE: 'Data',
  BOOLEAN: 'Sì/No',
  SELECT: 'Selezione',
  MULTISELECT: 'Multi-selezione',
}

interface Attribute {
  id: string
  name: string
  label: string
  type: string
}

interface ClassAttribute {
  id: string
  attributeId: string
  isRequired: boolean
  order: number
  attribute: Attribute
}

interface MetadataClass {
  id: string
  name: string
  description?: string
  classAttributes: ClassAttribute[]
  _count?: { vaults: number }
}

export default function MetadataPage() {
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set())
  const [createClassOpen, setCreateClassOpen] = useState(false)
  const [editClass, setEditClass] = useState<MetadataClass | null>(null)
  const [deleteClass, setDeleteClass] = useState<MetadataClass | null>(null)
  const [addAttrToClass, setAddAttrToClass] = useState<string | null>(null)

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

  const removeAttributeMutation = useMutation({
    mutationFn: ({ classId, attributeId }: { classId: string; attributeId: string }) =>
      metadataApi.removeAttribute(classId, attributeId),
    onSuccess: () => {
      toast({ title: 'Attributo rimosso dalla classe' })
      queryClient.invalidateQueries({ queryKey: ['metadata-classes'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore',
        variant: 'destructive',
      })
    },
  })

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
            Crea classi e assegna gli attributi da usare nei vault
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
                      {cls.classAttributes?.length || 0} attributi
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
                      size="sm"
                      onClick={() => setAddAttrToClass(cls.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Attributo
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
                  {cls.classAttributes && cls.classAttributes.length > 0 ? (
                    <div className="border rounded-md">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-2 px-3 text-left text-sm font-medium">Nome</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Etichetta</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Tipo</th>
                            <th className="py-2 px-3 text-center text-sm font-medium">Obbligatorio</th>
                            <th className="py-2 px-3 text-right text-sm font-medium">Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cls.classAttributes.map((ca) => (
                            <tr key={ca.id} className="border-b last:border-0">
                              <td className="py-2 px-3 font-mono text-sm">{ca.attribute.name}</td>
                              <td className="py-2 px-3">{ca.attribute.label}</td>
                              <td className="py-2 px-3">
                                <Badge variant="outline">
                                  {FIELD_TYPES[ca.attribute.type] || ca.attribute.type}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-center">
                                {ca.isRequired ? '✓' : '-'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeAttributeMutation.mutate({
                                      classId: cls.id,
                                      attributeId: ca.attributeId,
                                    })
                                  }
                                  disabled={removeAttributeMutation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nessun attributo assegnato.{' '}
                      <button
                        className="text-primary hover:underline"
                        onClick={() => setAddAttrToClass(cls.id)}
                      >
                        Aggiungi attributi
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
            <p className="text-lg font-medium">Nessuna classe</p>
            <p className="text-muted-foreground">
              Crea la prima classe per raggruppare gli attributi
            </p>
            <Button className="mt-4" onClick={() => setCreateClassOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crea Classe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Class Dialog */}
      <CreateClassDialog open={createClassOpen} onOpenChange={setCreateClassOpen} />

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

      {/* Add Attribute Dialog */}
      <AddAttributeDialog
        open={!!addAttrToClass}
        onOpenChange={(open) => !open && setAddAttrToClass(null)}
        classId={addAttrToClass}
        existingAttributeIds={
          classes
            ?.find((c: MetadataClass) => c.id === addAttrToClass)
            ?.classAttributes?.map((ca: ClassAttribute) => ca.attributeId) || []
        }
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
      toast({ title: 'Classe creata' })
      queryClient.invalidateQueries({ queryKey: ['metadata-classes'] })
      onOpenChange(false)
      setName('')
      setDescription('')
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore',
        variant: 'destructive',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuova Classe</DialogTitle>
          <DialogDescription>
            Crea una nuova classe per raggruppare gli attributi
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
            <Label htmlFor="class-name">Nome *</Label>
            <Input
              id="class-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Contratto, Fattura..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-description">Descrizione</Label>
            <Input
              id="class-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrizione della classe"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!name || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Crea
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

  if (metadataClass && name !== metadataClass.name) {
    setName(metadataClass.name)
    setDescription(metadataClass.description || '')
  }

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
        description: error.response?.data?.error || 'Errore',
        variant: 'destructive',
      })
    },
  })

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
            <Label htmlFor="edit-class-name">Nome *</Label>
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
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
        description: error.response?.data?.error || 'Errore',
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
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Elimina
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// === ADD ATTRIBUTE DIALOG ===
function AddAttributeDialog({
  open,
  onOpenChange,
  classId,
  existingAttributeIds,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string | null
  existingAttributeIds: string[]
}) {
  const [selectedAttributeId, setSelectedAttributeId] = useState<string>('')
  const [isRequired, setIsRequired] = useState(false)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: attributes } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => attributesApi.list().then((r) => r.data.data),
    enabled: open,
  })

  // Filter out already assigned attributes
  const availableAttributes = attributes?.filter(
    (attr: Attribute) => !existingAttributeIds.includes(attr.id)
  )

  const addMutation = useMutation({
    mutationFn: () =>
      metadataApi.addAttribute(classId!, { attributeId: selectedAttributeId, isRequired }),
    onSuccess: () => {
      toast({ title: 'Attributo aggiunto alla classe' })
      queryClient.invalidateQueries({ queryKey: ['metadata-classes'] })
      onOpenChange(false)
      setSelectedAttributeId('')
      setIsRequired(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore',
        variant: 'destructive',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi Attributo</DialogTitle>
          <DialogDescription>Seleziona un attributo da aggiungere alla classe</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Attributo</Label>
            <Select value={selectedAttributeId} onValueChange={setSelectedAttributeId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un attributo" />
              </SelectTrigger>
              <SelectContent>
                {availableAttributes?.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Tutti gli attributi sono già assegnati
                  </div>
                ) : (
                  availableAttributes?.map((attr: Attribute) => (
                    <SelectItem key={attr.id} value={attr.id}>
                      {attr.label} ({attr.name})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="add-attr-required"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(checked as boolean)}
            />
            <Label htmlFor="add-attr-required" className="cursor-pointer">
              Obbligatorio in questa classe
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={!selectedAttributeId || addMutation.isPending}
          >
            {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Aggiungi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
