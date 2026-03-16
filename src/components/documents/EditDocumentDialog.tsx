import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { documentsApi, vaultsApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface EditDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    id: string
    name: string
    description?: string | null
    vaultId: string
  } | null
}

export function EditDocumentDialog({ open, onOpenChange, document }: EditDocumentDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [vaultId, setVaultId] = useState('')

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: vaultsData } = useQuery({
    queryKey: ['vaults'],
    queryFn: () => vaultsApi.list().then((r) => r.data.data),
  })

  const vaults = vaultsData || []

  useEffect(() => {
    if (document) {
      setName(document.name)
      setDescription(document.description || '')
      setVaultId(document.vaultId)
    }
  }, [document])

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!document) throw new Error('Documento non trovato')

      return documentsApi.update(document.id, {
        name,
        description: description || null,
        vaultId,
      })
    },
    onSuccess: () => {
      toast({
        title: 'Documento aggiornato',
        description: 'Le modifiche sono state salvate',
      })
      queryClient.invalidateQueries({ queryKey: ['document', document?.id] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifica Documento</DialogTitle>
          <DialogDescription>
            Modifica le informazioni del documento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome documento</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome del documento"
              required
            />
          </div>

          {/* Descrizione */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrizione (opzionale)</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrizione del documento"
            />
          </div>

          {/* Vault */}
          <div className="space-y-2">
            <Label>Vault</Label>
            <Select value={vaultId} onValueChange={setVaultId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un vault" />
              </SelectTrigger>
              <SelectContent>
                {vaults.map((vault: any) => (
                  <SelectItem key={vault.id} value={vault.id}>
                    {vault.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={!name || !vaultId || updateMutation.isPending}
            >
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
  )
}
