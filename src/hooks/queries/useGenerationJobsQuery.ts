'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import type { GenerationJobsResponse } from '@/types/course-generation'
import { GENERATION_POLLING_INTERVAL } from './useCoursesQuery'

export interface StartedGeneration {
  jobId: string
  courseId: string
  fileName: string
}

interface StartGenerationInput {
  text: string
  fileName: string
  layout?: string
}

async function readResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.success) {
    throw new Error(data?.error || fallbackMessage)
  }

  return data as T
}

export function useGenerationJobsQuery() {
  return useQuery({
    queryKey: queryKeys.generationJobs.all,
    queryFn: async (): Promise<GenerationJobsResponse> => {
      const response = await fetch('/api/course-generation-jobs')
      const data = await readResponse<GenerationJobsResponse>(
        response,
        'Erro ao buscar gerações de curso'
      )

      return { active: data.active, finished: data.finished }
    },
    staleTime: 0,
    refetchInterval: ({ state }) =>
      state.data && state.data.active.length > 0 ? GENERATION_POLLING_INTERVAL : false,
    refetchIntervalInBackground: false,
  })
}

export function useStartGenerationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ text, fileName, layout }: StartGenerationInput) => {
      const response = await fetch('/api/generate-course-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fileName, layout }),
      })
      const data = await readResponse<{ jobId: string; courseId: string }>(
        response,
        'Erro ao iniciar a geração do curso'
      )

      return { jobId: data.jobId, courseId: data.courseId, fileName } satisfies StartedGeneration
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.generationJobs.all })
    },
  })
}

export function useRetryGenerationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/course-generation-jobs/${jobId}/retry`, {
        method: 'POST',
      })
      const data = await readResponse<StartedGeneration>(
        response,
        'Erro ao tentar gerar o curso de novo'
      )

      return { jobId: data.jobId, courseId: data.courseId, fileName: data.fileName }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.generationJobs.all })
    },
  })
}

export function useMarkGenerationNotifiedMutation() {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/course-generation-jobs/${jobId}/notify`, {
        method: 'POST',
      })
      const data = await readResponse<{ notified: boolean }>(
        response,
        'Erro ao registrar o aviso da geração'
      )

      return data.notified
    },
  })
}
