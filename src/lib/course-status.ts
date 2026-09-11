import type { CourseStatus } from '@/lib/permissions'

export const COURSE_STATUS: CourseStatus[] = ['EM_ANDAMENTO', 'EM_REVISAO', 'APROVADO', 'REPROVADO']

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  EM_ANDAMENTO: 'Em andamento',
  EM_REVISAO: 'Em revisão',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
}

export const COURSE_STATUS_CLASSES: Record<CourseStatus, string> = {
  EM_ANDAMENTO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  EM_REVISAO: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  APROVADO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  REPROVADO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

export const STATUS_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
  EM_ANDAMENTO: ['EM_REVISAO'],
  EM_REVISAO: ['APROVADO', 'REPROVADO', 'EM_ANDAMENTO'],
  APROVADO: ['EM_ANDAMENTO'],
  REPROVADO: ['EM_ANDAMENTO', 'EM_REVISAO'],
}

export function isValidTransition(from: CourseStatus, to: CourseStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}
