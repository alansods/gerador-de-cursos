'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { chaves } from '@/lib/query-keys'

export const INTERVALO_POLLING_SOLICITACOES = 60_000

export interface SolicitacaoPendente {
  id: string
  mensagem: string | null
  createdAt: string
  curso: { id: string; titulo: string }
  solicitante: { id: string; nome: string; email: string }
}

/**
 * Pedidos de acesso aguardando resposta. ADMIN e GESTOR veem todos; o
 * CONTEUDISTA vê os dos cursos que possui. Quem não pode conceder acesso não
 * dispara requisição alguma.
 */
export function useSolicitacoesPendentes() {
  const { isAuthenticated, role } = useAuth()
  const queryClient = useQueryClient()

  const podeResponder = role === 'ADMIN' || role === 'GESTOR' || role === 'CONTEUDISTA'

  const query = useQuery({
    queryKey: chaves.solicitacoes.pendentes(),
    queryFn: async (): Promise<SolicitacaoPendente[]> => {
      const response = await fetch('/api/solicitacoes/pendentes')
      if (!response.ok) throw new Error('Erro ao buscar solicitações')

      const data = await response.json()
      return data.success ? data.solicitacoes : []
    },
    enabled: isAuthenticated && podeResponder,
    refetchInterval: INTERVALO_POLLING_SOLICITACOES,
    refetchIntervalInBackground: false,
    // um indicador não deve incomodar quando a rede falha
    retry: false,
  })

  const solicitacoes = query.data ?? []

  return {
    solicitacoes,
    total: solicitacoes.length,
    recarregar: () => queryClient.invalidateQueries({ queryKey: chaves.solicitacoes.pendentes() }),
    podeResponder,
  }
}
