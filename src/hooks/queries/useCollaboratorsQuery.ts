'use client'

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import type { UserRole } from '@/lib/permissions'

export interface Collaborator {
  id: string
  createdAt: string
  user: { id: string; name: string; email: string; role: UserRole }
  grantedBy: { id: string; name: string } | null
}

export interface AccessRequest {
  id: string
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'REVOKED'
  message: string | null
  createdAt: string
  requester: { id: string; name: string; email: string }
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
            `/api/courses/${courseId}/collaborators`,
            'collaborators',
            'Erro ao carregar colaboradores'
          ),
        enabled,
        staleTime: 0,
      },
      {
        queryKey: queryKeys.accessRequests.ofCourse(courseId),
        queryFn: () =>
          request<AccessRequest>(
            `/api/courses/${courseId}/access-requests`,
            'accessRequests',
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
    pendingRequests: (accessRequests.data ?? []).filter((s) => s.status === 'PENDING'),
    loading: collaborators.isPending || accessRequests.isPending,
  }
}

export function useRevokeAccessMutation(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/courses/${courseId}/collaborators?userId=${userId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao revogar acesso')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.collaborators(courseId) }),
  })
}
