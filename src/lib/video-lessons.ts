import type { Block, Course, Unit } from '@/types/course'
import type { CompletionRule } from '@/lib/scorm-progress'
import { VIDEO_LESSONS_LAYOUT_ID } from '@/lib/layout-blocks'

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

export function toGeneratedLesson(block: Block): Block | null {
  const title = typeof block.videoTitle === 'string' ? block.videoTitle.trim() : ''
  if (!title) return null

  const url = typeof block.videoUrl === 'string' ? block.videoUrl.trim() : ''
  const videoUrl = /^https?:\/\/\S+$/i.test(url) ? url : ''

  return {
    ...block,
    videoTitle: title,
    videoUrl,
    videoSource: /\.(mp4|webm)(\?|$)/i.test(videoUrl) ? 'file' : 'youtube',
    ...limitVideoDescription(
      typeof block.videoDescription === 'string' ? block.videoDescription.trim() : undefined
    ),
  }
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

export function missingVideoExportError(course: Pick<Course, 'layout' | 'units'>): string | null {
  if (course.layout !== VIDEO_LESSONS_LAYOUT_ID) return null

  const missing = lessonsMissingVideo(course)
  if (missing.length === 0) return null

  const lessons = missing
    .map(
      ({ unitIndex, lessonIndex, lessonTitle }) =>
        `Módulo ${unitIndex + 1} · Aula ${lessonIndex + 1} (${lessonTitle})`
    )
    .join('; ')
  return `Adicione o vídeo das aulas pendentes antes de exportar: ${lessons}`
}

export interface LessonRef {
  unitIndex: number
  lessonIndex: number
}

export function lessonSequence(units: Pick<Unit, 'title' | 'blocks'>[] | undefined): LessonRef[] {
  return (units ?? []).flatMap((unit, unitIndex) =>
    deriveLessons(unit).map((_, lessonIndex) => ({ unitIndex, lessonIndex }))
  )
}
