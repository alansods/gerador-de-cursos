'use client'

import { Check, Menu, Play } from 'lucide-react'
import { extractYouTubeId } from '@/lib/youtube'
import { videoSource } from '@/lib/blocks'
import type { Block } from '@/types/course'

export type LessonStatus = 'done' | 'current' | 'pending'

export function moduleNumber(unitIndex: number): string {
  return String(unitIndex + 1).padStart(2, '0')
}

export function isModuleDone(
  lessonCount: number,
  unitIndex: number,
  isDone: (unitIndex: number, lessonIndex: number) => boolean
): boolean {
  if (lessonCount === 0) return false
  return Array.from({ length: lessonCount }, (_, lessonIndex) =>
    isDone(unitIndex, lessonIndex)
  ).every(Boolean)
}

export function ModuleMarker({
  unitIndex,
  done,
  className = '',
}: {
  unitIndex: number
  done: boolean
  className?: string
}) {
  return (
    <span className="flex w-6 shrink-0 justify-center">
      {done ? (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--vl-done)] text-[var(--vl-ground)]">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
          <span className="sr-only">Módulo concluído</span>
        </span>
      ) : (
        <span className={`vl-mono text-[var(--vl-accent-strong)] ${className}`}>
          {moduleNumber(unitIndex)}
        </span>
      )}
    </span>
  )
}

export function lessonCountLabel(modules: number, lessons: number): string {
  return `${modules} ${modules === 1 ? 'módulo' : 'módulos'} · ${lessons} ${lessons === 1 ? 'aula' : 'aulas'}`
}

export function LessonStatusIcon({ status }: { status: LessonStatus }) {
  if (status === 'done') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--vl-done)] text-[var(--vl-ground)]">
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
        <span className="sr-only">Concluída</span>
      </span>
    )
  }

  if (status === 'current') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--vl-primary)] text-white">
        <Play className="h-2.5 w-2.5 fill-current" aria-hidden />
        <span className="sr-only">Aula atual</span>
      </span>
    )
  }

  return (
    <span className="h-6 w-6 shrink-0 rounded-full border-2 border-[var(--vl-pending)]">
      <span className="sr-only">Pendente</span>
    </span>
  )
}

interface VideoLessonsHeaderProps {
  onOpenMenu: () => void
  progress?: { done: number; total: number }
}

export function VideoLessonsHeader({ onOpenMenu, progress }: VideoLessonsHeaderProps) {
  const percentage =
    progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-[var(--vl-line)] bg-[var(--vl-ground)] px-4 sm:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir lista de aulas"
        className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[var(--vl-line)] bg-[var(--vl-surface)] text-[var(--vl-ink)] transition-colors hover:border-[var(--vl-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vl-accent)]"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {progress && (
        <div className="flex items-center gap-3 text-[13px] text-[var(--vl-muted)]">
          <span className="hidden sm:inline">
            {progress.done} de {progress.total} aulas concluídas
          </span>
          <div
            role="progressbar"
            aria-label="Progresso do curso"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--vl-line)] sm:w-44"
          >
            <div
              className="h-full rounded-full bg-[var(--vl-done)] transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="vl-mono text-[var(--vl-ink-dim)]">{percentage}%</span>
        </div>
      )}
    </header>
  )
}

interface LessonVideoProps {
  block: Block
  title: string
}

export function LessonVideo({ block, title }: LessonVideoProps) {
  const url = block.videoUrl?.trim()

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[#26343f] bg-[var(--vl-video)]">
      {!url ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[var(--vl-muted)]">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[var(--vl-pending)]">
            <Play className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-sm font-medium">Vídeo ainda não adicionado</span>
        </div>
      ) : videoSource(block, 'youtube') === 'file' ? (
        <video controls preload="metadata" className="h-full w-full" src={url}>
          Seu navegador não reproduz vídeo.
        </video>
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${extractYouTubeId(url)}`}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  )
}
