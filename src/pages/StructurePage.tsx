import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, FolderOpen, Layers, Tag, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { vaultsApi, metadataApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { CreateVaultDialog } from '@/components/vaults/CreateVaultDialog'

// Tipo per attributo
interface Attribute {
  id: string
  attribute: {
    id: string
    name: string
    label: string
    type: string
  }
  isRequired: boolean
}

// Tipo per classe
interface MetadataClass {
  id: string
  name: string
  description?: string
  classAttributes?: Attribute[]
  children?: MetadataClass[]
  parent?: { id: string; name: string }
}

// Tipo per vault
interface Vault {
  id: string
  name: string
  description?: string
  color?: string
  metadataClass?: MetadataClass
  _count?: { documents: number }
}

export default function StructurePage() {
  const [expandedVaults, setExpandedVaults] = useState<Set<string>>(new Set())
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set())
  const [createVaultOpen, setCreateVaultOpen] = useState(false)

  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  // Fetch vaults
  const { data: vaults, isLoading: vaultsLoading } = useQuery({
    queryKey: ['vaults'],
    queryFn: () => vaultsApi.list().then((r) => r.data.data),
  })

  // Fetch classi con attributi
  const { data: classes } = useQuery({
    queryKey: ['metadata-classes'],
    queryFn: () => metadataApi.listClasses().then((r) => r.data.data),
  })

  // Mappa classi per ID per lookup veloce
  const classesMap = new Map<string, MetadataClass>()
  classes?.forEach((c: MetadataClass) => classesMap.set(c.id, c))

  const toggleVault = (id: string) => {
    setExpandedVaults((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleClass = (id: string) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      TEXT: 'Testo',
      NUMBER: 'Numero',
      DATE: 'Data',
      BOOLEAN: 'Si/No',
      SELECT: 'Selezione',
      MULTISELECT: 'Selezione multipla',
    }
    return types[type] || type
  }

  if (vaultsLoading) {
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
          <h1 className="text-xl sm:text-2xl font-bold">Struttura Gerarchica</h1>
          <p className="text-sm text-muted-foreground">
            Vault → Classi → Attributi
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateVaultOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Vault
          </Button>
        )}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-blue-500" />
          <span>Vault (Cliente)</span>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-purple-500" />
          <span>Classe</span>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-500" />
          <span>Attributo</span>
        </div>
      </div>

      {/* Albero gerarchico */}
      <Card>
        <CardContent className="p-4">
          {vaults && vaults.length > 0 ? (
            <div className="space-y-1">
              {vaults.map((vault: Vault) => {
                const isVaultExpanded = expandedVaults.has(vault.id)
                const fullClass = vault.metadataClass
                  ? classesMap.get(vault.metadataClass.id)
                  : null

                return (
                  <div key={vault.id}>
                    {/* Vault row */}
                    <div
                      className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                      onClick={() => toggleVault(vault.id)}
                    >
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                        {vault.metadataClass ? (
                          isVaultExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )
                        ) : (
                          <span className="w-4" />
                        )}
                      </Button>
                      <FolderOpen
                        className="h-5 w-5"
                        style={{ color: vault.color || '#3b82f6' }}
                      />
                      <span className="font-medium">{vault.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {vault._count?.documents || 0} doc
                      </Badge>
                      {!vault.metadataClass && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (nessuna classe)
                        </span>
                      )}
                    </div>

                    {/* Classe del vault */}
                    {isVaultExpanded && fullClass && (
                      <div className="ml-6 border-l-2 border-muted pl-2">
                        <div
                          className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleClass(fullClass.id)
                          }}
                        >
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                            {fullClass.classAttributes &&
                            fullClass.classAttributes.length > 0 ? (
                              expandedClasses.has(fullClass.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )
                            ) : (
                              <span className="w-4" />
                            )}
                          </Button>
                          <Layers className="h-5 w-5 text-purple-500" />
                          <span>{fullClass.name}</span>
                          {fullClass.parent && (
                            <span className="text-xs text-muted-foreground">
                              (in {fullClass.parent.name})
                            </span>
                          )}
                          <Badge variant="outline" className="ml-2">
                            {fullClass.classAttributes?.length || 0} attr
                          </Badge>
                        </div>

                        {/* Attributi della classe */}
                        {expandedClasses.has(fullClass.id) &&
                          fullClass.classAttributes &&
                          fullClass.classAttributes.length > 0 && (
                            <div className="ml-6 border-l-2 border-muted pl-2 space-y-1">
                              {fullClass.classAttributes.map((ca: Attribute) => (
                                <div
                                  key={ca.id}
                                  className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded"
                                >
                                  <span className="w-6" />
                                  <Tag className="h-4 w-4 text-green-500" />
                                  <span>{ca.attribute.label}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {getTypeLabel(ca.attribute.type)}
                                  </Badge>
                                  {ca.isRequired && (
                                    <Badge variant="destructive" className="text-xs">
                                      Obbligatorio
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun vault presente</p>
              {isAdmin && (
                <Button className="mt-4" onClick={() => setCreateVaultOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crea il primo Vault
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info box */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Come funziona la gerarchia</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • <strong>Vault</strong>: Contenitore principale (es. nome cliente)
            </li>
            <li>
              • <strong>Classe</strong>: Tipo di documento con i suoi metadati
            </li>
            <li>
              • <strong>Attributi</strong>: Campi specifici della classe
            </li>
          </ul>
        </CardContent>
      </Card>

      <CreateVaultDialog open={createVaultOpen} onOpenChange={setCreateVaultOpen} />
    </div>
  )
}
