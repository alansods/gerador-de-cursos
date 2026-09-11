'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

export interface AccessRequestResponse {
  id: string
  action: 'approve' | 'deny'
}

export function useRespondAccessRequestMutation(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, action }: AccessRequestResponse) => {
      const response = await fetch(`/api/access-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao responder solicitação')
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.accessRequests.pending() })

      // a tela de colaboradores do curso lista as mesmas solicitações
      if (courseId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.accessRequests.ofCourse(courseId),
        })
        await queryClient.invalidateQueries({ queryKey: queryKeys.collaborators(courseId) })
      }
    },
  })
}
