'use client'

// Esta página não deve ser exportada estaticamente (usa API)
export const dynamic = 'error'

import { useState, useEffect, useCallback } from 'react'
import { PageTransition } from '@/components/PageTransition'
import { Users, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SearchInput } from '@/components/SearchInput'
import { PageHeader } from '@/components/PageHeader'
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
import { ROLES, ROLE_LABELS, type RoleUsuario } from '@/lib/permissions'

const TODOS_OS_PAPEIS = 'Todos os papéis'
const DIAS_PARA_USUARIO_RECENTE = 7

function ehUsuarioRecente(createdAt: string) {
  const limite = Date.now() - DIAS_PARA_USUARIO_RECENTE * 24 * 60 * 60 * 1000
  return new Date(createdAt).getTime() >= limite
}

interface User {
  id: string
  nome: string
  role: RoleUsuario
  email: string
  createdAt: string
  updatedAt: string
}
interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}
export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedRole, setSelectedRole] = useState(TODOS_OS_PAPEIS)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    role: 'CONTEUDISTA' as RoleUsuario,
    email: '',
    senha: '',
  })
  // Fetch users
  const fetchUsers = useCallback(
    async (page = 1, search = '', start = '', end = '', role = TODOS_OS_PAPEIS) => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search,
        })
        if (start) params.append('startDate', start)
        if (end) params.append('endDate', end)
        if (role !== TODOS_OS_PAPEIS) params.append('role', role)
        const response = await fetch(`/api/users?${params}`)
        const data = await response.json()
        if (data.success) {
          setUsers(data.users)
          setPagination(data.pagination)
        } else {
          toast.error(data.error || 'Erro ao carregar usuários')
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error)
        toast.error('Erro ao conectar com o servidor')
      } finally {
        setLoading(false)
      }
    },
    [pagination.limit]
  )

  useEffect(() => {
    fetchUsers(1, searchTerm, startDate, endDate, selectedRole)
  }, [searchTerm, startDate, endDate, selectedRole, fetchUsers])

  // Check if there are active filters
  const hasActiveFilters =
    searchTerm !== '' || startDate !== '' || endDate !== '' || selectedRole !== TODOS_OS_PAPEIS

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSelectedRole(TODOS_OS_PAPEIS)
  }

  // Create user
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome || !formData.email || !formData.senha) {
      toast.error('Todos os campos são obrigatórios')
      return
    }
    if (formData.senha.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres')
      return
    }
    setIsCreating(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Usuário criado com sucesso!')
        setFormData({ nome: '', role: 'CONTEUDISTA', email: '', senha: '' })
        fetchUsers(pagination.page, searchTerm, startDate, endDate, selectedRole)
      } else {
        toast.error(data.error || 'Erro ao criar usuário')
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setIsCreating(false)
      setShowCreateModal(false)
    }
  }
  // Update user
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    if (!formData.nome || !formData.email) {
      toast.error('Nome e usuário são obrigatórios')
      return
    }
    if (formData.senha && formData.senha.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres')
      return
    }
    setIsUpdating(true)
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          ...formData,
        }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Usuário atualizado com sucesso!')
        setFormData({ nome: '', role: 'CONTEUDISTA', email: '', senha: '' })
        fetchUsers(pagination.page, searchTerm, startDate, endDate, selectedRole)
      } else {
        toast.error(data.error || 'Erro ao atualizar usuário')
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setIsUpdating(false)
      setShowEditModal(false)
      setSelectedUser(null)
    }
  }
  // Delete user
  const handleDelete = async () => {
    if (!selectedUser) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users?id=${selectedUser.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Usuário deletado com sucesso!')
        fetchUsers(pagination.page, searchTerm, startDate, endDate, selectedRole)
      } else {
        toast.error(data.error || 'Erro ao deletar usuário')
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setSelectedUser(null)
    }
  }
  // Open edit modal
  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      nome: user.nome,
      role: user.role,
      email: user.email,
      senha: '',
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
              setFormData({ nome: '', role: 'CONTEUDISTA', email: '', senha: '' })
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
                    <SelectValue placeholder={TODOS_OS_PAPEIS} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS_OS_PAPEIS}>{TODOS_OS_PAPEIS}</SelectItem>
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
                              <span>{user.nome}</span>
                              {ehUsuarioRecente(user.createdAt) && (
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
                            <h3 className="font-medium text-foreground truncate">{user.nome}</h3>
                            {ehUsuarioRecente(user.createdAt) && (
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
                        onClick={() =>
                          fetchUsers(
                            pagination.page - 1,
                            searchTerm,
                            startDate,
                            endDate,
                            selectedRole
                          )
                        }
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
                        onClick={() =>
                          fetchUsers(
                            pagination.page + 1,
                            searchTerm,
                            startDate,
                            endDate,
                            selectedRole
                          )
                        }
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
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Digite o nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Papel de acesso</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value as RoleUsuario })
                    }
                  >
                    <SelectTrigger id="role">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Digite o nome de usuário"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
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
                <div className="space-y-2">
                  <Label htmlFor="edit-nome">Nome Completo</Label>
                  <Input
                    id="edit-nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Papel de acesso</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value as RoleUsuario })
                    }
                  >
                    <SelectTrigger id="edit-role">
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">E-mail</Label>
                  <Input
                    id="edit-email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-senha">Nova Senha (opcional)</Label>
                  <Input
                    id="edit-senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    placeholder="Deixe em branco para manter a senha atual"
                  />
                </div>
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
                Tem certeza que deseja deletar o usuário <strong>{selectedUser?.nome}</strong>? Esta
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
