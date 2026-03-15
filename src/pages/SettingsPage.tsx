import { useQuery } from '@tanstack/react-query'
import { Settings, User, Shield, Key, Bell, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/auth.store'
import { licenseApi } from '@/lib/api'
import { formatBytes, formatDate } from '@/lib/utils'

export default function SettingsPage() {
  const { user } = useAuthStore()

  const { data: license } = useQuery({
    queryKey: ['license-stats'],
    queryFn: () => licenseApi.stats().then((r) => r.data.data),
    enabled: user?.role === 'ADMIN',
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground">
          Gestisci il tuo account e le preferenze
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profilo
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Sicurezza
          </TabsTrigger>
          {user?.role === 'ADMIN' && (
            <TabsTrigger value="license">
              <Key className="h-4 w-4 mr-2" />
              Licenza
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Profilo</CardTitle>
              <CardDescription>
                Aggiorna le tue informazioni personali
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input id="firstName" defaultValue={user?.firstName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome</Label>
                  <Input id="lastName" defaultValue={user?.lastName} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} disabled />
                <p className="text-xs text-muted-foreground">
                  L'email non può essere modificata
                </p>
              </div>
              <Button>Salva modifiche</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ruolo e Organizzazione</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ruolo</span>
                <span className="font-medium">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organizzazione</span>
                <span className="font-medium">{user?.organization?.name || '-'}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cambia Password</CardTitle>
              <CardDescription>
                Aggiorna la tua password per mantenere l'account sicuro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Password attuale</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nuova password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Conferma password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button>Cambia password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessioni attive</CardTitle>
              <CardDescription>
                Gestisci le sessioni attive sul tuo account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Sessione corrente</p>
                  <p className="text-sm text-muted-foreground">
                    Questo dispositivo
                  </p>
                </div>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  Attiva
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role === 'ADMIN' && (
          <TabsContent value="license" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dettagli Licenza</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {license ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Piano</span>
                      <span className="font-medium">{license.license?.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scadenza</span>
                      <span className="font-medium">
                        {formatDate(license.license?.validUntil)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Giorni rimanenti</span>
                      <span className="font-medium">{license.daysRemaining}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Caricamento...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Utilizzo Risorse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {license && (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Utenti</span>
                        <span>
                          {license.license?.currentUsers} /{' '}
                          {license.license?.maxUsers === -1
                            ? '∞'
                            : license.license?.maxUsers}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, license.usagePercent?.users || 0)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Storage</span>
                        <span>
                          {formatBytes(
                            (license.license?.currentStorageGB || 0) * 1024 * 1024 * 1024
                          )}{' '}
                          /{' '}
                          {license.license?.maxStorageGB === -1
                            ? '∞'
                            : `${license.license?.maxStorageGB} GB`}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, license.usagePercent?.storage || 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attiva Nuova Licenza</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseKey">Chiave di licenza</Label>
                  <Input id="licenseKey" placeholder="DV-XXXXX..." />
                </div>
                <Button>Attiva Licenza</Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
