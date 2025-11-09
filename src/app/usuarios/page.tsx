"use client";

import { useState, useEffect } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Users, Search, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  nome: string;
  cargo: string;
  usuario: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nome: "",
    cargo: "",
    usuario: "",
    senha: "",
  });

  // Fetch users
  const fetchUsers = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search,
      });

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Erro ao carregar usuários");
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, searchTerm);
  }, [searchTerm]);

  // Create user
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.cargo || !formData.usuario || !formData.senha) {
      toast.error("Todos os campos são obrigatórios");
      return;
    }

    if (formData.senha.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Usuário criado com sucesso!");
        setShowCreateModal(false);
        setFormData({ nome: "", cargo: "", usuario: "", senha: "" });
        fetchUsers(pagination.page, searchTerm);
      } else {
        toast.error(data.error || "Erro ao criar usuário");
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      toast.error("Erro ao conectar com o servidor");
    }
  };

  // Update user
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    if (!formData.nome || !formData.cargo || !formData.usuario) {
      toast.error("Nome, cargo e usuário são obrigatórios");
      return;
    }

    if (formData.senha && formData.senha.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Usuário atualizado com sucesso!");
        setShowEditModal(false);
        setSelectedUser(null);
        setFormData({ nome: "", cargo: "", usuario: "", senha: "" });
        fetchUsers(pagination.page, searchTerm);
      } else {
        toast.error(data.error || "Erro ao atualizar usuário");
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao conectar com o servidor");
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users?id=${selectedUser.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Usuário deletado com sucesso!");
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers(pagination.page, searchTerm);
      } else {
        toast.error(data.error || "Erro ao deletar usuário");
      }
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      toast.error("Erro ao conectar com o servidor");
    }
  };

  // Open edit modal
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      nome: user.nome,
      cargo: user.cargo,
      usuario: user.usuario,
      senha: "",
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
            </div>
            <p className="text-muted-foreground">
              Crie, edite e gerencie usuários do sistema
            </p>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, usuário ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Create Button */}
            <button
              onClick={() => {
                setFormData({ nome: "", cargo: "", usuario: "", senha: "" });
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Novo Usuário
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando usuários...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Cargo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Data de Criação
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-foreground">
                              {user.nome}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-muted-foreground">
                              {user.usuario}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                              {user.cargo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-primary hover:text-primary/80 mr-4 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="text-destructive hover:text-destructive/80 transition-colors"
                              title="Deletar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="px-6 py-4 flex items-center justify-between border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {users.length} de {pagination.total} usuários
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchUsers(pagination.page - 1, searchTerm)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 border border-input rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Anterior
                      </button>
                      <div className="px-3 py-1 bg-primary text-primary-foreground rounded-md">
                        {pagination.page}
                      </div>
                      <button
                        onClick={() => fetchUsers(pagination.page + 1, searchTerm)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-1 border border-input rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl max-w-md w-full border border-border">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">Criar Novo Usuário</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Digite o nome completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ex: Administrador, Professor, etc"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Nome de Usuário
                    </label>
                    <input
                      type="text"
                      value={formData.usuario}
                      onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Digite o nome de usuário"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Criar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl max-w-md w-full border border-border">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">Editar Usuário</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Nome de Usuário
                    </label>
                    <input
                      type="text"
                      value={formData.usuario}
                      onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Nova Senha (opcional)
                    </label>
                    <input
                      type="password"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Deixe em branco para manter a senha atual"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Atualizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl max-w-md w-full border border-border">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-destructive/10 rounded-full">
                    <Trash2 className="h-6 w-6 text-destructive" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Confirmar Exclusão</h2>
                </div>

                <p className="text-muted-foreground mb-6">
                  Tem certeza que deseja deletar o usuário <strong>{selectedUser.nome}</strong>?
                  Esta ação não pode ser desfeita.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
