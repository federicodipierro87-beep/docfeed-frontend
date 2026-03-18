import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GitBranch, Plus, Settings, FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkflowConfigDialog } from '@/components/workflows/WorkflowConfigDialog'
import { CreateWorkflowDialog } from '@/components/workflows/CreateWorkflowDialog'
import { workflowsApi } from '@/lib/api'

interface WorkflowState {
  id: string
  name: string
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
  _count?: { documents: number }
}

export default function WorkflowsPage() {
  const [configWorkflow, setConfigWorkflow] = useState<Workflow | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsApi.list().then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Workflow</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci i flussi di approvazione documenti
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Workflow
        </Button>
      </div>

      {/* Workflows */}
      {workflows && workflows.length > 0 ? (
        <div className="space-y-6">
          {workflows.map((workflow: Workflow) => (
            <Card key={workflow.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <GitBranch className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">{workflow.name}</CardTitle>
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 inline mr-1" />
                    {workflow._count?.documents || 0} documenti
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfigWorkflow(workflow)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configura
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* States visualization */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {workflow.states
                    ?.sort((a, b) => a.order - b.order)
                    .map((state, index) => (
                      <div key={state.id} className="flex items-center gap-2">
                        <div
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 whitespace-nowrap"
                          style={{
                            borderColor: state.color,
                            backgroundColor: `${state.color}10`,
                          }}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: state.color }}
                          />
                          <span className="font-medium">{state.name}</span>
                          {state.isInitial && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              Iniziale
                            </span>
                          )}
                          {state.isFinal && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                              Finale
                            </span>
                          )}
                        </div>
                        {index < workflow.states.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    ))}
                </div>

                {/* Status indicator */}
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      workflow.isActive ? 'bg-green-500' : 'bg-muted-foreground'
                    }`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {workflow.isActive ? 'Attivo' : 'Disattivato'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun workflow</p>
            <p className="text-muted-foreground">
              Crea il tuo primo workflow per gestire l'approvazione documenti
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crea Workflow
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Config Dialog */}
      <WorkflowConfigDialog
        open={!!configWorkflow}
        onOpenChange={(open) => !open && setConfigWorkflow(null)}
        workflow={configWorkflow}
      />

      {/* Create Dialog */}
      <CreateWorkflowDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
