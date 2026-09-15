'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCourses } from '@/app/(app)/courses/actions'
import { queryKeys, type CourseFilters } from '@/lib/query-keys'

export function useCoursesQuery(filters: CourseFilters) {
  const query = useQuery({
    queryKey: queryKeys.courses.list(filters),
    queryFn: () => fetchCourses(filters),
    placeholderData: (previous) => previous,
  })

  return {
    courses: query.data?.courses ?? [],
    pagination: {
      page: query.data?.page ?? filters.page ?? 1,
      total: query.data?.total ?? 0,
      totalPages: query.data?.totalPages ?? 0,
    },
    isLoading: query.isPending,
    error: query.error,
  }
}

export function useDeleteCourseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/courses?id=${id}`, { method: 'DELETE' })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao deletar curso')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
  })
}

export function useBulkDeleteCoursesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao deletar cursos')

      return data as { deleted: number; notFound: string[] }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
  })
}
