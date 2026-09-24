import type { Block, Course, Unit } from '@/types/course'
import type { CompletionRule } from '@/lib/scorm-progress'

export const MAX_VIDEO_DESCRIPTION_LENGTH = 2000

export interface VideoLesson {
  title: string
  block: Block
  blockIndex: number
}

export interface MissingVideoLesson {
  unitIndex: number
  lessonIndex: number
  unitTitle: string
  lessonTitle: string
}

export function limitVideoDescription(value: unknown): { videoDescription?: string } {
  return typeof value === 'string'
    ? { videoDescription: value.slice(0, MAX_VIDEO_DESCRIPTION_LENGTH) }
    : {}
}

export function deriveLessons(unit: Pick<Unit, 'title' | 'blocks'>): VideoLesson[] {
  const lessons: VideoLesson[] = []

  ;(unit.blocks ?? []).forEach((block, blockIndex) => {
    if (block.type !== 'video') return
    const title = block.videoTitle?.trim() || `${unit.title} — Aula ${lessons.length + 1}`
    lessons.push({ title, block, blockIndex })
  })

  return lessons
}

export function videoLessonsCompletionRule(course: Pick<Course, 'units'>): CompletionRule {
  return {
    kind: 'steps',
    stepCounts: (course.units ?? []).map((unit) => deriveLessons(unit).length),
  }
}

export function lessonsMissingVideo(course: Pick<Course, 'units'>): MissingVideoLesson[] {
  return (course.units ?? []).flatMap((unit, unitIndex) =>
    deriveLessons(unit)
      .map((lesson, lessonIndex) => ({ lesson, lessonIndex }))
      .filter(({ lesson }) => !lesson.block.videoUrl?.trim())
      .map(({ lesson, lessonIndex }) => ({
        unitIndex,
        lessonIndex,
        unitTitle: unit.title,
        lessonTitle: lesson.title,
      }))
  )
}
