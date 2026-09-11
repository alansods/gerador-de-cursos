import type { FetchCoursesParams } from '@/app/(app)/courses/actions'

export type CourseFilters = Omit<FetchCoursesParams, 'cursor'>

export interface UserFilters {
  page: number
  limit: number
  search?: string
  startDate?: string
  endDate?: string
  role?: string
}

export interface ScormJobFilters {
  page: number
  limit: number
}

export const queryKeys = {
  courses: {
    all: ['courses'] as const,
    lists: ['courses', 'list'] as const,
    list: (filters: CourseFilters) => ['courses', 'list', filters] as const,
    detail: (id: string) => ['courses', 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filters: UserFilters) => ['users', 'list', filters] as const,
  },
  scormJobs: {
    all: ['scorm-jobs'] as const,
    list: (filters: ScormJobFilters) => ['scorm-jobs', 'list', filters] as const,
    detail: (jobId: string) => ['scorm-jobs', 'detail', jobId] as const,
  },
  accessRequests: {
    pending: () => ['access-requests', 'pending'] as const,
    ofCourse: (courseId: string) => ['access-requests', 'course', courseId] as const,
  },
  activities: {
    recent: (limit: number) => ['activities', 'recent', limit] as const,
  },
  collaborators: (courseId: string) => ['collaborators', courseId] as const,
  comments: (courseId: string) => ['comments', courseId] as const,
} as const
