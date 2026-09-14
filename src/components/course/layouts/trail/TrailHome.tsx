'use client'

import { ArrowRight, Check, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Course } from '@/types/course'
import type { ProgressState } from '@/lib/scorm-progress'
import {
  deriveSteps,
  isStepCompleted,
  isUnitCompleted,
  unitBadge,
  unitStars,
  unitXp,
} from '@/lib/trail-progress'
import { BadgeCoin, ProgressSegments, Stars, buttonClass, stickerClass } from './TrailParts'

interface TrailHomeProps {
  course: Course
  state: ProgressState
  firstName: string
  recommendedIndex: number | null
  onOpenUnit: (unitId: string) => void
  onShowTrailComplete: () => void
}

const ROW_HEIGHT = 150
const nodeLeft = (index: number) => (index % 2 === 0 ? 30 : 70)

export function TrailHome({
  course,
  state,
  firstName,
  recommendedIndex,
  onOpenUnit,
  onShowTrailComplete,
}: TrailHomeProps) {
  const units = course.units ?? []
  const completedCount = units.filter((unit, index) => isUnitCompleted(state, unit, index)).length
  const allCompleted = units.length > 0 && completedCount === units.length
  const recommended = recommendedIndex === null ? null : units[recommendedIndex]

  const lead =
    units.length === 0
      ? 'Esta trilha ainda não tem missões.'
      : allCompleted
        ? 'Você concluiu todas as missões da trilha. Parabéns!'
        : completedCount === 0
          ? `Sua trilha tem ${units.length} ${units.length === 1 ? 'missão' : 'missões'}. Conclua as etapas de cada uma para ganhar XP e medalhas.`
          : `Você concluiu ${completedCount} de ${units.length} missões. Continue de onde parou.`

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 pt-8 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:pt-10">
      <section className="flex flex-col gap-3 lg:col-start-1 lg:row-start-1">
        <span className="self-start rounded-full border-2 border-(--trail-teal-deep) bg-(--trail-teal-soft) px-3 py-1 text-xs font-extrabold text-(--trail-teal-deep)">
          {course.category || 'Trilha do curso'}
        </span>
        <h1 className="trail-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
          {firstName ? `Olá, ${firstName}!` : 'Olá!'}
        </h1>
        <p className="max-w-[60ch] text-lg text-(--trail-ink-soft)">{lead}</p>
      </section>
      <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          {recommended && recommendedIndex !== null ? (
            <NextMissionCard
              unitTitle={recommended.title}
              unitIndex={recommendedIndex}
              steps={deriveSteps(recommended).length}
              isStepDone={(i) => isStepCompleted(state, recommendedIndex, i)}
              onOpen={() => onOpenUnit(recommended.id)}
            />
          ) : allCompleted ? (
            <section className={cn(stickerClass, 'flex flex-col gap-4 p-5')}>
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-(--trail-teal-deep)">
                Trilha concluída
              </span>
              <h2 className="trail-display text-2xl font-extrabold">Todas as missões feitas</h2>
              <button type="button" onClick={onShowTrailComplete} className={buttonClass.primary}>
                Ver resultado da trilha
                <ArrowRight aria-hidden className="h-5 w-5" strokeWidth={2.6} />
              </button>
            </section>
          ) : null}

          <section className={cn(stickerClass, 'flex flex-col gap-4 p-5')}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="trail-display text-xl font-extrabold">Suas medalhas</h2>
              <span className="text-xs font-bold text-(--trail-muted)">uma por missão</span>
            </div>
            <ul className="grid grid-cols-3 gap-x-2 gap-y-4">
              {units.map((unit, index) => {
                const earned = isUnitCompleted(state, unit, index)
                const badge = unitBadge(unit, index)
                return (
                  <li key={unit.id} className="flex flex-col items-center gap-1.5 text-center">
                    <BadgeCoin badge={badge} earned={earned} size={64} />
                    <span
                      className={cn(
                        'trail-display text-xs leading-tight font-extrabold',
                        !earned && 'text-(--trail-muted)'
                      )}
                    >
                      {earned ? badge.name : 'Bloqueada'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </aside>
      <div className="min-w-0 lg:col-start-1 lg:row-start-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="trail-display text-2xl font-extrabold">Mapa da trilha</h2>
          <span className="text-sm font-bold text-(--trail-muted) tabular-nums">
            {completedCount} de {units.length} missões
          </span>
        </div>

        <ol className="relative mt-4" aria-label="Missões da trilha">
          {units.map((unit, index) => {
            const done = isUnitCompleted(state, unit, index)
            const isRecommended = index === recommendedIndex
            const later = recommendedIndex !== null && index > recommendedIndex && !done
            const left = nodeLeft(index)
            const labelOnRight = left < 50
            const steps = deriveSteps(unit)
            const nextLeft = nodeLeft(index + 1)

            return (
              <li key={unit.id} className="relative" style={{ height: ROW_HEIGHT }}>
                {index < units.length - 1 && (
                  <svg
                    aria-hidden
                    className="pointer-events-none absolute left-0 w-full overflow-visible"
                    style={{ top: ROW_HEIGHT / 2, height: ROW_HEIGHT }}
                    viewBox={`0 0 100 ${ROW_HEIGHT}`}
                    preserveAspectRatio="none"
                  >
                    <path
                      d={`M ${left} 0 C ${left} ${ROW_HEIGHT / 2}, ${nextLeft} ${ROW_HEIGHT / 2}, ${nextLeft} ${ROW_HEIGHT}`}
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      className={cn(
                        done
                          ? 'stroke-(--trail-teal) [stroke-width:12px]'
                          : 'stroke-(--trail-line-strong) [stroke-dasharray:2_20] [stroke-width:9px]'
                      )}
                    />
                  </svg>
                )}

                <button
                  type="button"
                  onClick={() => onOpenUnit(unit.id)}
                  aria-label={`Missão ${index + 1}: ${unit.title}${done ? ' (concluída)' : isRecommended ? ' (você está aqui)' : ''}`}
                  className={cn(
                    'absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] transition-transform focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-(--trail-orange) motion-safe:hover:-translate-y-[55%]',
                    done &&
                      'h-20 w-20 border-(--trail-edge) bg-(--trail-teal-fill) text-(--trail-on-accent) shadow-[0_6px_0_var(--trail-edge)]',
                    isRecommended &&
                      'h-24 w-24 border-(--trail-edge) bg-(--trail-orange-fill) text-(--trail-on-accent) shadow-[0_7px_0_var(--trail-edge)]',
                    !done &&
                      !isRecommended &&
                      'h-20 w-20 border-dashed border-(--trail-line-strong) bg-(--trail-track) text-(--trail-muted)'
                  )}
                  style={{ left: `${left}%` }}
                >
                  {done ? (
                    <Check aria-hidden className="h-9 w-9" strokeWidth={3} />
                  ) : isRecommended ? (
                    <Play aria-hidden className="ml-1 h-10 w-10 fill-current" />
                  ) : (
                    <span aria-hidden className="trail-display text-2xl font-extrabold">
                      {index + 1}
                    </span>
                  )}
                </button>

                <div
                  className={cn(
                    'absolute top-1/2 flex w-[min(250px,38%)] -translate-y-1/2 flex-col gap-1',
                    labelOnRight ? 'items-start text-left' : 'items-end text-right'
                  )}
                  style={
                    labelOnRight
                      ? { left: `calc(${left}% + 64px)` }
                      : { right: `calc(${100 - left}% + 64px)` }
                  }
                >
                  {isRecommended && (
                    <span className="rounded-full bg-(--trail-edge) px-2.5 py-0.5 text-xs font-extrabold text-white">
                      Você está aqui
                    </span>
                  )}
                  <span
                    className={cn(
                      'text-[11px] font-extrabold uppercase tracking-[0.12em]',
                      done
                        ? 'text-(--trail-teal-deep)'
                        : isRecommended
                          ? 'text-(--trail-orange-deep)'
                          : 'text-(--trail-muted)'
                    )}
                  >
                    Missão {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="trail-display text-lg leading-tight font-extrabold text-balance">
                    {unit.title}
                  </span>
                  {done ? (
                    <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-(--trail-muted)">
                      <Stars count={unitStars(state, unit, index)} />
                      <span className="tabular-nums">{unitXp(state, unit, index)} XP</span>
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-(--trail-muted)">
                      {steps.length} {steps.length === 1 ? 'etapa' : 'etapas'}
                      {later ? ' · recomendada depois' : ''}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </main>
  )
}

function NextMissionCard({
  unitTitle,
  unitIndex,
  steps,
  isStepDone,
  onOpen,
}: {
  unitTitle: string
  unitIndex: number
  steps: number
  isStepDone: (index: number) => boolean
  onOpen: () => void
}) {
  const doneCount = Array.from({ length: steps }, (_, i) => isStepDone(i)).filter(Boolean).length
  const started = doneCount > 0

  return (
    <section className={cn(stickerClass, 'overflow-hidden')}>
      <div className="flex items-center justify-between gap-2 border-b-[2.5px] border-(--trail-edge) bg-(--trail-orange-fill) px-5 py-3 text-(--trail-on-accent)">
        <span className="text-xs font-extrabold uppercase tracking-[0.14em]">
          {started ? 'Continue de onde parou' : 'Próxima missão'}
        </span>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="trail-display flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-(--trail-edge) bg-(--trail-orange-soft) text-2xl font-extrabold text-(--trail-orange-deep)">
            {String(unitIndex + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <h2 className="trail-display text-xl leading-tight font-extrabold text-balance">
              {unitTitle}
            </h2>
            <p className="text-sm font-semibold text-(--trail-muted) tabular-nums">
              {doneCount} de {steps} {steps === 1 ? 'etapa concluída' : 'etapas concluídas'}
            </p>
          </div>
        </div>
        <ProgressSegments total={steps} done={isStepDone} current={doneCount} />
        <button type="button" onClick={onOpen} className={buttonClass.success}>
          {started ? 'Continuar missão' : 'Começar missão'}
          <ArrowRight aria-hidden className="h-5 w-5" strokeWidth={2.6} />
        </button>
      </div>
    </section>
  )
}
