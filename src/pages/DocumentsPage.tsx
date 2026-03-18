import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { FileText, Upload, Grid, List, Filter, Eye, Trash2, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { UploadDialog } from '@/components/documents/UploadDialog'
import { PreviewDialog } from '@/components/documents/PreviewDialog'
import { documentsApi, vaultsApi } from '@/lib/api'
import { formatBytes, formatRelativeTime, getMimeTypeLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function DocumentsPage() {
  const { id: vaultId } = useParams()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [search, setSearch] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ id: string; name: string; mimeType: string } | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<{ id: string; name: string } | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const openPreview = (doc: any) => {
    setPreviewDoc({ id: doc.id, name: doc.name, mimeType: doc.mimeType })
    setPreviewOpen(true)
  }

  const handleSendEmail = async (doc: any) => {
    try {
      // Get the download URL
      const response = await documentsApi.download(doc.id)
      const downloadUrl = response.data.data.url

      // Fetch the actual file content
      const fileResponse = await fetch(downloadUrl)
      const blob = await fileResponse.blob()

      // Convert blob to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1]

        // Create .eml file content with attachment
        const boundary = '----=_Part_0_' + Date.now()
        const emlContent = [
          'MIME-Version: 1.0',
          `Subject: ${doc.name}`,
          'X-Unsent: 1',
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          'Content-Type: text/plain; charset=UTF-8',
          'Content-Transfer-Encoding: 7bit',
          '',
          `In allegato: ${doc.name}`,
          '',
          `--${boundary}`,
          `Content-Type: ${doc.mimeType}; name="${doc.name}"`,
          'Content-Transfer-Encoding: base64',
          `Content-Disposition: attachment; filename="${doc.name}"`,
          '',
          base64Data,
          `--${boundary}--`,
        ].join('\r\n')

        // Download the .eml file
        const emlBlob = new Blob([emlContent], { type: 'message/rfc822' })
        const emlUrl = URL.createObjectURL(emlBlob)
        const link = document.createElement('a')
        link.href = emlUrl
        link.download = `${doc.name}.eml`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(emlUrl)

        toast({
          title: 'File email creato',
          description: 'Apri il file .eml scaricato per comporre la mail'
        })
      }
      reader.readAsDataURL(blob)
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante la preparazione',
        variant: 'destructive',
      })
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      toast({ title: 'Documento spostato nel cestino' })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['vaults'] })
      setDeleteDoc(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante l\'eliminazione',
        variant: 'destructive',
      })
    },
  })

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {vault ? vault.name : 'Tutti i Documenti'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {documents.length} documenti
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="w-full sm:w-auto">
          <Upload className="mr-2 h-4 w-4" />
          Carica Documento
        </Button>
        <UploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          defaultVaultId={vaultId}
        />
        <PreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          document={previewDoc}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1">
          <Input
            placeholder="Cerca documenti..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="shrink-0">
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
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full min-w-[600px]">
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
                <th className="py-3 px-4 text-center text-sm font-medium w-12">
                  <Eye className="h-4 w-4 mx-auto" />
                </th>
                <th className="py-3 px-4 text-center text-sm font-medium w-12">
                  <Mail className="h-4 w-4 mx-auto" />
                </th>
                <th className="py-3 px-4 text-center text-sm font-medium w-12">
                  <Trash2 className="h-4 w-4 mx-auto" />
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
                  <td className="py-3 px-4 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault()
                        openPreview(doc)
                      }}
                      title="Anteprima"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault()
                        handleSendEmail(doc)
                      }}
                      title="Invia via email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault()
                        setDeleteDoc({ id: doc.id, name: doc.name })
                      }}
                      title="Elimina"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(open) => !open && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Il documento "{deleteDoc?.name}" verrà spostato nel cestino.
              Potrai ripristinarlo dalla pagina Cestino.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDoc && deleteMutation.mutate(deleteDoc.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
