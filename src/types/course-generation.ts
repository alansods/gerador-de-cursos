export type CourseGenerationStatus = 'GENERATING' | 'COMPLETED' | 'FAILED'

export interface ActiveGenerationJob {
  id: string
  courseId: string
  fileName: string
}

export interface FinishedGenerationJob {
  id: string
  courseId: string
  courseSlug: string
  courseTitle: string
  fileName: string
  status: 'COMPLETED' | 'FAILED'
  error: string | null
  finishedAt: string | null
}

export interface GenerationJobsResponse {
  active: ActiveGenerationJob[]
  finished: FinishedGenerationJob[]
}

export interface CourseGenerationInfo {
  jobId: string
  status: 'GENERATING' | 'FAILED'
  fileName: string
  error: string | null
}
