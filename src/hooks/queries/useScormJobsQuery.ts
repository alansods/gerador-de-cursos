'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chaves, type FiltrosDeScormJobs } from '@/lib/query-keys'

export interface SCORMJob {
  id: string
  cursoId: string
  cursoTitulo: string
  status: 'pending' | 'building' | 'completed' | 'failed'
  progress?: string
  error?: string
  createdAt: string
  completedAt?: string
}

export interface PaginacaoDeJobs {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface RespostaDeJobs {
  jobs: SCORMJob[]
  pagination: PaginacaoDeJobs
}

export const INTERVALO_POLLING_LISTA = 5_000
export const INTERVALO_POLLING_JOB = 2_000

const jobTerminou = (status?: SCORMJob['status']) => status === 'completed' || status === 'failed'

export function useScormJobsQuery(filtros: FiltrosDeScormJobs) {
  const query = useQuery({
    queryKey: chaves.scormJobs.lista(filtros),
    queryFn: async (): Promise<RespostaDeJobs> => {
      const params = new URLSearchParams({
        page: String(filtros.page),
        limit: String(filtros.limit),
      })

      const response = await fetch(`/api/scorm-jobs?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar jobs')

      const data = await response.json()
      return { jobs: data.jobs ?? [], pagination: data.pagination }
    },
    refetchInterval: INTERVALO_POLLING_LISTA,
    refetchIntervalInBackground: false,
    placeholderData: (anterior) => anterior,
  })

  return {
    jobs: query.data?.jobs ?? [],
    pagination: query.data?.pagination ?? {
      page: filtros.page,
      limit: filtros.limit,
      total: 0,
      totalPages: 0,
    },
    isLoading: query.isPending,
  }
}

export function useScormJobStatusQuery(jobId: string) {
  const query = useQuery({
    queryKey: chaves.scormJobs.detalhe(jobId),
    queryFn: async (): Promise<SCORMJob> => {
      const response = await fetch(`/api/scorm-status/${jobId}`)
      if (!response.ok) throw new Error('Erro ao buscar status')

      return response.json()
    },
    enabled: Boolean(jobId),
    // um job terminado não muda mais: o polling se desliga sozinho
    refetchInterval: ({ state }) =>
      jobTerminou(state.data?.status) ? false : INTERVALO_POLLING_JOB,
    refetchIntervalInBackground: false,
  })

  return {
    jobStatus: query.data ?? null,
    isLoading: query.isPending,
  }
}

function useInvalidarJobs() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: chaves.scormJobs.todos })
}

export function useCancelarJobMutation() {
  const invalidarJobs = useInvalidarJobs()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/scorm-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })

      if (!response.ok) {
        const erro = await response.json()
        throw new Error(erro.error || 'Erro ao cancelar build')
      }
    },
    onSuccess: invalidarJobs,
  })
}

export function useDeletarJobMutation() {
  const invalidarJobs = useInvalidarJobs()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/scorm-jobs/${jobId}`, { method: 'DELETE' })

      if (!response.ok) {
        const erro = await response.json()
        throw new Error(erro.error || 'Erro ao apagar item')
      }
    },
    onSuccess: invalidarJobs,
  })
}

export function useReiniciarBuildMutation() {
  return useMutation({
    mutationFn: async (cursoId: string): Promise<string> => {
      const cursoResponse = await fetch(`/api/cursos/${cursoId}`)
      if (!cursoResponse.ok) throw new Error('Curso não encontrado')

      const curso = await cursoResponse.json()

      const buildResponse = await fetch('/api/generate-scorm-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curso }),
      })

      if (!buildResponse.ok) {
        const erro = await buildResponse.json()
        throw new Error(erro.error || 'Erro ao iniciar build')
      }

      const { jobId } = await buildResponse.json()
      return jobId
    },
  })
}
