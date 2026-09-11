'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { queryKeys } from '@/lib/query-keys'

export const ACCESS_REQUESTS_POLLING_INTERVAL = 60_000

export interface PendingAccessRequest {
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
export function usePendingAccessRequests() {
  const { isAuthenticated, role } = useAuth()
  const queryClient = useQueryClient()

  const canRespond = role === 'ADMIN' || role === 'GESTOR' || role === 'CONTEUDISTA'

  const query = useQuery({
    queryKey: queryKeys.accessRequests.pending(),
    queryFn: async (): Promise<PendingAccessRequest[]> => {
      const response = await fetch('/api/solicitacoes/pendentes')
      if (!response.ok) throw new Error('Erro ao buscar solicitações')

      const data = await response.json()
      return data.success ? data.solicitacoes : []
    },
    enabled: isAuthenticated && canRespond,
    refetchInterval: ACCESS_REQUESTS_POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    // um indicador não deve incomodar quando a rede falha
    retry: false,
  })

  const accessRequests = query.data ?? []

  return {
    accessRequests,
    total: accessRequests.length,
    reload: () => queryClient.invalidateQueries({ queryKey: queryKeys.accessRequests.pending() }),
    canRespond,
  }
}
