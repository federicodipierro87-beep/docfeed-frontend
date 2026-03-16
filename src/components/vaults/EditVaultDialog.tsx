import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { vaultsApi, metadataApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface EditVaultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vault: {
    id: string
    name: string
    description?: string | null
    color?: string | null
    metadataClassId?: string | null
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
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: metadataClasses } = useQuery({
    queryKey: ['metadata-classes'],
    queryFn: () => metadataApi.listClasses().then((r) => r.data.data),
    enabled: open,
  })

  useEffect(() => {
    if (vault) {
      setName(vault.name)
      setDescription(vault.description || '')
      setColor(vault.color || COLORS[0])
      setMetadataClassId(vault.metadataClassId || null)
    }
  }, [vault])

  const updateMutation = useMutation({
    mutationFn: () => vaultsApi.update(vault!.id, {
      name,
      description: description || null,
      color,
      metadataClassId: metadataClassId || null,
    }),
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
        <DialogContent className="sm:max-w-[425px]">
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
