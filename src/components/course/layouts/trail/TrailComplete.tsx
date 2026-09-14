'use client'

import { Map as MapIcon, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Course } from '@/types/course'
import type { ProgressState } from '@/lib/scorm-progress'
import { unitBadge, unitStars, type TrailLevel } from '@/lib/trail-progress'
import { BadgeCoin, buttonClass, stickerClass } from './TrailParts'

interface TrailCompleteProps {
  course: Course
  state: ProgressState
  firstName: string
  xp: number
  level: TrailLevel
  onHome: () => void
}

export function TrailComplete({ course, state, firstName, xp, level, onHome }: TrailCompleteProps) {
  const units = course.units ?? []
  const stars = units.reduce((sum, unit, index) => sum + unitStars(state, unit, index), 0)

  return (
    <main className="mx-auto max-w-4xl px-4 pt-8 pb-24 sm:px-6">
      <section
        className={cn(
          stickerClass,
          'flex flex-col items-center gap-6 px-5 py-10 text-center sm:px-10'
        )}
      >
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl border-[3px] border-(--trail-edge) bg-(--trail-gold) text-(--trail-edge) shadow-[0_5px_0_var(--trail-edge)]">
          <Trophy aria-hidden className="h-10 w-10" />
        </span>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-(--trail-orange-deep)">
            Trilha concluída
          </span>
          <h1 className="trail-display text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">
            {firstName ? `Parabéns, ${firstName}!` : 'Parabéns!'}
          </h1>
          <p className="mx-auto max-w-[52ch] text-lg text-(--trail-ink-soft)">
            Você concluiu todas as missões de {course.title}.
          </p>
        </div>

        <dl className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-0.5 rounded-2xl border-2 border-(--trail-edge) p-4">
            <dt className="order-2 text-xs font-bold text-(--trail-muted)">XP total</dt>
            <dd className="trail-display order-1 text-3xl font-extrabold tabular-nums">{xp}</dd>
          </div>
          <div className="flex flex-col gap-0.5 rounded-2xl border-2 border-(--trail-edge) p-4">
            <dt className="order-2 text-xs font-bold text-(--trail-muted)">{level.name}</dt>
            <dd className="trail-display order-1 text-3xl font-extrabold">Nível {level.number}</dd>
          </div>
          <div className="flex flex-col gap-0.5 rounded-2xl border-2 border-(--trail-edge) p-4">
            <dt className="order-2 text-xs font-bold text-(--trail-muted)">estrelas</dt>
            <dd className="trail-display order-1 text-3xl font-extrabold tabular-nums">
              {stars}/{units.length * 3}
            </dd>
          </div>
        </dl>

        <ul className="flex flex-wrap justify-center gap-4" aria-label="Medalhas conquistadas">
          {units.map((unit, index) => {
            const badge = unitBadge(unit, index)
            return (
              <li key={unit.id} className="flex w-24 flex-col items-center gap-1.5">
                <BadgeCoin badge={badge} earned size={60} />
                <span className="trail-display text-xs leading-tight font-extrabold">
                  {badge.name}
                </span>
              </li>
            )
          })}
        </ul>

        <button type="button" onClick={onHome} className={buttonClass.success}>
          <MapIcon aria-hidden className="h-5 w-5" />
          Voltar ao mapa
        </button>
      </section>
    </main>
  )
}
