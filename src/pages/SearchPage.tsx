import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, FileText, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { searchApi, vaultsApi, tagsApi } from '@/lib/api'
import { formatBytes, formatRelativeTime, getMimeTypeLabel } from '@/lib/utils'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedVault, setSelectedVault] = useState<string | null>(null)

  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['search', query, selectedVault],
    queryFn: () =>
      searchApi
        .search({
          q: query,
          ...(selectedVault && { vaultId: selectedVault }),
          limit: 50,
        })
        .then((r) => r.data.data),
    enabled: query.length > 0,
  })

  const { data: vaults } = useQuery({
    queryKey: ['vaults'],
    queryFn: () => vaultsApi.list().then((r) => r.data.data),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query })
      refetch()
    }
  }

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
    }
  }, [searchParams])

  const documents = results?.items || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Ricerca</h1>
        <p className="text-sm text-muted-foreground">
          Cerca tra tutti i tuoi documenti
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cerca documenti..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1 sm:flex-none">Cerca</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Filtri</span>
          </Button>
        </div>
      </form>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Vault</label>
                <select
                  className="border rounded-md px-3 py-2 text-sm"
                  value={selectedVault || ''}
                  onChange={(e) => setSelectedVault(e.target.value || null)}
                >
                  <option value="">Tutti i vault</option>
                  {vaults?.map((vault: any) => (
                    <option key={vault.id} value={vault.id}>
                      {vault.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {selectedVault && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filtri attivi:</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedVault(null)}
                >
                  {vaults?.find((v: any) => v.id === selectedVault)?.name}
                  <X className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : query && documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun risultato</p>
            <p className="text-muted-foreground">
              Prova con termini di ricerca diversi
            </p>
          </CardContent>
        </Card>
      ) : documents.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {documents.length} risultati per "{query}"
          </p>

          <div className="space-y-3">
            {documents.map((doc: any) => (
              <Link key={doc.id} to={`/documents/${doc.id}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{doc.name}</h3>
                          {doc.matchedIn && doc.matchedIn.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              (trovato in: {doc.matchedIn.join(', ')})
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {doc.vault?.name} • {getMimeTypeLabel(doc.mimeType)} •{' '}
                          {doc.currentVersion
                            ? formatBytes(doc.currentVersion.fileSizeBytes)
                            : ''}
                        </p>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {doc.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
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
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(doc.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Inizia una ricerca</p>
            <p className="text-muted-foreground">
              Inserisci un termine per cercare nei tuoi documenti
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
