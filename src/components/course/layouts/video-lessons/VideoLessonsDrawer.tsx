'use client'

import { Play, X } from 'lucide-react'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Unit } from '@/types/course'
import type { LessonRef, VideoLesson } from '@/lib/video-lessons'
import { LessonStatusIcon, lessonCountLabel, moduleNumber } from './VideoLessonsParts'

interface VideoLessonsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  units: Unit[]
  lessonsByUnit: VideoLesson[][]
  current: LessonRef | null
  isDone: (unitIndex: number, lessonIndex: number) => boolean
  onHome: () => void
  onSelect: (unitIndex: number, lessonIndex: number) => void
}

export function VideoLessonsDrawer({
  open,
  onOpenChange,
  units,
  lessonsByUnit,
  current,
  isDone,
  onHome,
  onSelect,
}: VideoLessonsDrawerProps) {
  const totalLessons = lessonsByUnit.reduce((sum, lessons) => sum + lessons.length, 0)
  const atHome = current === null

  const choose = (action: () => void) => {
    action()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        hideClose
        data-video-lessons
        className="flex w-[min(420px,90vw)] flex-col gap-0 border-r border-[var(--vl-line)] bg-[var(--vl-panel)] p-0 text-[var(--vl-ink)] sm:max-w-none"
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[var(--vl-line)] pr-4 pl-6">
          <div className="flex flex-col gap-0.5">
            <SheetTitle className="vl-display text-[17px] font-semibold text-[var(--vl-ink)]">
              Conteúdo do curso
            </SheetTitle>
            <SheetDescription className="text-[13px] text-[var(--vl-muted)]">
              {lessonCountLabel(units.length, totalLessons)}
            </SheetDescription>
          </div>
          <SheetClose
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center rounded-[10px] text-[var(--vl-ink-dim)] transition-colors hover:bg-[var(--vl-surface)]"
          >
            <X className="h-5 w-5" aria-hidden />
          </SheetClose>
        </div>

        <nav
          aria-label="Aulas do curso"
          className="flex grow flex-col gap-2 overflow-y-auto p-3 pb-6"
        >
          <button
            type="button"
            aria-current={atHome ? 'page' : undefined}
            onClick={() => choose(onHome)}
            className={`flex items-center gap-3 rounded-[10px] p-3 text-left text-sm font-semibold transition-colors ${
              atHome
                ? 'bg-[var(--vl-current)] text-white'
                : 'text-[var(--vl-ink-soft)] hover:bg-[var(--vl-surface)]'
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--vl-primary)] text-white">
              <Play className="h-[11px] w-[11px] fill-current" aria-hidden />
            </span>
            Apresentação do curso
          </button>

          {units.map((unit, unitIndex) => (
            <div key={unit.id} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-3 px-3 pt-3.5 pb-1.5">
                <span className="vl-mono text-xs text-[var(--vl-accent-strong)]">
                  {moduleNumber(unitIndex)}
                </span>
                <span className="text-[13px] font-semibold tracking-[0.02em] text-[var(--vl-ink-dim)]">
                  {unit.title}
                </span>
              </div>
              {(lessonsByUnit[unitIndex] ?? []).map((lesson, lessonIndex) => {
                const isCurrent =
                  current?.unitIndex === unitIndex && current.lessonIndex === lessonIndex
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
                    onClick={() => choose(() => onSelect(unitIndex, lessonIndex))}
                    className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-2 text-left text-sm leading-snug transition-colors ${
                      isCurrent
                        ? 'bg-[var(--vl-current)] font-semibold text-white'
                        : 'text-[var(--vl-ink-soft)] hover:bg-[var(--vl-surface)]'
                    }`}
                  >
                    <LessonStatusIcon status={status} />
                    <span className="grow">{lesson.title}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
