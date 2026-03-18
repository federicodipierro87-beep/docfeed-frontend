import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Settings, Trash2, UserPlus, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { userGroupsApi, usersApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { getInitials } from '@/lib/utils'

const colors = [
  '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

interface Group {
  id: string
  name: string
  description?: string
  color: string
  members: Array<{
    id: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      role: string
    }
  }>
  _count: { members: number }
}

export default function UserGroupsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editGroup, setEditGroup] = useState<Group | null>(null)
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null)
  const [addMemberGroup, setAddMemberGroup] = useState<Group | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: groups, isLoading } = useQuery({
    queryKey: ['user-groups'],
    queryFn: () => userGroupsApi.list().then((r) => r.data.data),
  })

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list({ limit: 100 }).then((r) => r.data.data),
  })

  const users = usersData?.items || []

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; color: string }) =>
      userGroupsApi.create(data),
    onSuccess: () => {
      toast({ title: 'Gruppo creato' })
      queryClient.invalidateQueries({ queryKey: ['user-groups'] })
      setCreateOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante la creazione',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      userGroupsApi.update(id, data),
    onSuccess: () => {
      toast({ title: 'Gruppo aggiornato' })
      queryClient.invalidateQueries({ queryKey: ['user-groups'] })
      setEditGroup(null)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante l\'aggiornamento',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userGroupsApi.delete(id),
    onSuccess: () => {
      toast({ title: 'Gruppo eliminato' })
      queryClient.invalidateQueries({ queryKey: ['user-groups'] })
      setDeleteGroup(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante l\'eliminazione',
        variant: 'destructive',
      })
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      userGroupsApi.addMember(groupId, userId),
    onSuccess: () => {
      toast({ title: 'Membro aggiunto' })
      queryClient.invalidateQueries({ queryKey: ['user-groups'] })
      setAddMemberGroup(null)
      setSelectedUserId('')
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante l\'aggiunta',
        variant: 'destructive',
      })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      userGroupsApi.removeMember(groupId, userId),
    onSuccess: () => {
      toast({ title: 'Membro rimosso' })
      queryClient.invalidateQueries({ queryKey: ['user-groups'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Errore',
        description: error.response?.data?.error || 'Errore durante la rimozione',
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setName('')
    setDescription('')
    setColor('#6366f1')
  }

  const openEdit = (group: Group) => {
    setName(group.name)
    setDescription(group.description || '')
    setColor(group.color)
    setEditGroup(group)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate({ name, description, color })
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editGroup || !name.trim()) return
    updateMutation.mutate({ id: editGroup.id, data: { name, description, color } })
  }

  // Filtra utenti non già nel gruppo
  const availableUsers = addMemberGroup
    ? users.filter(
        (u: any) => !addMemberGroup.members.some((m) => m.user.id === u.id)
      )
    : []

  if (isLoading) {
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
          <h1 className="text-xl sm:text-2xl font-bold">Gruppi Utenti</h1>
          <p className="text-sm text-muted-foreground">
            Organizza gli utenti in gruppi
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Gruppo
        </Button>
      </div>

      {/* Groups grid */}
      {groups && groups.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group: Group) => (
            <Card
              key={group.id}
              style={{ borderTopColor: group.color, borderTopWidth: 4 }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" style={{ color: group.color }} />
                  {group.name}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAddMemberGroup(group)}
                    title="Aggiungi membro"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(group)}
                    title="Modifica"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteGroup(group)}
                    title="Elimina"
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {group.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {group.description}
                  </p>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {group._count.members} membri
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.members.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-2 py-1"
                      >
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs"
                        >
                          {getInitials(member.user.firstName, member.user.lastName)}
                        </div>
                        <span className="text-sm">
                          {member.user.firstName} {member.user.lastName}
                        </span>
                        <button
                          onClick={() =>
                            removeMemberMutation.mutate({
                              groupId: group.id,
                              userId: member.user.id,
                            })
                          }
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <UserMinus className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {group.members.length > 5 && (
                      <Badge variant="secondary">
                        +{group.members.length - 5} altri
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessun gruppo</p>
            <p className="text-muted-foreground">
              Crea il tuo primo gruppo per organizzare gli utenti
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crea Gruppo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Gruppo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome del gruppo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrizione opzionale"
              />
            </div>
            <div className="space-y-2">
              <Label>Colore</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${
                      color === c ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Crea
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editGroup} onOpenChange={(open) => { if (!open) { setEditGroup(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Gruppo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome del gruppo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrizione</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrizione opzionale"
              />
            </div>
            <div className="space-y-2">
              <Label>Colore</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${
                      color === c ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditGroup(null)}>
                Annulla
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Salva
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteGroup} onOpenChange={(open) => !open && setDeleteGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il gruppo?</AlertDialogTitle>
            <AlertDialogDescription>
              Il gruppo "{deleteGroup?.name}" verrà eliminato permanentemente.
              Gli utenti non verranno eliminati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGroup && deleteMutation.mutate(deleteGroup.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Member Dialog */}
      <Dialog open={!!addMemberGroup} onOpenChange={(open) => { if (!open) { setAddMemberGroup(null); setSelectedUserId(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Membro a {addMemberGroup?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seleziona Utente</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un utente" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddMemberGroup(null)}>
                Annulla
              </Button>
              <Button
                onClick={() =>
                  addMemberGroup &&
                  selectedUserId &&
                  addMemberMutation.mutate({
                    groupId: addMemberGroup.id,
                    userId: selectedUserId,
                  })
                }
                disabled={!selectedUserId || addMemberMutation.isPending}
              >
                Aggiungi
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
