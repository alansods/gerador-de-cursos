'use client'

import { useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCourses } from '@/app/(app)/cursos/actions'
import { queryKeys, type CourseFilters } from '@/lib/query-keys'

export function useCoursesQuery(filters: CourseFilters) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.courses.list(filters),
    queryFn: ({ pageParam }) => fetchCourses({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

  const { fetchNextPage } = query
  const loadMore = useCallback(async () => {
    await fetchNextPage()
  }, [fetchNextPage])

  return {
    courses: query.data?.pages.flatMap((page) => page.courses) ?? [],
    total: query.data?.pages[0]?.total ?? 0,
    isLoading: query.isPending,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    error: query.error,
    loadMore,
  }
}

export function useDeleteCourseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/cursos?id=${id}`, { method: 'DELETE' })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao deletar curso')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
  })
}
