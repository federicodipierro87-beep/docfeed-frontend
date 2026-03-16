import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, RotateCcw, AlertTriangle, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { documentsApi } from '@/lib/api'
import { formatBytes, formatRelativeTime, getMimeTypeLabel } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function TrashPage() {
  const [restoreDoc, setRestoreDoc] = useState<{ id: string; name: string } | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<{ id: string; name: string } | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: trashData, isLoading } = useQuery({
    queryKey: ['documents-trash'],
    queryFn: () => documentsApi.trash().then((r) => r.data.data),
  })

  const documents = trashData?.items || []

  const restoreMutation = useMutation({
    mutationFn: (id: string) => documentsApi.restore(id),
    onSuccess: () => {
      toast({
        title: 'Documento ripristinato',
        description: 'Il documento è stato recuperato dal cestino',
      })
      queryClient.invalidateQueries({ queryKey: ['documents-trash'] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['vaults'] })
      setRestoreDoc(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante il ripristino',
        variant: 'destructive',
      })
    },
  })

  const permanentDeleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.permanentDelete(id),
    onSuccess: () => {
      toast({
        title: 'Documento eliminato definitivamente',
        description: 'Il documento è stato rimosso permanentemente',
      })
      queryClient.invalidateQueries({ queryKey: ['documents-trash'] })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trash2 className="h-6 w-6" />
          Cestino
        </h1>
        <p className="text-muted-foreground">
          {documents.length} documenti eliminati
        </p>
      </div>

      {/* Documents */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Cestino vuoto</p>
            <p className="text-muted-foreground">
              I documenti eliminati appariranno qui
            </p>
          </CardContent>
        </Card>
      ) : (
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
                <th className="py-3 px-4 text-left text-sm font-medium">
                  Eliminato
                </th>
                <th className="py-3 px-4 text-right text-sm font-medium">
                  Azioni
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
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                    {doc.vault?.name}
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                    {getMimeTypeLabel(doc.mimeType)}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {formatRelativeTime(doc.deletedAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRestoreDoc({ id: doc.id, name: doc.name })}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Ripristina
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteDoc({ id: doc.id, name: doc.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Restore Dialog */}
      <Dialog open={!!restoreDoc} onOpenChange={() => setRestoreDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ripristina Documento</DialogTitle>
            <DialogDescription>
              Vuoi ripristinare il documento "{restoreDoc?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDoc(null)}>
              Annulla
            </Button>
            <Button
              onClick={() => restoreDoc && restoreMutation.mutate(restoreDoc.id)}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Ripristina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Dialog */}
      <Dialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Eliminazione Definitiva
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare definitivamente "{deleteDoc?.name}"?
              <br />
              <strong className="text-destructive">Questa azione non può essere annullata.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDoc && permanentDeleteMutation.mutate(deleteDoc.id)}
              disabled={permanentDeleteMutation.isPending}
            >
              {permanentDeleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Elimina Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
