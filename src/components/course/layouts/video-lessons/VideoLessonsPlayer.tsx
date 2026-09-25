'use client'

import { useMemo, useState } from 'react'
import type { LayoutPlayerProps } from '../types'
import { useScormProgress } from '@/hooks/useScormProgress'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
import { isStepCompleted } from '@/lib/trail-progress'
import { deriveLessons, lessonSequence } from '@/lib/video-lessons'
import { VideoLessonsHeader } from './VideoLessonsParts'
import { VideoLessonsHome } from './VideoLessonsHome'
import { VideoLessonsLesson } from './VideoLessonsLesson'
import { VideoLessonsSidebar } from './VideoLessonsSidebar'
import { VideoLessonsDrawer } from './VideoLessonsDrawer'

export function VideoLessonsPlayer({ course }: LayoutPlayerProps) {
  const { currentUnit, navigate, recordQuiz, completeStep, state } = useScormProgress(course)
  const [lessonByUnit, setLessonByUnit] = useState<Record<string, number>>({})
  const [menuOpen, setMenuOpen] = useState(false)

  const units = useMemo(() => course.units ?? [], [course.units])
  const lessonsByUnit = useMemo(() => units.map((unit) => deriveLessons(unit)), [units])
  const sequence = useMemo(() => lessonSequence(units), [units])

  const isDone = (unitIndex: number, lessonIndex: number) =>
    isStepCompleted(state, unitIndex, lessonIndex)
  const doneCount = sequence.filter((ref) => isDone(ref.unitIndex, ref.lessonIndex)).length

  const firstOpenLesson = (unitIndex: number) => {
    const open = lessonsByUnit[unitIndex].findIndex((_, index) => !isDone(unitIndex, index))
    return open === -1 ? 0 : open
  }

  const unitIndex = currentUnit ? units.findIndex((unit) => unit.id === currentUnit) : -1
  const unit = unitIndex >= 0 ? units[unitIndex] : null
  const lessons = unitIndex >= 0 ? lessonsByUnit[unitIndex] : []
  const lessonIndex =
    unit && lessonByUnit[unit.id] !== undefined
      ? Math.min(lessonByUnit[unit.id], Math.max(lessons.length - 1, 0))
      : unitIndex >= 0
        ? firstOpenLesson(unitIndex)
        : 0
  const position = sequence.findIndex(
    (ref) => ref.unitIndex === unitIndex && ref.lessonIndex === lessonIndex
  )

  const scrollTop = () => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }

  const goHome = () => {
    navigate(null)
    scrollTop()
  }

  const openLesson = (targetUnit: number, targetLesson: number) => {
    const target = units[targetUnit]
    if (!target) return
    navigate(target.id)
    setLessonByUnit((current) => ({ ...current, [target.id]: targetLesson }))
    scrollTop()
  }

  const start = () => {
    const next = sequence.find((ref) => !isDone(ref.unitIndex, ref.lessonIndex)) ?? sequence[0]
    if (next) openLesson(next.unitIndex, next.lessonIndex)
  }

  const completeCurrent = () => {
    if (unit && lessons.length > 0) completeStep(unit.id, lessonIndex)
  }

  const goPrevious = () => {
    const previous = sequence[position - 1]
    if (previous) openLesson(previous.unitIndex, previous.lessonIndex)
  }

  const goNext = () => {
    completeCurrent()
    const next = position >= 0 ? sequence[position + 1] : undefined
    if (next) openLesson(next.unitIndex, next.lessonIndex)
    else goHome()
  }

  return (
    <ScormProgressProvider value={{ unitId: currentUnit, recordQuiz }}>
      <div data-video-lessons className="min-h-screen">
        <VideoLessonsHeader
          onOpenMenu={() => setMenuOpen(true)}
          progress={unit ? { done: doneCount, total: sequence.length } : undefined}
        />
        <VideoLessonsDrawer
          open={menuOpen}
          onOpenChange={setMenuOpen}
          units={units}
          lessonsByUnit={lessonsByUnit}
          current={unit ? { unitIndex, lessonIndex } : null}
          isDone={isDone}
          onHome={goHome}
          onSelect={openLesson}
        />
        {unit ? (
          <VideoLessonsLesson
            unitIndex={unitIndex}
            lessonIndex={lessonIndex}
            lesson={lessons[lessonIndex] ?? null}
            done={lessons.length > 0 && isDone(unitIndex, lessonIndex)}
            hasPrevious={position > 0}
            isLast={position === sequence.length - 1}
            onPrevious={goPrevious}
            onNext={goNext}
            onComplete={completeCurrent}
            sidebar={
              <VideoLessonsSidebar
                key={unit.id}
                units={units}
                lessonsByUnit={lessonsByUnit}
                current={{ unitIndex, lessonIndex }}
                isDone={isDone}
                onSelect={openLesson}
              />
            }
          />
        ) : (
          <VideoLessonsHome
            course={course}
            lessonsByUnit={lessonsByUnit}
            isDone={isDone}
            doneCount={doneCount}
            totalLessons={sequence.length}
            onStart={start}
            onOpenLesson={openLesson}
          />
        )}
      </div>
    </ScormProgressProvider>
  )
}
