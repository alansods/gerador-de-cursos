'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { upload } from '@vercel/blob/client'
import { validateFile } from '@/lib/media'
import { currentProgress } from '@/lib/tutor/progress-store'

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
  filePathname: string | null
  contentType: string | null
  fileSize: number | null
  createdAt: string
  updatedAt: string
}

export type DocumentPreview = { kind: 'pdf'; url: string } | { kind: 'html'; html: string }

export function documentFileUrl(courseId: string, sourceId: string, mode: 'view' | 'download') {
  return `/api/courses/${courseId}/knowledge/${sourceId}/file?mode=${mode}`
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
          body: JSON.stringify({ question, progress: currentProgress() }),
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
    enabled: Boolean(courseId),
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
      const { error, warning } = validateFile(file, 'knowledge')
      if (error) throw new Error(error)

      const safeName = file.name.replace(/[^\w.-]+/g, '-').slice(-80)
      const blob = await upload(`courses/${courseId}/${safeName}`, file, {
        access: 'private',
        handleUploadUrl: `/api/courses/${courseId}/knowledge/upload`,
        contentType: file.type,
      })

      await readJson(
        await fetch(`/api/courses/${courseId}/knowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pathname: blob.pathname, name: file.name }),
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

export function useDocumentPreviewQuery(courseId: string, sourceId: string | null) {
  return useQuery({
    queryKey: queryKeys.knowledgePreview(courseId, sourceId ?? ''),
    queryFn: async (): Promise<DocumentPreview> => {
      const data = await readJson(
        await fetch(`/api/courses/${courseId}/knowledge/${sourceId}/preview`),
        'Não foi possível visualizar o documento'
      )
      return data.kind === 'pdf'
        ? { kind: 'pdf', url: data.url }
        : { kind: 'html', html: data.html }
    },
    enabled: Boolean(sourceId),
    staleTime: 0,
    gcTime: 0,
  })
}
