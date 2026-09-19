'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { uploadFile } from '@/lib/client-upload'

export interface TutorReply {
  answer: string
  sources: string[]
  grounded: boolean
}

export interface KnowledgeSource {
  id: string
  kind: 'DOCUMENT' | 'COURSE'
  name: string
  chunkCount: number
  createdAt: string
  updatedAt: string
}

async function readJson(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) throw new Error(data.error || fallback)
  return data
}

export function useAskTutorMutation(courseId: string) {
  return useMutation({
    mutationFn: async (question: string): Promise<TutorReply> => {
      const data = await readJson(
        await fetch(`/api/tutor/${courseId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
        }),
        'O tutor está indisponível no momento'
      )

      return { answer: data.answer, sources: data.sources ?? [], grounded: Boolean(data.grounded) }
    },
  })
}

export function useKnowledgeQuery(courseId: string) {
  const query = useQuery({
    queryKey: queryKeys.knowledge(courseId),
    queryFn: async (): Promise<{ sources: KnowledgeSource[]; canManage: boolean }> => {
      const data = await readJson(
        await fetch(`/api/courses/${courseId}/knowledge`),
        'Erro ao carregar o repositório do tutor'
      )
      return { sources: data.sources, canManage: Boolean(data.canManage) }
    },
    staleTime: 0,
  })

  return {
    sources: query.data?.sources ?? [],
    canManage: query.data?.canManage ?? false,
    loading: query.isPending,
    error: query.error,
  }
}

export function useUploadKnowledgeMutation(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File): Promise<{ warning: string | null }> => {
      const { url, warning } = await uploadFile(file, 'knowledge')

      await readJson(
        await fetch(`/api/courses/${courseId}/knowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, name: file.name }),
        }),
        'Erro ao indexar o documento'
      )

      return { warning }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.knowledge(courseId) }),
  })
}

export function useDeleteKnowledgeMutation(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sourceId: string) => {
      await readJson(
        await fetch(`/api/courses/${courseId}/knowledge?sourceId=${sourceId}`, {
          method: 'DELETE',
        }),
        'Erro ao excluir o documento'
      )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.knowledge(courseId) }),
  })
}
