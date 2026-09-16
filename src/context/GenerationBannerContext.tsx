'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { FinishedGenerationJob } from '@/types/course-generation'

export type GenerationBanner =
  | {
      jobId: string
      courseId: string
      fileName: string
      status: 'GENERATING'
      shownAt: number
    }
  | (FinishedGenerationJob & { jobId: string; shownAt: number })

interface GeneratingInput {
  jobId: string
  courseId: string
  fileName: string
}

interface GenerationBannerContextValue {
  banners: GenerationBanner[]
  showGenerating: (job: GeneratingInput) => void
  showFinished: (job: FinishedGenerationJob) => void
  dismiss: (jobId: string) => void
}

const GenerationBannerContext = createContext<GenerationBannerContextValue | null>(null)

export function GenerationBannerProvider({ children }: { children: React.ReactNode }) {
  const [banners, setBanners] = useState<GenerationBanner[]>([])

  const upsert = useCallback((banner: GenerationBanner) => {
    setBanners((current) => {
      const index = current.findIndex((item) => item.jobId === banner.jobId)
      if (index === -1) return [...current, banner]

      const next = [...current]
      next[index] = banner
      return next
    })
  }, [])

  const showGenerating = useCallback(
    (job: GeneratingInput) => upsert({ ...job, status: 'GENERATING', shownAt: Date.now() }),
    [upsert]
  )

  const showFinished = useCallback(
    (job: FinishedGenerationJob) => upsert({ ...job, jobId: job.id, shownAt: Date.now() }),
    [upsert]
  )

  const dismiss = useCallback((jobId: string) => {
    setBanners((current) => current.filter((banner) => banner.jobId !== jobId))
  }, [])

  const value = useMemo(
    () => ({ banners, showGenerating, showFinished, dismiss }),
    [banners, showGenerating, showFinished, dismiss]
  )

  return (
    <GenerationBannerContext.Provider value={value}>{children}</GenerationBannerContext.Provider>
  )
}

export function useGenerationBanners() {
  const context = useContext(GenerationBannerContext)

  if (!context) {
    throw new Error('useGenerationBanners must be used inside GenerationBannerProvider')
  }

  return context
}
