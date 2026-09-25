'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Unit } from '@/types/course'
import type { LessonRef, VideoLesson } from '@/lib/video-lessons'
import { LessonStatusIcon, lessonCountLabel, moduleNumber } from './VideoLessonsParts'

interface VideoLessonsSidebarProps {
  units: Unit[]
  lessonsByUnit: VideoLesson[][]
  current: LessonRef
  isDone: (unitIndex: number, lessonIndex: number) => boolean
  onSelect: (unitIndex: number, lessonIndex: number) => void
}

export function VideoLessonsSidebar({
  units,
  lessonsByUnit,
  current,
  isDone,
  onSelect,
}: VideoLessonsSidebarProps) {
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  const totalLessons = lessonsByUnit.reduce((sum, lessons) => sum + lessons.length, 0)

  return (
    <aside
      aria-label="Aulas do curso"
      className="sticky top-24 hidden max-h-[calc(100vh-12rem)] min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--vl-line)] bg-[var(--vl-surface)] lg:flex"
    >
      <div className="flex flex-col gap-1 border-b border-[var(--vl-line)] px-6 py-5">
        <span className="vl-display text-lg font-semibold">Conteúdo do curso</span>
        <span className="text-[13px] text-[var(--vl-muted)]">
          {lessonCountLabel(units.length, totalLessons)}
        </span>
      </div>
      <div className="grow overflow-y-auto p-2">
        {units.map((unit, unitIndex) => {
          const lessons = lessonsByUnit[unitIndex] ?? []
          const isOpen =
            closed[unit.id] === undefined ? unitIndex === current.unitIndex : !closed[unit.id]
          const done = lessons.filter((_, lessonIndex) => isDone(unitIndex, lessonIndex)).length
          return (
            <div key={unit.id} className="flex flex-col">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setClosed((state) => ({ ...state, [unit.id]: isOpen }))}
                className="flex min-h-[60px] items-center gap-3.5 rounded-[10px] px-4 py-3.5 text-left transition-colors hover:bg-[var(--vl-panel)]"
              >
                <span className="vl-mono text-[13px] text-[var(--vl-accent-strong)]">
                  {moduleNumber(unitIndex)}
                </span>
                <span className="flex grow flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{unit.title}</span>
                  <span className="text-xs text-[var(--vl-muted)]">
                    {done} de {lessons.length} aulas concluídas
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[var(--vl-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {isOpen && (
                <div className="flex flex-col gap-0.5 pb-2">
                  {lessons.map((lesson, lessonIndex) => {
                    const isCurrent =
                      unitIndex === current.unitIndex && lessonIndex === current.lessonIndex
                    const status = isDone(unitIndex, lessonIndex)
                      ? 'done'
                      : isCurrent
                        ? 'current'
                        : 'pending'
                    return (
                      <button
                        key={lesson.blockIndex}
                        type="button"
                        aria-current={isCurrent ? 'step' : undefined}
                        onClick={() => onSelect(unitIndex, lessonIndex)}
                        className={`flex min-h-12 items-center gap-3 rounded-[10px] py-2.5 pr-3.5 pl-4 text-left text-sm leading-snug transition-colors ${
                          isCurrent
                            ? 'bg-[var(--vl-current)] font-semibold text-white'
                            : 'text-[var(--vl-ink-soft)] hover:bg-[var(--vl-panel)]'
                        }`}
                      >
                        <LessonStatusIcon status={status} />
                        <span className="grow">{lesson.title}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
