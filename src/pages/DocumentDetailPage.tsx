import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import {
  FileText,
  Download,
  Edit,
  Trash2,
  History,
  Lock,
  Unlock,
  ChevronLeft,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { documentsApi } from '@/lib/api'
import { formatBytes, formatDateTime, getMimeTypeLabel } from '@/lib/utils'

export default function DocumentDetailPage() {
  const { id } = useParams()

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.get(id!).then((r) => r.data.data),
    enabled: !!id,
  })

  const { data: versions } = useQuery({
    queryKey: ['document-versions', id],
    queryFn: () => documentsApi.versions(id!).then((r) => r.data.data),
    enabled: !!id,
  })

  const { data: transitions } = useQuery({
    queryKey: ['document-transitions', id],
    queryFn: () => documentsApi.transitions(id!).then((r) => r.data.data),
    enabled: !!id && !!document?.workflowState,
  })

  const handleDownload = async () => {
    if (!id) return
    try {
      const response = await documentsApi.download(id)
      const { url } = response.data.data
      window.open(url, '_blank')
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Documento non trovato</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/documents"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Torna ai documenti
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{document.name}</h1>
            <p className="text-muted-foreground">
              {document.vault?.name} • {getMimeTypeLabel(document.mimeType)}
            </p>
            {document.workflowState && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-2"
                style={{
                  backgroundColor: `${document.workflowState.color}20`,
                  color: document.workflowState.color,
                }}
              >
                {document.workflowState.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {document.checkedOutBy ? (
            <Button variant="outline" size="sm">
              <Unlock className="h-4 w-4 mr-2" />
              Check-in
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <Lock className="h-4 w-4 mr-2" />
              Check-out
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Modifica
          </Button>
          <Button variant="outline" size="sm" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Workflow transitions */}
      {transitions && transitions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Azioni Workflow</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            {transitions.map((t: any) => (
              <Button
                key={t.id}
                variant="outline"
                size="sm"
                style={{
                  borderColor: t.toState.color,
                  color: t.toState.color,
                }}
              >
                {t.name} → {t.toState.name}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Dettagli</TabsTrigger>
          <TabsTrigger value="versions">
            <History className="h-4 w-4 mr-2" />
            Versioni ({versions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informazioni</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creato da</span>
                  <span>
                    {document.createdBy?.firstName} {document.createdBy?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creato il</span>
                  <span>{formatDateTime(document.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ultima modifica</span>
                  <span>{formatDateTime(document.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensione</span>
                  <span>
                    {document.currentVersion
                      ? formatBytes(document.currentVersion.fileSizeBytes)
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versione</span>
                  <span>v{document.currentVersion?.versionNumber || 1}</span>
                </div>
                {document.checkedOutBy && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">In checkout da</span>
                    <span className="text-orange-500">
                      {document.checkedOutBy.firstName} {document.checkedOutBy.lastName}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {document.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Descrizione</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{document.description}</p>
                </CardContent>
              </Card>
            )}

            {document.tags && document.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tag
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((dt: any) => (
                      <span
                        key={dt.tag.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${dt.tag.color}20`,
                          color: dt.tag.color,
                        }}
                      >
                        {dt.tag.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="versions" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="py-3 px-4 text-left text-sm font-medium">Versione</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Creata da</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Data</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Dimensione</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Commento</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {versions?.map((version: any) => (
                    <tr key={version.id} className="border-b last:border-0">
                      <td className="py-3 px-4 font-medium">
                        v{version.versionNumber}
                        {version.id === document.currentVersion?.id && (
                          <span className="ml-2 text-xs text-primary">(corrente)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {version.createdBy?.firstName} {version.createdBy?.lastName}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDateTime(version.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatBytes(version.fileSizeBytes)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {version.comment || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata" className="mt-6">
          <Card>
            <CardContent className="p-6">
              {document.metadata && document.metadata.length > 0 ? (
                <div className="space-y-4">
                  {document.metadata.map((meta: any) => (
                    <div key={meta.id} className="flex justify-between">
                      <span className="text-muted-foreground">{meta.field.label}</span>
                      <span>
                        {meta.textValue ||
                          meta.numberValue ||
                          (meta.dateValue && formatDateTime(meta.dateValue)) ||
                          (meta.booleanValue !== null
                            ? meta.booleanValue
                              ? 'Sì'
                              : 'No'
                            : null) ||
                          (meta.userRef &&
                            `${meta.userRef.firstName} ${meta.userRef.lastName}`) ||
                          '-'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nessun metadata associato
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
