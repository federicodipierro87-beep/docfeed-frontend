import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FolderOpen, Plus, Settings, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateVaultDialog } from '@/components/vaults/CreateVaultDialog'
import { EditVaultDialog } from '@/components/vaults/EditVaultDialog'
import { vaultsApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export default function VaultsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editVault, setEditVault] = useState<{
    id: string
    name: string
    description?: string | null
    color?: string | null
  } | null>(null)

  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const { data: vaults, isLoading } = useQuery({
    queryKey: ['vaults'],
    queryFn: () => vaultsApi.list().then((r) => r.data.data),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vault</h1>
          <p className="text-muted-foreground">
            Gestisci i tuoi archivi documentali
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Vault
          </Button>
        )}
      </div>

      {/* Vaults grid */}
      {vaults && vaults.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vaults.map((vault: any) => (
            <Card
              key={vault.id}
              className="hover:shadow-md transition-shadow"
              style={{ borderTopColor: vault.color || '#6366f1', borderTopWidth: 4 }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen
                    className="h-5 w-5"
                    style={{ color: vault.color || '#6366f1' }}
                  />
                  {vault.name}
                </CardTitle>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditVault({
                        id: vault.id,
                        name: vault.name,
                        description: vault.description,
                        color: vault.color,
                      })
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {vault.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {vault.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {vault._count?.documents || 0} documenti
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/vaults/${vault.id}`}>Apri</Link>
                  </Button>
                </div>
                {vault.metadataClass && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Classe: {vault.metadataClass.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun vault</p>
            <p className="text-muted-foreground">
              {isAdmin
                ? 'Crea il tuo primo vault per organizzare i documenti'
                : 'Nessun vault disponibile'}
            </p>
            {isAdmin && (
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crea Vault
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Vault Dialog */}
      <CreateVaultDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Edit Vault Dialog */}
      <EditVaultDialog
        open={!!editVault}
        onOpenChange={(open) => !open && setEditVault(null)}
        vault={editVault}
      />
    </div>
  )
}
