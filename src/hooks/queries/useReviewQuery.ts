'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import type { CourseStatus } from '@/lib/permissions'

export interface ReviewComment {
  id: string
  text: string
  createdAt: string
  author: { id: string; name: string; email: string; role: string }
  canDelete: boolean
}

export function useCommentsQuery(courseId: string, enabled: boolean) {
  const query = useQuery({
    queryKey: queryKeys.comments(courseId),
    queryFn: async (): Promise<ReviewComment[]> => {
      const response = await fetch(`/api/courses/${courseId}/comments`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao carregar comentários')
      return data.comments
    },
    enabled,
    // abrir o painel tem que mostrar o que já foi comentado, não o cache
    staleTime: 0,
  })

  return {
    comments: query.data ?? [],
    loading: query.isPending,
  }
}

export function useAddCommentMutation(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch(`/api/courses/${courseId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao comentar')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.comments(courseId) }),
  })
}

export function useDeleteCommentMutation(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/courses/${courseId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao excluir comentário')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.comments(courseId) }),
  })
}

export interface StatusChange {
  status: CourseStatus
  comment?: string
}

export function useChangeStatusMutation(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ status, comment }: StatusChange) => {
      const response = await fetch(`/api/courses/${courseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment }),
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao alterar o status')
    },
    onSuccess: async () => {
      // a mudança de status registra um comentário automático
      await queryClient.invalidateQueries({ queryKey: queryKeys.comments(courseId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
    },
  })
}
