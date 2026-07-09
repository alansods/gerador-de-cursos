import { useState, useEffect, useRef, useCallback } from 'react'
import { buscarCursos, type BuscarCursosParams } from '@/app/cursos/actions'
import type { CursoGerado } from '@/types/gerador-curso'

interface UseInfiniteScrollOptions {
  limit?: number
  search?: string
  category?: string
  modality?: string
}

interface UseInfiniteScrollReturn {
  cursos: CursoGerado[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  total: number
  error: Error | null
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Hook para gerenciar infinite scroll de cursos
 */
export function useInfiniteScroll({
  limit = 6,
  search,
  category,
  modality,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const [cursos, setCursos] = useState<CursoGerado[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)

  // Refs para controle
  const isLoadingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Carregar primeira página
  const loadInitial = useCallback(async () => {
    // Prevenir múltiplas chamadas simultâneas
    if (isLoadingRef.current) return

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    isLoadingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const params: BuscarCursosParams = {
        limit,
        search,
        category,
        modality,
      }

      const result = await buscarCursos(params)

      // Verificar se foi abortado
      if (controller.signal.aborted) return

      setCursos(result.cursos)
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
      setTotal(result.total)
    } catch (err) {
      if (controller.signal.aborted) return
      console.error('[useInfiniteScroll] Erro ao carregar cursos:', err)
      setError(err instanceof Error ? err : new Error('Erro ao carregar cursos'))
    } finally {
      if (!controller.signal.aborted) {
        isLoadingRef.current = false
        setIsLoading(false)
      }
    }
  }, [limit, search, category, modality])

  // Carregar mais cursos (próxima página)
  const loadMore = useCallback(async () => {
    // Não carregar se já estiver carregando ou não houver mais
    if (isLoadingRef.current || !hasMore || !cursor) return

    isLoadingRef.current = true
    setIsLoadingMore(true)
    setError(null)

    try {
      const params: BuscarCursosParams = {
        cursor,
        limit,
        search,
        category,
        modality,
      }

      const result = await buscarCursos(params)

      setCursos((prev) => [...prev, ...result.cursos])
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
      setTotal(result.total)
    } catch (err) {
      console.error('[useInfiniteScroll] Erro ao carregar mais cursos:', err)
      setError(err instanceof Error ? err : new Error('Erro ao carregar mais cursos'))
    } finally {
      isLoadingRef.current = false
      setIsLoadingMore(false)
    }
  }, [cursor, hasMore, limit, search, category, modality])

  // Função para forçar atualização (refresh)
  const refresh = useCallback(async () => {
    setCursos([])
    setCursor(null)
    setHasMore(false)
    setTotal(0)
    await loadInitial()
  }, [loadInitial])

  // Recarregar quando filtros mudarem
  useEffect(() => {
    loadInitial()

    // Cleanup: cancelar requisição ao desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      isLoadingRef.current = false
    }
  }, [loadInitial])

  return {
    cursos,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    error,
    loadMore,
    refresh,
  }
}
