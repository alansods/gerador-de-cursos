import type { CourseStatus } from '@/lib/permissions'

export const COURSE_STATUS: CourseStatus[] = ['IN_PROGRESS', 'IN_REVIEW', 'APPROVED', 'REJECTED']

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  IN_PROGRESS: 'Em andamento',
  IN_REVIEW: 'Em revisão',
  APPROVED: 'Aprovado',
  REJECTED: 'Reprovado',
}

export const COURSE_STATUS_CLASSES: Record<CourseStatus, string> = {
  IN_PROGRESS: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  IN_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

export const STATUS_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
  IN_PROGRESS: ['IN_REVIEW'],
  IN_REVIEW: ['APPROVED', 'REJECTED', 'IN_PROGRESS'],
  APPROVED: ['IN_PROGRESS'],
  REJECTED: ['IN_PROGRESS', 'IN_REVIEW'],
}

export function isValidTransition(from: CourseStatus, to: CourseStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}
