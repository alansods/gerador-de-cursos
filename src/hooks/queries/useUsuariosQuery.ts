'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chaves, type FiltrosDeUsuarios } from '@/lib/query-keys'
import type { RoleUsuario } from '@/lib/permissions'

export interface User {
  id: string
  nome: string
  role: RoleUsuario
  email: string
  createdAt: string
  updatedAt: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface RespostaDeUsuarios {
  users: User[]
  pagination: PaginationInfo
}

export interface DadosDeUsuario {
  nome: string
  role: RoleUsuario
  email: string
  senha: string
}

export function useUsuariosQuery(filtros: FiltrosDeUsuarios) {
  const query = useQuery({
    queryKey: chaves.usuarios.lista(filtros),
    queryFn: async (): Promise<RespostaDeUsuarios> => {
      const params = new URLSearchParams({
        page: String(filtros.page),
        limit: String(filtros.limit),
        search: filtros.search ?? '',
      })
      if (filtros.startDate) params.append('startDate', filtros.startDate)
      if (filtros.endDate) params.append('endDate', filtros.endDate)
      if (filtros.role) params.append('role', filtros.role)

      const response = await fetch(`/api/users?${params}`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao carregar usuários')
      return { users: data.users, pagination: data.pagination }
    },
    placeholderData: (anterior) => anterior,
  })

  return {
    users: query.data?.users ?? [],
    pagination: query.data?.pagination ?? {
      page: filtros.page,
      limit: filtros.limit,
      total: 0,
      totalPages: 0,
    },
    isLoading: query.isPending,
    error: query.error,
  }
}

function useMutationDeUsuario<TVariaveis>(
  executar: (variaveis: TVariaveis) => Promise<Response>,
  erroPadrao: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variaveis: TVariaveis) => {
      const response = await executar(variaveis)
      const data = await response.json()

      if (!data.success) throw new Error(data.error || erroPadrao)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.usuarios.todos }),
  })
}

export function useCriarUsuarioMutation() {
  return useMutationDeUsuario<DadosDeUsuario>(
    (dados) =>
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }),
    'Erro ao criar usuário'
  )
}

export function useAtualizarUsuarioMutation() {
  return useMutationDeUsuario<DadosDeUsuario & { id: string }>(
    (dados) =>
      fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }),
    'Erro ao atualizar usuário'
  )
}

export function useDeletarUsuarioMutation() {
  return useMutationDeUsuario<string>(
    (id) => fetch(`/api/users?id=${id}`, { method: 'DELETE' }),
    'Erro ao deletar usuário'
  )
}
