import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { FileText, Upload, Grid, List, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UploadDialog } from '@/components/documents/UploadDialog'
import { documentsApi, vaultsApi } from '@/lib/api'
import { formatBytes, formatRelativeTime, getMimeTypeLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function DocumentsPage() {
  const { id: vaultId } = useParams()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [search, setSearch] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)

  const { data: vault } = useQuery({
    queryKey: ['vault', vaultId],
    queryFn: () => vaultsApi.get(vaultId!).then((r) => r.data.data),
    enabled: !!vaultId,
  })

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', vaultId, search],
    queryFn: () =>
      documentsApi
        .list({
          ...(vaultId && { vaultId }),
          ...(search && { search }),
          limit: 50,
        })
        .then((r) => r.data.data),
  })

  const documents = documentsData?.items || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {vault ? vault.name : 'Tutti i Documenti'}
          </h1>
          <p className="text-muted-foreground">
            {documents.length} documenti
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Carica Documento
        </Button>
        <UploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          defaultVaultId={vaultId}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Cerca documenti..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
        <div className="flex rounded-md border">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-r-none"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-l-none"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Documents */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun documento</p>
            <p className="text-muted-foreground">
              Carica il tuo primo documento per iniziare
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="rounded-lg border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-3 px-4 text-left text-sm font-medium">Nome</th>
                <th className="py-3 px-4 text-left text-sm font-medium hidden md:table-cell">
                  Vault
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium hidden lg:table-cell">
                  Tipo
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium hidden lg:table-cell">
                  Dimensione
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium">
                  Modificato
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: any) => (
                <tr
                  key={doc.id}
                  className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="flex items-center gap-3"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{doc.name}</p>
                        {doc.workflowState && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `${doc.workflowState.color}20`,
                              color: doc.workflowState.color,
                            }}
                          >
                            {doc.workflowState.name}
                          </span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                    {doc.vault?.name}
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                    {getMimeTypeLabel(doc.mimeType)}
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                    {doc.currentVersion
                      ? formatBytes(doc.currentVersion.fileSizeBytes)
                      : '-'}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {documents.map((doc: any) => (
            <Link key={doc.id} to={`/documents/${doc.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.vault?.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(doc.updatedAt)}
                      </p>
                    </div>
                  </div>
                  {doc.workflowState && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-3"
                      style={{
                        backgroundColor: `${doc.workflowState.color}20`,
                        color: doc.workflowState.color,
                      }}
                    >
                      {doc.workflowState.name}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
