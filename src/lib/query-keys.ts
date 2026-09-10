import type { BuscarCursosParams } from '@/app/(app)/cursos/actions'

export type FiltrosDeCursos = Omit<BuscarCursosParams, 'cursor'>

export interface FiltrosDeUsuarios {
  page: number
  limit: number
  search?: string
  startDate?: string
  endDate?: string
  role?: string
}

export const chaves = {
  cursos: {
    todos: ['cursos'] as const,
    listas: ['cursos', 'lista'] as const,
    lista: (filtros: FiltrosDeCursos) => ['cursos', 'lista', filtros] as const,
    detalhe: (id: string) => ['cursos', 'detalhe', id] as const,
  },
  usuarios: {
    todos: ['usuarios'] as const,
    lista: (filtros: FiltrosDeUsuarios) => ['usuarios', 'lista', filtros] as const,
  },
  scormJobs: {
    todos: ['scorm-jobs'] as const,
    lista: () => ['scorm-jobs', 'lista'] as const,
    detalhe: (jobId: string) => ['scorm-jobs', 'detalhe', jobId] as const,
  },
  solicitacoes: {
    pendentes: () => ['solicitacoes', 'pendentes'] as const,
    doCurso: (cursoId: string) => ['solicitacoes', 'curso', cursoId] as const,
  },
  atividades: {
    recentes: (limite: number) => ['atividades', 'recentes', limite] as const,
  },
  colaboradores: (cursoId: string) => ['colaboradores', cursoId] as const,
  comentarios: (cursoId: string) => ['comentarios', cursoId] as const,
} as const
