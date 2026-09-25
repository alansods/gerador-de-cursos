'use client'

import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { VideoLesson } from '@/lib/video-lessons'
import { LessonVideo, moduleNumber } from './VideoLessonsParts'

interface VideoLessonsLessonProps {
  unitIndex: number
  lessonIndex: number
  lesson: VideoLesson | null
  done: boolean
  hasPrevious: boolean
  isLast: boolean
  onPrevious: () => void
  onNext: () => void
  onComplete: () => void
  sidebar: ReactNode
}

export function VideoLessonsLesson({
  unitIndex,
  lessonIndex,
  lesson,
  done,
  hasPrevious,
  isLast,
  onPrevious,
  onNext,
  onComplete,
  sidebar,
}: VideoLessonsLessonProps) {
  const description = lesson?.block.videoDescription?.trim()

  return (
    <div className="mx-auto grid max-w-[1440px] items-start gap-8 px-4 pt-6 pb-28 sm:px-8 sm:pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
      <main className="flex min-w-0 flex-col gap-7">
        {lesson ? (
          <>
            <LessonVideo block={lesson.block} title={lesson.title} />

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-6">
              <div className="flex flex-col gap-2.5">
                <span className="vl-mono text-xs tracking-[0.08em] text-[var(--vl-accent)]">
                  MÓDULO {moduleNumber(unitIndex)} · AULA {moduleNumber(lessonIndex)}
                </span>
                <h1 className="vl-display text-2xl font-semibold tracking-[-0.01em] sm:text-[30px]">
                  {lesson.title}
                </h1>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                  aria-label="Aula anterior"
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--vl-line-strong)] bg-[var(--vl-surface)] text-[var(--vl-ink)] transition-colors hover:border-[var(--vl-muted)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-[18px] w-[18px]" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={onComplete}
                  disabled={done}
                  className={`flex h-12 items-center gap-2 rounded-xl border px-4 text-[15px] font-medium transition-colors ${
                    done
                      ? 'cursor-default border-[#1f5a3c] bg-[var(--vl-done-soft)] text-[var(--vl-done)]'
                      : 'border-[var(--vl-line-strong)] bg-[var(--vl-surface)] text-[var(--vl-ink)] hover:border-[var(--vl-muted)]'
                  }`}
                >
                  <Check className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
                  {done ? 'Concluída' : 'Marcar como concluída'}
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="flex h-12 items-center gap-2 rounded-xl bg-[var(--vl-primary)] px-5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {isLast ? 'Concluir curso' : 'Próxima aula'}
                  <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </div>
            </div>

            {description && (
              <section className="flex flex-col gap-4">
                <h2 className="border-b border-[var(--vl-line)] pb-3 text-[15px] font-semibold">
                  Descrição
                </h2>
                <p className="max-w-[760px] text-[17px] leading-[1.7] whitespace-pre-line text-[var(--vl-ink-soft)]">
                  {description}
                </p>
              </section>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-[var(--vl-line)] bg-[var(--vl-surface)] p-8">
            <span className="vl-mono text-xs tracking-[0.08em] text-[var(--vl-accent)]">
              MÓDULO {moduleNumber(unitIndex)}
            </span>
            <p className="text-[var(--vl-muted)]">Este módulo ainda não tem aulas.</p>
          </div>
        )}
      </main>

      {sidebar}
    </div>
  )
}
