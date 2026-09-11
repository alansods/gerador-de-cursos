'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

export interface AccessRequestResponse {
  id: string
  acao: 'aprovar' | 'negar'
}

export function useRespondAccessRequestMutation(courseId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, acao: action }: AccessRequestResponse) => {
      const response = await fetch(`/api/solicitacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: action }),
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
