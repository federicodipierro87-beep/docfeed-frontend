import { useState, useEffect } from 'react'
import { FileQuestion, Download, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { documentsApi } from '@/lib/api'
import { getMimeTypeLabel } from '@/lib/utils'

interface PreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    id: string
    name: string
    mimeType: string
  } | null
}

export function PreviewDialog({ open, onOpenChange, document }: PreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && document) {
      loadPreview()
    } else {
      setPreviewUrl(null)
      setError(null)
    }
  }, [open, document?.id])

  const loadPreview = async () => {
    if (!document) return
    setLoading(true)
    setError(null)
    try {
      const response = await documentsApi.download(document.id)
      const { url } = response.data.data
      setPreviewUrl(url)
    } catch (err) {
      setError('Errore nel caricamento dell\'anteprima')
      console.error('Preview error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank')
    }
  }

  const canPreview = (mimeType: string) => {
    return (
      mimeType === 'application/pdf' ||
      mimeType.startsWith('image/') ||
      mimeType === 'text/plain' ||
      mimeType === 'text/html'
    )
  }

  const renderPreview = () => {
    if (!document) return null

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Caricamento anteprima...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <FileQuestion className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive">{error}</p>
          <Button onClick={loadPreview} variant="outline" className="mt-4">
            Riprova
          </Button>
        </div>
      )
    }

    if (!canPreview(document.mimeType)) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Anteprima non disponibile</p>
          <p className="text-muted-foreground mb-4">
            Tipo file: {getMimeTypeLabel(document.mimeType)}
          </p>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Scarica per visualizzare
          </Button>
        </div>
      )
    }

    if (!previewUrl) return null

    if (document.mimeType === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-[70vh] rounded-lg border"
          title="PDF Preview"
        />
      )
    }

    if (document.mimeType.startsWith('image/')) {
      return (
        <div className="flex justify-center max-h-[70vh] overflow-auto">
          <img
            src={previewUrl}
            alt={document.name}
            className="max-w-full object-contain rounded-lg"
          />
        </div>
      )
    }

    if (document.mimeType === 'text/plain' || document.mimeType === 'text/html') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-[70vh] rounded-lg border bg-white"
          title="Text Preview"
        />
      )
    }

    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate pr-4">{document?.name}</span>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Scarica
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
