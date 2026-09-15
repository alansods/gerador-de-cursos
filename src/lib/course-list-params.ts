import { COURSE_CATEGORIES, COURSE_MODALITIES } from '@/lib/constants'
import { COURSE_STATUS } from '@/lib/course-status'
import type { CourseStatus } from '@/lib/permissions'

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const

export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0]

export interface CourseListParams {
  page: number
  perPage: number
  search: string
  category?: string
  modality?: string
  status?: CourseStatus
}

export function normalizePage(value: unknown): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

export function normalizePageSize(value: unknown): number {
  const size = Number(value)
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

export function parseCourseListParams(
  searchParams: Pick<URLSearchParams, 'get'>
): CourseListParams {
  return {
    page: normalizePage(searchParams.get('page') ?? 1),
    perPage: normalizePageSize(searchParams.get('perPage') ?? DEFAULT_PAGE_SIZE),
    search: searchParams.get('search') ?? '',
    category: oneOf(searchParams.get('category'), COURSE_CATEGORIES),
    modality: oneOf(searchParams.get('modality'), COURSE_MODALITIES),
    status: oneOf(searchParams.get('status'), COURSE_STATUS),
  }
}

export function buildCourseListQuery(params: CourseListParams): string {
  const query = new URLSearchParams()

  if (params.page > 1) query.set('page', String(params.page))
  if (params.perPage !== DEFAULT_PAGE_SIZE) query.set('perPage', String(params.perPage))
  if (params.search) query.set('search', params.search)
  if (params.category) query.set('category', params.category)
  if (params.modality) query.set('modality', params.modality)
  if (params.status) query.set('status', params.status)

  return query.toString()
}
