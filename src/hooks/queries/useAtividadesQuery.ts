'use client'

import { useQuery } from '@tanstack/react-query'
import { chaves } from '@/lib/query-keys'

export const INTERVALO_POLLING_ATIVIDADES = 30_000

export interface Activity {
  id: string
  tipo: string
  titulo: string
  descricao: string | null
  createdAt: string
  user?: { id: string; nome: string; email: string } | null
}

export function useAtividadesQuery(limite: number) {
  const query = useQuery({
    queryKey: chaves.atividades.recentes(limite),
    queryFn: async (): Promise<Activity[]> => {
      const response = await fetch(`/api/activities?limit=${limite}`, {
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
    refetchInterval: INTERVALO_POLLING_ATIVIDADES,
    refetchIntervalInBackground: false,
  })

  return {
    activities: query.data ?? [],
    isLoading: query.isPending,
  }
}
