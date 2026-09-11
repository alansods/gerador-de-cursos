'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, type UserFilters } from '@/lib/query-keys'
import type { UserRole } from '@/lib/permissions'

export interface User {
  id: string
  name: string
  role: UserRole
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

interface UsersResponse {
  users: User[]
  pagination: PaginationInfo
}

export interface UserData {
  name: string
  role: UserRole
  email: string
  password: string
}

export function useUsersQuery(filters: UserFilters) {
  const query = useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: async (): Promise<UsersResponse> => {
      const params = new URLSearchParams({
        page: String(filters.page),
        limit: String(filters.limit),
        search: filters.search ?? '',
      })
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.role) params.append('role', filters.role)

      const response = await fetch(`/api/users?${params}`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao carregar usuários')
      return { users: data.users, pagination: data.pagination }
    },
    placeholderData: (previous) => previous,
  })

  return {
    users: query.data?.users ?? [],
    pagination: query.data?.pagination ?? {
      page: filters.page,
      limit: filters.limit,
      total: 0,
      totalPages: 0,
    },
    isLoading: query.isPending,
    error: query.error,
  }
}

function useUserMutation<TVariaveis>(
  run: (variables: TVariaveis) => Promise<Response>,
  defaultError: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: TVariaveis) => {
      const response = await run(variables)
      const data = await response.json()

      if (!data.success) throw new Error(data.error || defaultError)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  })
}

export function useCreateUserMutation() {
  return useUserMutation<UserData>(
    (data) =>
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    'Erro ao criar usuário'
  )
}

export function useUpdateUserMutation() {
  return useUserMutation<UserData & { id: string }>(
    (data) =>
      fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    'Erro ao atualizar usuário'
  )
}

export function useDeleteUserMutation() {
  return useUserMutation<string>(
    (id) => fetch(`/api/users?id=${id}`, { method: 'DELETE' }),
    'Erro ao deletar usuário'
  )
}
