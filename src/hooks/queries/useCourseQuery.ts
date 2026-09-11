'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import type { Course } from '@/types/course'

export const VERSION_CONFLICT_ERROR = 'conflito-de-versao'

async function fetchCourse(identifier: string): Promise<Course> {
  const response = await fetch(`/api/courses/${identifier}`, {
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  })
  const data = await response.json()

  if (!data.success || !data.course) throw new Error(data.error || 'Curso não encontrado')
  return data.course
}

interface CourseOptions {
  /** o preview precisa do estado publicado mais recente, não do que está em cache */
  alwaysRevalidate?: boolean
}

/** Aceita id ou slug — a rota da API resolve os dois. */
export function useCourseQuery(identifier: string | null, options: CourseOptions = {}) {
  const query = useQuery({
    queryKey: queryKeys.courses.detail(identifier ?? ''),
    queryFn: () => fetchCourse(identifier as string),
    enabled: Boolean(identifier),
    ...(options.alwaysRevalidate ? { staleTime: 0, refetchOnMount: 'always' as const } : {}),
  })

  return {
    course: query.data ?? null,
    isLoading: query.isPending,
    error: query.error,
  }
}

export interface CourseEdit {
  id: string
  course: Partial<Course>
  /** versão conhecida pelo cliente, para o optimistic locking do servidor */
  version?: number
}

export function useUpdateCourseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, course, version }: CourseEdit): Promise<Course> => {
      const sentVersion = course.version ?? version

      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...course,
          ...(sentVersion !== undefined && { version: sentVersion }),
        }),
      })

      if (response.status === 409) throw new Error(VERSION_CONFLICT_ERROR)

      const data = await response.json()
      if (!data.success || !data.course) throw new Error(data.error || 'Erro ao editar curso')

      return data.course
    },
    onSuccess: (updatedCourse) => {
      queryClient.setQueryData(queryKeys.courses.detail(updatedCourse.id), updatedCourse)
      if (updatedCourse.slug) {
        queryClient.setQueryData(queryKeys.courses.detail(updatedCourse.slug), updatedCourse)
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
    },
    onError: (error, { id }) => {
      if (error.message !== VERSION_CONFLICT_ERROR) return

      // outra pessoa salvou primeiro: recarrega a versão do servidor
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(id) })
      toast.error(
        'Este curso foi alterado por outra pessoa. Recarregamos a versão mais recente — refaça sua última mudança.'
      )
    },
  })
}

export function useCreateCourseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      course: Omit<Course, 'id' | 'dataCriacao' | 'dataModificacao'>
    ): Promise<Course> => {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await response.text()
        console.error('Resposta não é JSON:', text.substring(0, 200))
        throw new Error('Resposta inválida do servidor. Verifique os logs do servidor.')
      }

      const data = await response.json()
      if (!data.success || !data.course) throw new Error(data.error || 'Erro ao criar curso')

      return data.course
    },
    onSuccess: (createdCourse) => {
      queryClient.setQueryData(queryKeys.courses.detail(createdCourse.id), createdCourse)
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists })
    },
  })
}
