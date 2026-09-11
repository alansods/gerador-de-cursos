'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, type ScormJobFilters } from '@/lib/query-keys'

export interface SCORMJob {
  id: string
  courseId: string
  courseTitle: string
  status: 'pending' | 'building' | 'completed' | 'failed'
  progress?: string
  error?: string
  createdAt: string
  completedAt?: string
}

export interface JobPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface JobsResponse {
  jobs: SCORMJob[]
  pagination: JobPagination
}

export const LIST_POLLING_INTERVAL = 5_000
export const JOB_POLLING_INTERVAL = 2_000

const jobFinished = (status?: SCORMJob['status']) => status === 'completed' || status === 'failed'

export function useScormJobsQuery(filters: ScormJobFilters) {
  const query = useQuery({
    queryKey: queryKeys.scormJobs.list(filters),
    queryFn: async (): Promise<JobsResponse> => {
      const params = new URLSearchParams({
        page: String(filters.page),
        limit: String(filters.limit),
      })

      const response = await fetch(`/api/scorm-jobs?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar jobs')

      const data = await response.json()
      return { jobs: data.jobs ?? [], pagination: data.pagination }
    },
    refetchInterval: LIST_POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
  })

  return {
    jobs: query.data?.jobs ?? [],
    pagination: query.data?.pagination ?? {
      page: filters.page,
      limit: filters.limit,
      total: 0,
      totalPages: 0,
    },
    isLoading: query.isPending,
  }
}

export function useScormJobStatusQuery(jobId: string) {
  const query = useQuery({
    queryKey: queryKeys.scormJobs.detail(jobId),
    queryFn: async (): Promise<SCORMJob> => {
      const response = await fetch(`/api/scorm-status/${jobId}`)
      if (!response.ok) throw new Error('Erro ao buscar status')

      return response.json()
    },
    enabled: Boolean(jobId),
    // um job terminado não muda mais: o polling se desliga sozinho
    refetchInterval: ({ state }) =>
      jobFinished(state.data?.status) ? false : JOB_POLLING_INTERVAL,
    refetchIntervalInBackground: false,
  })

  return {
    jobStatus: query.data ?? null,
    isLoading: query.isPending,
  }
}

function useInvalidateJobs() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: queryKeys.scormJobs.all })
}

export function useCancelJobMutation() {
  const invalidateJobs = useInvalidateJobs()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/scorm-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao cancelar build')
      }
    },
    onSuccess: invalidateJobs,
  })
}

export function useDeleteJobMutation() {
  const invalidateJobs = useInvalidateJobs()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/scorm-jobs/${jobId}`, { method: 'DELETE' })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao apagar item')
      }
    },
    onSuccess: invalidateJobs,
  })
}

export function useRestartBuildMutation() {
  return useMutation({
    mutationFn: async (courseId: string): Promise<string> => {
      const courseResponse = await fetch(`/api/courses/${courseId}`)
      if (!courseResponse.ok) throw new Error('Curso não encontrado')

      const course = await courseResponse.json()

      const buildResponse = await fetch('/api/generate-scorm-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course }),
      })

      if (!buildResponse.ok) {
        const error = await buildResponse.json()
        throw new Error(error.error || 'Erro ao iniciar build')
      }

      const { jobId } = await buildResponse.json()
      return jobId
    },
  })
}
