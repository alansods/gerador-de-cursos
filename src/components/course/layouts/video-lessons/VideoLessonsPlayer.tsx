'use client'

import { useMemo } from 'react'
import type { LayoutPlayerProps } from '../types'
import { useScormProgress } from '@/hooks/useScormProgress'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
import { isStepCompleted } from '@/lib/trail-progress'
import { deriveLessons, lessonSequence } from '@/lib/video-lessons'
import { VideoLessonsHeader } from './VideoLessonsParts'
import { VideoLessonsHome } from './VideoLessonsHome'

export function VideoLessonsPlayer({ course }: LayoutPlayerProps) {
  const { currentUnit, navigate, recordQuiz, state } = useScormProgress(course)

  const units = useMemo(() => course.units ?? [], [course.units])
  const lessonsByUnit = useMemo(() => units.map((unit) => deriveLessons(unit)), [units])
  const sequence = useMemo(() => lessonSequence(units), [units])

  const isDone = (unitIndex: number, lessonIndex: number) =>
    isStepCompleted(state, unitIndex, lessonIndex)
  const doneCount = sequence.filter((ref) => isDone(ref.unitIndex, ref.lessonIndex)).length

  const scrollTop = () => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }

  const openLesson = (unitIndex: number) => {
    const unit = units[unitIndex]
    if (!unit) return
    navigate(unit.id)
    scrollTop()
  }

  const start = () => {
    const next = sequence.find((ref) => !isDone(ref.unitIndex, ref.lessonIndex)) ?? sequence[0]
    if (next) openLesson(next.unitIndex)
  }

  return (
    <ScormProgressProvider value={{ unitId: currentUnit, recordQuiz }}>
      <div data-video-lessons className="min-h-screen">
        <VideoLessonsHeader onOpenMenu={() => undefined} />
        <VideoLessonsHome
          course={course}
          lessonsByUnit={lessonsByUnit}
          isDone={isDone}
          doneCount={doneCount}
          totalLessons={sequence.length}
          onStart={start}
          onOpenLesson={openLesson}
        />
      </div>
    </ScormProgressProvider>
  )
}
