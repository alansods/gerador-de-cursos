'use client'

import { useState } from 'react'
import { ChevronDown, Clock, Layers, Play, Target, Check } from 'lucide-react'
import type { Course } from '@/types/course'
import type { VideoLesson } from '@/lib/video-lessons'
import { extractYouTubeId } from '@/lib/youtube'
import { LessonStatusIcon, lessonCountLabel, moduleNumber } from './VideoLessonsParts'

const CONTENT_ID = 'vl-course-content'

interface VideoLessonsHomeProps {
  course: Course
  lessonsByUnit: VideoLesson[][]
  isDone: (unitIndex: number, lessonIndex: number) => boolean
  doneCount: number
  totalLessons: number
  onStart: () => void
  onOpenLesson: (unitIndex: number, lessonIndex: number) => void
}

export function VideoLessonsHome({
  course,
  lessonsByUnit,
  isDone,
  doneCount,
  totalLessons,
  onStart,
  onOpenLesson,
}: VideoLessonsHomeProps) {
  const units = course.units ?? []
  const [openModule, setOpenModule] = useState<number | null>(0)
  const bannerVideoId = course.bannerVideoUrl ? extractYouTubeId(course.bannerVideoUrl) : ''
  const objectives = (course.objectives ?? []).filter((objective) => objective.trim())
  const percentage = totalLessons > 0 ? Math.round((doneCount / totalLessons) * 100) : 0
  const started = doneCount > 0
  const summary = lessonCountLabel(units.length, totalLessons)

  const showContent = () => {
    document.getElementById(CONTENT_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="pb-28">
      <section
        className={`mx-auto grid max-w-[1312px] gap-10 px-4 py-12 sm:px-8 lg:py-[72px] ${
          bannerVideoId
            ? 'lg:grid-cols-[minmax(0,512px)_minmax(0,1fr)] lg:items-center lg:gap-16'
            : ''
        }`}
      >
        <div className={`flex flex-col gap-7 ${bannerVideoId ? '' : 'max-w-3xl'}`}>
          {course.category && (
            <span className="vl-mono self-start rounded-full border border-[#24476b] bg-[#122233] px-3 py-1.5 text-xs uppercase tracking-[0.08em] text-[var(--vl-accent)]">
              {course.category}
            </span>
          )}
          <h1 className="vl-display text-4xl leading-[1.05] font-bold tracking-[-0.02em] sm:text-[56px]">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-lg leading-relaxed whitespace-pre-line text-[#b3c0ca]">
              {course.description}
            </p>
          )}
          <div className="grid gap-x-6 gap-y-3.5 text-[15px] text-[var(--vl-ink-dim)] sm:grid-cols-2">
            {course.workload && (
              <div className="flex items-center gap-2.5">
                <Clock className="h-[18px] w-[18px] text-[var(--vl-accent-strong)]" aria-hidden />
                {course.workload} de carga horária
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <Layers className="h-[18px] w-[18px] text-[var(--vl-accent-strong)]" aria-hidden />
              {summary}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onStart}
              disabled={totalLessons === 0}
              className="flex h-[52px] items-center gap-2.5 rounded-xl bg-[var(--vl-primary)] px-6 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden />
              {started ? 'Continuar curso' : 'Começar curso'}
            </button>
            <button
              type="button"
              onClick={showContent}
              className="flex h-[52px] items-center rounded-xl border border-[var(--vl-line-strong)] bg-[var(--vl-surface)] px-6 text-base font-medium text-[var(--vl-ink)] transition-colors hover:border-[var(--vl-muted)]"
            >
              Ver conteúdo
            </button>
          </div>
        </div>

        {bannerVideoId && (
          <div className="aspect-video w-full overflow-hidden rounded-[18px] border border-[#26343f] bg-[var(--vl-video)]">
            <iframe
              src={`https://www.youtube.com/embed/${bannerVideoId}`}
              title="Apresentação do curso"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </section>

      <section
        id={CONTENT_ID}
        className="mx-auto grid max-w-[1312px] scroll-mt-20 items-start gap-8 px-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] lg:gap-12"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="vl-display text-2xl font-semibold tracking-[-0.01em] sm:text-[30px]">
              Conteúdo do curso
            </h2>
            <span className="text-sm text-[var(--vl-muted)]">{summary}</span>
          </div>
          <div className="flex flex-col gap-3">
            {units.map((unit, unitIndex) => {
              const lessons = lessonsByUnit[unitIndex] ?? []
              const isOpen = openModule === unitIndex
              const panelId = `vl-module-${unit.id}`
              return (
                <div
                  key={unit.id}
                  className="overflow-hidden rounded-[14px] border border-[var(--vl-line)] bg-[var(--vl-surface)]"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenModule(isOpen ? null : unitIndex)}
                    className="flex w-full items-center gap-5 px-6 py-5 text-left"
                  >
                    <span className="vl-mono text-sm text-[var(--vl-accent-strong)]">
                      {moduleNumber(unitIndex)}
                    </span>
                    <span className="flex grow flex-col gap-1">
                      <span className="text-lg font-semibold">{unit.title}</span>
                      <span className="text-[13px] text-[var(--vl-muted)]">
                        {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[var(--vl-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                  {isOpen && (
                    <div
                      id={panelId}
                      className="flex flex-col border-t border-[var(--vl-line)] px-3 pt-2 pb-3"
                    >
                      {unit.description?.trim() && (
                        <p className="px-3 pt-2 pb-1 text-sm leading-relaxed text-[var(--vl-muted)]">
                          {unit.description}
                        </p>
                      )}
                      {lessons.length === 0 ? (
                        <p className="p-3 text-sm text-[var(--vl-muted)]">
                          Este módulo ainda não tem aulas.
                        </p>
                      ) : (
                        lessons.map((lesson, lessonIndex) => (
                          <button
                            key={lesson.blockIndex}
                            type="button"
                            onClick={() => onOpenLesson(unitIndex, lessonIndex)}
                            className="flex items-center gap-3.5 rounded-[10px] p-3 text-left text-[15px] text-[var(--vl-ink-dim)] transition-colors hover:bg-[var(--vl-panel)]"
                          >
                            <LessonStatusIcon
                              status={isDone(unitIndex, lessonIndex) ? 'done' : 'pending'}
                            />
                            <span className="grow">{lesson.title}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <aside className="flex flex-col gap-5 lg:pt-[60px]">
          <div className="flex flex-col gap-3.5 rounded-2xl border border-[var(--vl-line)] bg-[var(--vl-surface)] p-6">
            <div className="vl-mono text-[13px] tracking-[0.08em] text-[var(--vl-muted)]">
              SEU PROGRESSO
            </div>
            <div className="flex items-baseline gap-2">
              <span className="vl-display text-[32px] font-bold">{doneCount}</span>
              <span className="text-[15px] text-[var(--vl-muted)]">
                de {totalLessons} {totalLessons === 1 ? 'aula concluída' : 'aulas concluídas'}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Progresso do curso"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentage}
              className="h-1.5 overflow-hidden rounded-full bg-[var(--vl-line)]"
            >
              <div
                className="h-full rounded-full bg-[var(--vl-done)] transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <button
              type="button"
              onClick={onStart}
              disabled={totalLessons === 0}
              className="flex h-[46px] items-center justify-center rounded-[10px] bg-[var(--vl-primary)] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {started ? 'Continuar de onde parei' : 'Assistir primeira aula'}
            </button>
          </div>

          {objectives.length > 0 && (
            <div className="flex flex-col gap-3.5 rounded-2xl border border-[var(--vl-line)] bg-[var(--vl-surface)] p-6">
              <h2 className="vl-mono flex items-center gap-2.5 text-[13px] font-normal tracking-[0.08em] text-[var(--vl-muted)]">
                <Target className="h-[18px] w-[18px] text-[var(--vl-accent-strong)]" aria-hidden />
                OBJETIVOS
              </h2>
              <ul className="flex flex-col gap-3.5">
                {objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-3 text-[15px] leading-normal">
                    <Check
                      className="mt-[3px] h-[18px] w-[18px] shrink-0 text-[var(--vl-done)]"
                      strokeWidth={2.2}
                      aria-hidden
                    />
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>

      <footer className="mx-auto mt-16 flex max-w-[1312px] items-center justify-between border-t border-[var(--vl-line)] px-4 py-6 text-[13px] text-[var(--vl-muted)] sm:px-8">
        <span>{course.title}</span>
      </footer>
    </div>
  )
}
