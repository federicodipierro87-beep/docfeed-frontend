import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { workflowsApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface CreateWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkflowDialog({
  open,
  onOpenChange,
}: CreateWorkflowDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: () => workflowsApi.create({ name, description: description || undefined }),
    onSuccess: () => {
      toast({ title: 'Workflow creato' })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo Workflow</DialogTitle>
          <DialogDescription>
            Crea un nuovo workflow per gestire l'approvazione dei documenti
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Nome *</Label>
            <Input
              id="workflow-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Approvazione Contratti"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workflow-description">Descrizione</Label>
            <Input
              id="workflow-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrizione del workflow"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={!name || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crea Workflow
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
