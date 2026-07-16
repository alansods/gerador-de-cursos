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
interface User {
  id: string
  nome: string
  cargo: string
  usuario: string
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
    cargo: '',
    usuario: '',
    senha: '',
  })
  // Fetch users
  const fetchUsers = useCallback(
    async (page = 1, search = '', start = '', end = '') => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search,
        })
        if (start) params.append('startDate', start)
        if (end) params.append('endDate', end)
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
    fetchUsers(1, searchTerm, startDate, endDate)
  }, [searchTerm, startDate, endDate, fetchUsers])

  // Check if there are active filters
  const hasActiveFilters = searchTerm !== '' || startDate !== '' || endDate !== ''

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
  }

  // Create user
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome || !formData.cargo || !formData.usuario || !formData.senha) {
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
        setFormData({ nome: '', cargo: '', usuario: '', senha: '' })
        fetchUsers(pagination.page, searchTerm, startDate, endDate)
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
    if (!formData.nome || !formData.cargo || !formData.usuario) {
      toast.error('Nome, cargo e usuário são obrigatórios')
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
        setFormData({ nome: '', cargo: '', usuario: '', senha: '' })
        fetchUsers(pagination.page, searchTerm, startDate, endDate)
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
        fetchUsers(pagination.page, searchTerm, startDate, endDate)
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
      cargo: user.cargo,
      usuario: user.usuario,
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
              setFormData({ nome: '', cargo: '', usuario: '', senha: '' })
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
                placeholder="Nome, usuário ou cargo..."
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
                        <TableHead>Usuário</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.nome}</TableCell>
                          <TableCell>{user.usuario}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.cargo}</Badge>
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
                          <h3 className="font-medium text-foreground truncate">{user.nome}</h3>
                          <p className="text-sm text-muted-foreground truncate">@{user.usuario}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {user.cargo}
                        </Badge>
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
                          fetchUsers(pagination.page - 1, searchTerm, startDate, endDate)
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
                          fetchUsers(pagination.page + 1, searchTerm, startDate, endDate)
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
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="Ex: Administrador, Professor, etc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usuario">Nome de Usuário</Label>
                  <Input
                    id="usuario"
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
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
                  <Label htmlFor="edit-cargo">Cargo</Label>
                  <Input
                    id="edit-cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-usuario">Nome de Usuário</Label>
                  <Input
                    id="edit-usuario"
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
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
