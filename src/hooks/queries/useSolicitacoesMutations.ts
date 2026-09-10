'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chaves } from '@/lib/query-keys'

export interface RespostaDeSolicitacao {
  id: string
  acao: 'aprovar' | 'negar'
}

export function useResponderSolicitacaoMutation(cursoId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, acao }: RespostaDeSolicitacao) => {
      const response = await fetch(`/api/solicitacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao }),
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao responder solicitação')
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chaves.solicitacoes.pendentes() })

      // a tela de colaboradores do curso lista as mesmas solicitações
      if (cursoId) {
        await queryClient.invalidateQueries({ queryKey: chaves.solicitacoes.doCurso(cursoId) })
        await queryClient.invalidateQueries({ queryKey: chaves.colaboradores(cursoId) })
      }
    },
  })
}
