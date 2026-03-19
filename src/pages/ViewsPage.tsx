import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FolderSearch,
  Plus,
  Play,
  Settings,
  Trash2,
  FileText,
  Filter,
  Globe,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { viewsApi, vaultsApi, workflowsApi, tagsApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { formatRelativeTime, formatBytes } from '@/lib/utils'

const colors = [
  '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

const statusOptions = [
  { value: '_all', label: 'Tutti gli stati' },
  { value: 'DRAFT', label: 'Bozza' },
  { value: 'ACTIVE', label: 'Attivo' },
  { value: 'ARCHIVED', label: 'Archiviato' },
]

const mimeTypeOptions = [
  { value: '_all', label: 'Tutti i tipi' },
  { value: 'application/pdf', label: 'PDF' },
  { value: 'image/', label: 'Immagini' },
  { value: 'text/', label: 'Testo' },
  { value: 'application/vnd', label: 'Office' },
]

interface SavedView {
  id: string
  name: string
  description?: string
  color?: string
  filters: Record<string, any>
  isPublic: boolean
  createdBy: { id: string; firstName: string; lastName: string }
  createdAt: string
}

interface ViewResult {
  view: SavedView
  documents: any[]
  count: number
}

export default function ViewsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editView, setEditView] = useState<SavedView | null>(null)
  const [deleteView, setDeleteView] = useState<SavedView | null>(null)
  const [executeResult, setExecuteResult] = useState<ViewResult | null>(null)
  const [expandedFilters, setExpandedFilters] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [isPublic, setIsPublic] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch data
  const { data: views, isLoading } = useQuery({
    queryKey: ['views'],
    queryFn: () => viewsApi.list().then((r) => r.data.data),
  })

  const { data: vaults } = useQuery({
    queryKey: ['vaults'],
    queryFn: () => vaultsApi.list().then((r) => r.data.data),
  })

  const { data: workflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsApi.list().then((r) => r.data.data),
  })

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list().then((r) => r.data.data),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => viewsApi.create(data),
    onSuccess: () => {
      toast({ title: 'Vista creata' })
      queryClient.invalidateQueries({ queryKey: ['views'] })
      setCreateOpen(false)
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
    mutationFn: ({ id, data }: { id: string; data: any }) => viewsApi.update(id, data),
    onSuccess: () => {
      toast({ title: 'Vista aggiornata' })
      queryClient.invalidateQueries({ queryKey: ['views'] })
      setEditView(null)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante l\'aggiornamento',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => viewsApi.delete(id),
    onSuccess: () => {
      toast({ title: 'Vista eliminata' })
      queryClient.invalidateQueries({ queryKey: ['views'] })
      setDeleteView(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante l\'eliminazione',
        variant: 'destructive',
      })
    },
  })

  const executeMutation = useMutation({
    mutationFn: (id: string) => viewsApi.execute(id),
    onSuccess: (response) => {
      setExecuteResult(response.data.data)
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante l\'esecuzione',
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setName('')
    setDescription('')
    setColor('#6366f1')
    setIsPublic(false)
    setFilters({})
  }

  const openEdit = (view: SavedView) => {
    setName(view.name)
    setDescription(view.description || '')
    setColor(view.color || '#6366f1')
    setIsPublic(view.isPublic)
    setFilters(view.filters || {})
    setEditView(view)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate({ name, description, color, filters, isPublic })
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editView || !name.trim()) return
    updateMutation.mutate({
      id: editView.id,
      data: { name, description, color, filters, isPublic },
    })
  }

  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => {
      if (value === '' || value === null || value === undefined || value === '_all') {
        const { [key]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [key]: value }
    })
  }

  const getActiveFiltersCount = (f: Record<string, any>) => {
    return Object.keys(f).filter((k) => f[k] !== '' && f[k] !== null && f[k] !== undefined).length
  }

  const FiltersForm = () => (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpandedFilters(!expandedFilters)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtri</span>
          {getActiveFiltersCount(filters) > 0 && (
            <Badge variant="secondary">{getActiveFiltersCount(filters)} attivi</Badge>
          )}
        </div>
        {expandedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>

      {expandedFilters && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Vault</Label>
            <Select
              value={filters.vaultId || '_all'}
              onValueChange={(v) => updateFilter('vaultId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tutti i vault" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Tutti i vault</SelectItem>
                {vaults?.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stato</Label>
            <Select
              value={filters.status || '_all'}
              onValueChange={(v) => updateFilter('status', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo file</Label>
            <Select
              value={filters.mimeType || '_all'}
              onValueChange={(v) => updateFilter('mimeType', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tutti i tipi" />
              </SelectTrigger>
              <SelectContent>
                {mimeTypeOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Testo ricerca</Label>
            <Input
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Cerca nel nome..."
            />
          </div>

          <div className="space-y-2">
            <Label>Creato dopo</Label>
            <Input
              type="date"
              value={filters.createdAfter || ''}
              onChange={(e) => updateFilter('createdAfter', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Creato prima</Label>
            <Input
              type="date"
              value={filters.createdBefore || ''}
              onChange={(e) => updateFilter('createdBefore', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Modificato dopo</Label>
            <Input
              type="date"
              value={filters.updatedAfter || ''}
              onChange={(e) => updateFilter('updatedAfter', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Modificato prima</Label>
            <Input
              type="date"
              value={filters.updatedBefore || ''}
              onChange={(e) => updateFilter('updatedBefore', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Se stiamo visualizzando i risultati di una vista
  if (executeResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <FolderSearch className="h-6 w-6" style={{ color: executeResult.view.color }} />
              {executeResult.view.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {executeResult.count} documenti trovati
            </p>
          </div>
          <Button variant="outline" onClick={() => setExecuteResult(null)}>
            Torna alle viste
          </Button>
        </div>

        {executeResult.documents.length > 0 ? (
          <div className="rounded-lg border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left text-sm font-medium">Nome</th>
                  <th className="py-3 px-4 text-left text-sm font-medium hidden md:table-cell">Vault</th>
                  <th className="py-3 px-4 text-left text-sm font-medium hidden lg:table-cell">Dimensione</th>
                  <th className="py-3 px-4 text-left text-sm font-medium">Modificato</th>
                </tr>
              </thead>
              <tbody>
                {executeResult.documents.map((doc: any) => (
                  <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <Link to={`/documents/${doc.id}`} className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          {doc.workflowState && (
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: doc.workflowState.color,
                                color: doc.workflowState.color,
                              }}
                            >
                              {doc.workflowState.name}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {doc.vault?.name}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                      {doc.currentVersion ? formatBytes(doc.currentVersion.fileSizeBytes) : '-'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {formatRelativeTime(doc.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nessun documento</p>
              <p className="text-muted-foreground">
                I filtri di questa vista non corrispondono a nessun documento
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Viste</h1>
          <p className="text-sm text-muted-foreground">
            Ricerche salvate come cartelle virtuali
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuova Vista
        </Button>
      </div>

      {/* Views grid */}
      {views && views.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {views.map((view: SavedView) => (
            <Card
              key={view.id}
              style={{ borderTopColor: view.color || '#6366f1', borderTopWidth: 4 }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderSearch className="h-5 w-5" style={{ color: view.color }} />
                  {view.name}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {view.isPublic ? (
                    <Globe className="h-4 w-4 text-muted-foreground" title="Pubblica" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" title="Privata" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {view.description && (
                  <p className="text-sm text-muted-foreground mb-3">{view.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <span>{getActiveFiltersCount(view.filters)} filtri attivi</span>
                  <span>•</span>
                  <span>di {view.createdBy.firstName}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => executeMutation.mutate(view.id)}
                    disabled={executeMutation.isPending}
                  >
                    <Play className="mr-1 h-3 w-3" />
                    Esegui
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(view)}>
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteView(view)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderSearch className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessuna vista</p>
            <p className="text-muted-foreground">
              Crea la tua prima vista per salvare una ricerca
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crea Vista
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuova Vista</DialogTitle>
            <DialogDescription>
              Crea una vista per salvare una ricerca con filtri personalizzati
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome della vista"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrizione opzionale"
              />
            </div>

            <div className="space-y-2">
              <Label>Colore</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${
                      color === c ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isPublic">Vista pubblica</Label>
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            <FiltersForm />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Crea
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editView} onOpenChange={(open) => { if (!open) { setEditView(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Vista</DialogTitle>
            <DialogDescription>
              Modifica i filtri e le impostazioni della vista
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome della vista"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrizione</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrizione opzionale"
              />
            </div>

            <div className="space-y-2">
              <Label>Colore</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${
                      color === c ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isPublic">Vista pubblica</Label>
              <Switch
                id="edit-isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            <FiltersForm />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditView(null)}>
                Annulla
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Salva
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteView} onOpenChange={(open) => !open && setDeleteView(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la vista?</AlertDialogTitle>
            <AlertDialogDescription>
              La vista "{deleteView?.name}" verrà eliminata permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteView && deleteMutation.mutate(deleteView.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
