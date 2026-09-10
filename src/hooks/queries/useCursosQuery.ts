'use client'

import { useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { buscarCursos } from '@/app/(app)/cursos/actions'
import { chaves, type FiltrosDeCursos } from '@/lib/query-keys'

export function useCursosQuery(filtros: FiltrosDeCursos) {
  const query = useInfiniteQuery({
    queryKey: chaves.cursos.lista(filtros),
    queryFn: ({ pageParam }) => buscarCursos({ ...filtros, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (ultimaPagina) => ultimaPagina.nextCursor ?? undefined,
  })

  const { fetchNextPage } = query
  const carregarMais = useCallback(async () => {
    await fetchNextPage()
  }, [fetchNextPage])

  return {
    cursos: query.data?.pages.flatMap((pagina) => pagina.cursos) ?? [],
    total: query.data?.pages[0]?.total ?? 0,
    isLoading: query.isPending,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    error: query.error,
    carregarMais,
  }
}

export function useDeletarCursoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/cursos?id=${id}`, { method: 'DELETE' })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao deletar curso')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.cursos.todos }),
  })
}
