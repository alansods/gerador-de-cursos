'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { queryKeys } from '@/lib/query-keys'

export const ACCESS_REQUESTS_POLLING_INTERVAL = 60_000

export interface PendingAccessRequest {
  id: string
  message: string | null
  createdAt: string
  course: { id: string; title: string }
  requester: { id: string; name: string; email: string }
}

/**
 * Pedidos de acesso aguardando resposta. ADMIN e MANAGER veem todos; o
 * CONTENT_AUTHOR vê os dos cursos que possui. Quem não pode conceder acesso não
 * dispara requisição alguma.
 */
export function usePendingAccessRequests() {
  const { isAuthenticated, role } = useAuth()
  const queryClient = useQueryClient()

  const canRespond = role === 'ADMIN' || role === 'MANAGER' || role === 'CONTENT_AUTHOR'

  const query = useQuery({
    queryKey: queryKeys.accessRequests.pending(),
    queryFn: async (): Promise<PendingAccessRequest[]> => {
      const response = await fetch('/api/access-requests/pending')
      if (!response.ok) throw new Error('Erro ao buscar solicitações')

      const data = await response.json()
      return data.success ? data.accessRequests : []
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
