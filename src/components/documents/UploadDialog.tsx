import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, X, File, Loader2 } from 'lucide-react'
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
import { documentsApi, metadataApi } from '@/lib/api'
import { formatBytes } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface MetadataClass {
  id: string
  name: string
  description?: string
  vaultId?: string
  vault?: {
    id: string
    name: string
  }
}

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultClassId?: string
}

export function UploadDialog({ open, onOpenChange, defaultClassId }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [classId, setClassId] = useState(defaultClassId || '')

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: classesData } = useQuery({
    queryKey: ['metadata-classes'],
    queryFn: () => metadataApi.listClasses().then((r) => r.data.data),
  })

  const classes: MetadataClass[] = classesData || []

  // Trova il vaultId dalla classe selezionata
  const selectedClass = classes.find((c) => c.id === classId)
  const vaultId = selectedClass?.vaultId || selectedClass?.vault?.id || ''

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !classId) throw new Error('File e classe richiesti')
      if (!vaultId) throw new Error('La classe selezionata non ha un vault associato')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name || file.name)
      formData.append('vaultId', vaultId)
      formData.append('metadataClassId', classId)
      if (description) formData.append('description', description)

      return documentsApi.create(formData)
    },
    onSuccess: () => {
      toast({
        title: 'Documento caricato',
        description: 'Il documento è stato caricato con successo',
      })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['vaults'] })
      handleClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Errore upload',
        description: error.response?.data?.error || 'Errore durante il caricamento',
        variant: 'destructive',
      })
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]
      setFile(selectedFile)
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }, [name])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const handleClose = () => {
    setFile(null)
    setName('')
    setDescription('')
    if (!defaultClassId) setClassId('')
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    uploadMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Carica Documento</DialogTitle>
          <DialogDescription>
            Seleziona un file da caricare nel sistema documentale
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${file ? 'bg-muted/50' : 'hover:border-primary/50'}
            `}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <File className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium">
                  {isDragActive ? 'Rilascia il file qui' : 'Trascina un file o clicca per selezionare'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Max 100MB
                </p>
              </>
            )}
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome documento</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome del documento"
            />
          </div>

          {/* Descrizione */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione (opzionale)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrizione del documento"
            />
          </div>

          {/* Classe Documentale */}
          <div className="space-y-2">
            <Label>Classe Documentale</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona una classe" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                    {cls.vault && (
                      <span className="text-muted-foreground ml-2">
                        ({cls.vault.name})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {classId && !vaultId && (
              <p className="text-sm text-destructive">
                Questa classe non ha un vault associato. Contatta l'amministratore.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={!file || !classId || !vaultId || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Carica
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
