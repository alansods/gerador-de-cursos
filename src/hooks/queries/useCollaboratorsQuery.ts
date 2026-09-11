'use client'

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import type { UserRole } from '@/lib/permissions'

export interface Collaborator {
  id: string
  createdAt: string
  user: { id: string; nome: string; email: string; role: UserRole }
  concedidoPor: { id: string; nome: string } | null
}

export interface AccessRequest {
  id: string
  status: 'PENDENTE' | 'APROVADA' | 'NEGADA' | 'REVOGADA'
  mensagem: string | null
  createdAt: string
  solicitante: { id: string; nome: string; email: string }
}

async function request<T>(url: string, field: string, error: string): Promise<T[]> {
  const response = await fetch(url)
  const data = await response.json()

  if (!data.success) throw new Error(data.error || error)
  return data[field]
}

export function useCourseAccess(courseId: string, enabled: boolean) {
  const [collaborators, accessRequests] = useQueries({
    queries: [
      {
        queryKey: queryKeys.collaborators(courseId),
        queryFn: () =>
          request<Collaborator>(
            `/api/cursos/${courseId}/colaboradores`,
            'colaboradores',
            'Erro ao carregar colaboradores'
          ),
        enabled,
        staleTime: 0,
      },
      {
        queryKey: queryKeys.accessRequests.ofCourse(courseId),
        queryFn: () =>
          request<AccessRequest>(
            `/api/cursos/${courseId}/solicitacoes`,
            'solicitacoes',
            'Erro ao carregar solicitações'
          ),
        enabled,
        // quem abre a gestão de acessos precisa do estado corrente, não do cache
        staleTime: 0,
      },
    ],
  })

  return {
    collaborators: collaborators.data ?? [],
    pendingRequests: (accessRequests.data ?? []).filter((s) => s.status === 'PENDENTE'),
    loading: collaborators.isPending || accessRequests.isPending,
  }
}

export function useRevokeAccessMutation(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/cursos/${courseId}/colaboradores?userId=${userId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao revogar acesso')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.collaborators(courseId) }),
  })
}
