'use client'

// Esta página não deve ser exportada estaticamente (usa API)
export const dynamic = 'error'

import { useState, useEffect } from 'react'
import {
  useUpdateUserMutation,
  useCreateUserMutation,
  useDeleteUserMutation,
  useUsersQuery,
  type User,
} from '@/hooks/queries/useUsersQuery'
import { PageTransition } from '@/components/PageTransition'
import { Users, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SearchInput } from '@/components/SearchInput'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLES, ROLE_LABELS, type UserRole } from '@/lib/permissions'

const ALL_ROLES = 'Todos os papéis'
const RECENT_USER_DAYS = 7

function isRecentUser(createdAt: string) {
  const limit = Date.now() - RECENT_USER_DAYS * 24 * 60 * 60 * 1000
  return new Date(createdAt).getTime() >= limit
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedRole, setSelectedRole] = useState(ALL_ROLES)
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    role: 'CONTENT_AUTHOR' as UserRole,
    email: '',
    password: '',
  })

  const {
    users,
    pagination,
    isLoading: loading,
  } = useUsersQuery({
    page,
    limit: 10,
    search: searchTerm,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    role: selectedRole !== ALL_ROLES ? selectedRole : undefined,
  })

  const createUser = useCreateUserMutation()
  const updateUser = useUpdateUserMutation()
  const deleteUser = useDeleteUserMutation()

  const isCreating = createUser.isPending
  const isUpdating = updateUser.isPending
  const isDeleting = deleteUser.isPending

  // filtrar volta para a primeira página: a atual pode nem existir no novo recorte
  useEffect(() => {
    setPage(1)
  }, [searchTerm, startDate, endDate, selectedRole])

  const clearForm = () => setFormData({ name: '', role: 'CONTENT_AUTHOR', email: '', password: '' })

  const reportError = (error: unknown, fallback: string) =>
    toast.error(error instanceof Error ? error.message : fallback)

  // Check if there are active filters
  const hasActiveFilters =
    searchTerm !== '' || startDate !== '' || endDate !== '' || selectedRole !== ALL_ROLES

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSelectedRole(ALL_ROLES)
  }

  // Create user
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Todos os campos são obrigatórios')
      return
    }
    if (formData.password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres')
      return
    }
    try {
      await createUser.mutateAsync(formData)
      toast.success('Usuário criado com sucesso!')
      clearForm()
    } catch (error) {
      reportError(error, 'Erro ao criar usuário')
    } finally {
      setShowCreateModal(false)
    }
  }
  // Update user
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    if (!formData.name || !formData.email) {
      toast.error('Nome e usuário são obrigatórios')
      return
    }
    if (formData.password && formData.password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres')
      return
    }
    try {
      await updateUser.mutateAsync({ id: selectedUser.id, ...formData })
      toast.success('Usuário atualizado com sucesso!')
      clearForm()
    } catch (error) {
      reportError(error, 'Erro ao atualizar usuário')
    } finally {
      setShowEditModal(false)
      setSelectedUser(null)
    }
  }
  // Delete user
  const handleDelete = async () => {
    if (!selectedUser) return
    try {
      await deleteUser.mutateAsync(selectedUser.id)
      toast.success('Usuário deletado com sucesso!')
    } catch (error) {
      reportError(error, 'Erro ao deletar usuário')
    } finally {
      setShowDeleteModal(false)
      setSelectedUser(null)
    }
  }
  // Open edit modal
  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      role: user.role,
      email: user.email,
      password: '',
    })
    setShowEditModal(true)
  }
  // Open delete modal
  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }
  return (
    <PageTransition>
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <PageHeader
            icon={Users}
            title="Gerenciar Usuários"
            description="Crie, edite e gerencie usuários do sistema"
            actionLabel="Novo Usuário"
            onAction={() => {
              setFormData({ name: '', role: 'CONTENT_AUTHOR', email: '', password: '' })
              setShowCreateModal(true)
            }}
          />
          {/* Filters */}
          <div className="mb-6 space-y-4">
            {/* Search Bar - Full width on mobile */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground pl-1">Buscar</span>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Nome ou e-mail..."
              />
            </div>

            {/* Date Filters - Side by side */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-xs text-muted-foreground pl-1">Data Inicial</span>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-xs text-muted-foreground pl-1">Data Final</span>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <span className="text-xs text-muted-foreground pl-1">Papel</span>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={ALL_ROLES} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_ROLES}>{ALL_ROLES}</SelectItem>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="w-full sm:w-auto sm:self-end"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
          {/* Users Table */}
          <div className="bg-card rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando usuários...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span>{user.name}</span>
                              {isRecentUser(user.createdAt) && (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                  Novo
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(user)}
                              className="mr-2"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteModal(user)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-border">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="font-medium text-foreground truncate">{user.name}</h3>
                            {isRecentUser(user.createdAt) && (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                Novo
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(user)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(user)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Deletar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {users.length} de {pagination.total} usuários
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((current) => current - 1)}
                        disabled={pagination.page === 1}
                      >
                        Anterior
                      </Button>
                      <div className="px-3 py-1 bg-primary text-primary-foreground rounded-md flex items-center text-sm">
                        {pagination.page}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((current) => current + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Criar Novo Usuário
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <FormField label="Nome Completo">
                  {(props) => (
                    <Input
                      {...props}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Digite o nome completo"
                    />
                  )}
                </FormField>
                <FormField label="Papel de acesso">
                  {(props) => (
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value as UserRole })
                      }
                    >
                      <SelectTrigger id={props.id}>
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
                <FormField label="E-mail">
                  {(props) => (
                    <Input
                      {...props}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Digite o nome de usuário"
                    />
                  )}
                </FormField>
                <FormField label="Senha">
                  {(props) => (
                    <Input
                      {...props}
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                    />
                  )}
                </FormField>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {isCreating ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Editar Usuário
              </DialogTitle>
              <DialogDescription>
                Atualize as informações do usuário. Deixe a senha em branco para mantê-la.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <FormField label="Nome Completo">
                  {(props) => (
                    <Input
                      {...props}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  )}
                </FormField>
                <FormField label="Papel de acesso">
                  {(props) => (
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value as UserRole })
                      }
                    >
                      <SelectTrigger id={props.id}>
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
                <FormField label="E-mail">
                  {(props) => (
                    <Input
                      {...props}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  )}
                </FormField>
                <FormField label="Nova Senha (opcional)">
                  {(props) => (
                    <Input
                      {...props}
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Deixe em branco para manter a senha atual"
                    />
                  )}
                </FormField>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                  }}
                  disabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isUpdating ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja deletar o usuário <strong>{selectedUser?.name}</strong>? Esta
                ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUser(null)
                }}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isDeleting ? 'Deletando...' : 'Deletar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
}
