'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

export const ACTIVITIES_POLLING_INTERVAL = 30_000

export interface Activity {
  id: string
  type: string
  title: string
  description: string | null
  createdAt: string
  user?: { id: string; name: string; email: string } | null
}

export function useActivitiesQuery(limit: number) {
  const query = useQuery({
    queryKey: queryKeys.activities.recent(limit),
    queryFn: async (): Promise<Activity[]> => {
      const response = await fetch(`/api/activities?limit=${limit}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao buscar atividades')
      return data.activities
    },
    // o feed é volátil: revalida ao voltar para a aba, além do intervalo.
    // sem zerar o staleTime o foco não dispararia nada dentro da janela padrão
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: ACTIVITIES_POLLING_INTERVAL,
    refetchIntervalInBackground: false,
  })

  return {
    activities: query.data ?? [],
    isLoading: query.isPending,
  }
}
