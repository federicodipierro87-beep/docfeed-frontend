import { useQuery } from '@tanstack/react-query'
import { FileText, FolderOpen, Users, HardDrive, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { searchApi, vaultsApi, licenseApi, retentionApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { formatBytes, formatRelativeTime } from '@/lib/utils'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: vaults } = useQuery({
    queryKey: ['vaults'],
    queryFn: () => vaultsApi.list().then((r) => r.data.data),
  })

  const { data: recentDocs } = useQuery({
    queryKey: ['recent-documents'],
    queryFn: () => searchApi.recent(5).then((r) => r.data.data),
  })

  const { data: license } = useQuery({
    queryKey: ['license'],
    queryFn: () => licenseApi.info().then((r) => r.data.data),
  })

  const { data: expiringDocs } = useQuery({
    queryKey: ['expiring-documents'],
    queryFn: () => retentionApi.expiring(30).then((r) => r.data.data),
    enabled: user?.role === 'ADMIN' || user?.role === 'MANAGER',
  })

  const totalDocuments = vaults?.reduce((sum, v) => sum + (v._count?.documents || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Benvenuto, {user?.firstName}!</h1>
        <p className="text-muted-foreground">
          Ecco una panoramica del tuo sistema documentale
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Documenti Totali</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vault</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vaults?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utenti Attivi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {license?.currentUsers || 0}
              <span className="text-sm font-normal text-muted-foreground">
                /{license?.maxUsers === -1 ? '∞' : license?.maxUsers}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Storage Usato</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes((license?.currentStorageGB || 0) * 1024 * 1024 * 1024)}
            </div>
            {license?.maxStorageGB && license.maxStorageGB !== -1 && (
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, (license.currentStorageGB / license.maxStorageGB) * 100)}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Documenti Recenti
            </CardTitle>
            <CardDescription>Ultimi documenti modificati</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDocs && recentDocs.length > 0 ? (
              <div className="space-y-4">
                {recentDocs.map((doc: any) => (
                  <Link
                    key={doc.id}
                    to={`/documents/${doc.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
                  >
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.vault?.name} • {formatRelativeTime(doc.updatedAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nessun documento recente
              </p>
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/documents">Vedi tutti i documenti</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Expiring documents (admin/manager only) */}
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Documenti in Scadenza
              </CardTitle>
              <CardDescription>Prossimi 30 giorni</CardDescription>
            </CardHeader>
            <CardContent>
              {expiringDocs && expiringDocs.length > 0 ? (
                <div className="space-y-4">
                  {expiringDocs.slice(0, 5).map((doc: any) => (
                    <Link
                      key={doc.id}
                      to={`/documents/${doc.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
                    >
                      <FileText className="h-8 w-8 text-orange-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Scade: {new Date(doc.retentionExpiresAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nessun documento in scadenza
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vaults */}
        <Card className={user?.role === 'ADMIN' || user?.role === 'MANAGER' ? '' : 'lg:col-span-1'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              I tuoi Vault
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vaults && vaults.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {vaults.map((vault: any) => (
                  <Link
                    key={vault.id}
                    to={`/vaults/${vault.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors"
                    style={{ borderLeftColor: vault.color || '#6366f1', borderLeftWidth: 4 }}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{vault.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vault._count?.documents || 0} documenti
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nessun vault disponibile
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
