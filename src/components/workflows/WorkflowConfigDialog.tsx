import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { workflowsApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface WorkflowState {
  id: string
  name: string
  description?: string
  color: string
  isInitial: boolean
  isFinal: boolean
  order: number
}

interface WorkflowTransition {
  id: string
  name: string
  fromStateId: string
  toStateId: string
  fromState: { name: string }
  toState: { name: string }
}

interface Workflow {
  id: string
  name: string
  description?: string
  isActive: boolean
  states: WorkflowState[]
  transitions: WorkflowTransition[]
}

interface WorkflowConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflow: Workflow | null
}

const COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#6b7280', // Gray
]

export function WorkflowConfigDialog({
  open,
  onOpenChange,
  workflow,
}: WorkflowConfigDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'state' | 'transition'; id: string } | null>(null)

  // New state form
  const [newStateName, setNewStateName] = useState('')
  const [newStateColor, setNewStateColor] = useState(COLORS[0])
  const [newStateIsInitial, setNewStateIsInitial] = useState(false)
  const [newStateIsFinal, setNewStateIsFinal] = useState(false)

  // New transition form
  const [newTransitionName, setNewTransitionName] = useState('')
  const [newTransitionFrom, setNewTransitionFrom] = useState('')
  const [newTransitionTo, setNewTransitionTo] = useState('')

  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (workflow) {
      setName(workflow.name)
      setDescription(workflow.description || '')
      setIsActive(workflow.isActive)
    }
  }, [workflow])

  // Update workflow mutation
  const updateMutation = useMutation({
    mutationFn: () => workflowsApi.update(workflow!.id, { name, description, isActive }),
    onSuccess: () => {
      toast({ title: 'Workflow aggiornato' })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante il salvataggio',
        variant: 'destructive',
      })
    },
  })

  // Create state mutation
  const createStateMutation = useMutation({
    mutationFn: () =>
      workflowsApi.createState(workflow!.id, {
        name: newStateName,
        color: newStateColor,
        isInitial: newStateIsInitial,
        isFinal: newStateIsFinal,
      }),
    onSuccess: () => {
      toast({ title: 'Stato creato' })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      setNewStateName('')
      setNewStateColor(COLORS[0])
      setNewStateIsInitial(false)
      setNewStateIsFinal(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante la creazione',
        variant: 'destructive',
      })
    },
  })

  // Delete state mutation
  const deleteStateMutation = useMutation({
    mutationFn: (stateId: string) => workflowsApi.deleteState(workflow!.id, stateId),
    onSuccess: () => {
      toast({ title: 'Stato eliminato' })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      setDeleteConfirm(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante l\'eliminazione',
        variant: 'destructive',
      })
    },
  })

  // Create transition mutation
  const createTransitionMutation = useMutation({
    mutationFn: () =>
      workflowsApi.createTransition(workflow!.id, {
        name: newTransitionName,
        fromStateId: newTransitionFrom,
        toStateId: newTransitionTo,
      }),
    onSuccess: () => {
      toast({ title: 'Transizione creata' })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      setNewTransitionName('')
      setNewTransitionFrom('')
      setNewTransitionTo('')
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante la creazione',
        variant: 'destructive',
      })
    },
  })

  // Delete transition mutation
  const deleteTransitionMutation = useMutation({
    mutationFn: (transitionId: string) => workflowsApi.deleteTransition(workflow!.id, transitionId),
    onSuccess: () => {
      toast({ title: 'Transizione eliminata' })
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      setDeleteConfirm(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante l\'eliminazione',
        variant: 'destructive',
      })
    },
  })

  if (!workflow) return null

  const states = workflow.states?.sort((a, b) => a.order - b.order) || []
  const transitions = workflow.transitions || []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configura Workflow</DialogTitle>
            <DialogDescription>
              Modifica le impostazioni del workflow, gli stati e le transizioni
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Generale</TabsTrigger>
              <TabsTrigger value="states">Stati ({states.length})</TabsTrigger>
              <TabsTrigger value="transitions">Transizioni ({transitions.length})</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="workflow-name">Nome</Label>
                <Input
                  id="workflow-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflow-description">Descrizione</Label>
                <Input
                  id="workflow-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Stato</Label>
                  <p className="text-sm text-muted-foreground">
                    {isActive ? 'Il workflow è attivo' : 'Il workflow è disattivato'}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salva Modifiche
              </Button>
            </TabsContent>

            {/* States Tab */}
            <TabsContent value="states" className="space-y-4 mt-4">
              {/* Existing states */}
              <div className="space-y-2">
                {states.map((state) => (
                  <div
                    key={state.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ borderLeftColor: state.color, borderLeftWidth: 4 }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: state.color }}
                      />
                      <span className="font-medium">{state.name}</span>
                      {state.isInitial && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Iniziale
                        </span>
                      )}
                      {state.isFinal && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Finale
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm({ type: 'state', id: state.id })}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add new state */}
              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-medium">Aggiungi nuovo stato</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Nome stato"
                    value={newStateName}
                    onChange={(e) => setNewStateName(e.target.value)}
                  />
                  <Select value={newStateColor} onValueChange={setNewStateColor}>
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: newStateColor }}
                          />
                          Colore
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded"
                              style={{ backgroundColor: color }}
                            />
                            {color}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newStateIsInitial}
                      onCheckedChange={(checked) => setNewStateIsInitial(checked as boolean)}
                    />
                    <span className="text-sm">Stato iniziale</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newStateIsFinal}
                      onCheckedChange={(checked) => setNewStateIsFinal(checked as boolean)}
                    />
                    <span className="text-sm">Stato finale</span>
                  </label>
                </div>
                <Button
                  onClick={() => createStateMutation.mutate()}
                  disabled={!newStateName || createStateMutation.isPending}
                  size="sm"
                >
                  {createStateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi Stato
                </Button>
              </div>
            </TabsContent>

            {/* Transitions Tab */}
            <TabsContent value="transitions" className="space-y-4 mt-4">
              {/* Existing transitions */}
              <div className="space-y-2">
                {transitions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nessuna transizione configurata
                  </p>
                ) : (
                  transitions.map((transition) => (
                    <div
                      key={transition.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{transition.fromState?.name}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{transition.toState?.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ({transition.name})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm({ type: 'transition', id: transition.id })}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Add new transition */}
              {states.length >= 2 && (
                <div className="border-t pt-4 space-y-3">
                  <Label className="text-sm font-medium">Aggiungi nuova transizione</Label>
                  <Input
                    placeholder="Nome transizione (es. Approva, Rifiuta)"
                    value={newTransitionName}
                    onChange={(e) => setNewTransitionName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={newTransitionFrom} onValueChange={setNewTransitionFrom}>
                      <SelectTrigger>
                        <SelectValue placeholder="Da stato..." />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={newTransitionTo} onValueChange={setNewTransitionTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="A stato..." />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => createTransitionMutation.mutate()}
                    disabled={
                      !newTransitionName ||
                      !newTransitionFrom ||
                      !newTransitionTo ||
                      createTransitionMutation.isPending
                    }
                    size="sm"
                  >
                    {createTransitionMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Plus className="mr-2 h-4 w-4" />
                    Aggiungi Transizione
                  </Button>
                </div>
              )}
              {states.length < 2 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aggiungi almeno 2 stati per creare transizioni
                </p>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Eliminare {deleteConfirm?.type === 'state' ? 'lo stato' : 'la transizione'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm?.type === 'state') {
                  deleteStateMutation.mutate(deleteConfirm.id)
                } else if (deleteConfirm?.type === 'transition') {
                  deleteTransitionMutation.mutate(deleteConfirm.id)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
