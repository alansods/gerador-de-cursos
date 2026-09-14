'use client'

import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Unit } from '@/types/course'
import type { ProgressState } from '@/lib/scorm-progress'
import { quizKey } from '@/lib/scorm-progress'
import {
  isStepAnswered,
  isStepCompleted,
  scoredBlockIndices,
  type TrailStep,
} from '@/lib/trail-progress'
import { BlockRenderer } from '@/components/course/blocks'
import { buttonClass } from './TrailParts'
import { trailMeta } from './meta'

interface TrailUnitProps {
  unit: Unit
  unitIndex: number
  steps: TrailStep[]
  stepIndex: number
  state: ProgressState
  onStepChange: (stepIndex: number) => void
  onFinishStep: (stepIndex: number) => void
  onHome: () => void
}

export function stepContentIndices(unit: Unit, step: TrailStep): number[] {
  const [first, ...rest] = step.blockIndices
  if (first === undefined) return []
  return unit.blocks[first]?.type === 'heading' ? rest : step.blockIndices
}

export function TrailUnit({
  unit,
  unitIndex,
  steps,
  stepIndex,
  state,
  onStepChange,
  onFinishStep,
  onHome,
}: TrailUnitProps) {
  const step = steps[stepIndex] ?? steps[0]
  const contentIndices = stepContentIndices(unit, step)
  const scored = scoredBlockIndices(unit, step)
  const answered = scored.filter((index) => state.quizzes[quizKey(unitIndex, index)] !== undefined)
  const ready = isStepAnswered(state, unit, unitIndex, step)
  const completed = isStepCompleted(state, unitIndex, stepIndex)
  const isLast = stepIndex === steps.length - 1

  const primaryLabel = completed
    ? isLast
      ? 'Ver resultado da missão'
      : 'Próxima etapa'
    : isLast
      ? 'Concluir missão'
      : 'Concluir etapa'

  const stepList = (compact: boolean) =>
    steps.map((item, index) => {
      const done = isStepCompleted(state, unitIndex, index)
      const current = index === stepIndex
      return (
        <li key={index} className={compact ? 'shrink-0' : undefined}>
          <button
            type="button"
            onClick={() => onStepChange(index)}
            aria-current={current ? 'step' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--trail-orange)',
              compact ? 'min-h-11 py-1.5 pr-3 pl-1.5' : 'min-h-14 px-3.5 py-2.5',
              current
                ? 'border-[2.5px] border-(--trail-edge) bg-(--trail-orange-soft) shadow-[0_4px_0_var(--trail-edge)]'
                : done
                  ? 'border-2 border-(--trail-line) bg-(--trail-paper) text-(--trail-ink-soft)'
                  : 'border-2 border-dashed border-(--trail-line-strong) text-(--trail-muted)'
            )}
          >
            <span
              className={cn(
                'trail-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold',
                current
                  ? 'border-(--trail-edge) bg-(--trail-orange-fill) text-(--trail-on-accent)'
                  : done
                    ? 'border-(--trail-edge) bg-(--trail-teal-fill) text-(--trail-on-accent)'
                    : 'border-current'
              )}
            >
              {done && !current ? (
                <Check aria-hidden className="h-4 w-4" strokeWidth={3.2} />
              ) : (
                index + 1
              )}
            </span>
            <span className={cn('font-bold leading-snug', compact ? 'text-sm' : 'text-[15px]')}>
              {item.title}
              {done && <span className="sr-only"> (concluída)</span>}
            </span>
          </button>
        </li>
      )
    })

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-6 pb-24 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-14 lg:pt-10">
      <aside className="hidden lg:block">
        <div className="sticky top-24 flex flex-col gap-3">
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-(--trail-muted)">
            Etapas da missão
          </span>
          <ol className="flex flex-col gap-2.5">{stepList(false)}</ol>
        </div>
      </aside>

      <main className="flex min-w-0 flex-col gap-6">
        <ol
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden"
          aria-label="Etapas da missão"
        >
          {stepList(true)}
        </ol>

        <header className="flex flex-col gap-3">
          <span className="self-start rounded-full bg-(--trail-edge) px-3 py-1 text-xs font-extrabold tracking-wide text-white">
            ETAPA {stepIndex + 1} DE {steps.length}
          </span>
          <h1 className="trail-display text-3xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-4xl">
            {step.title}
          </h1>
        </header>

        {contentIndices.length > 0 ? (
          <BlockRenderer
            block={contentIndices.map((index) => unit.blocks[index])}
            indexOffset={contentIndices[0]}
            theme={trailMeta.blockTheme}
          />
        ) : (
          <p className="text-(--trail-muted)">Esta etapa não tem conteúdo.</p>
        )}

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-[2.5px] border-dashed border-(--trail-line-strong) pt-6">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={() => onStepChange(stepIndex - 1)}
              className={buttonClass.flat}
            >
              <ArrowLeft aria-hidden className="h-5 w-5" strokeWidth={2.6} />
              Etapa anterior
            </button>
          ) : (
            <button type="button" onClick={onHome} className={buttonClass.flat}>
              <ArrowLeft aria-hidden className="h-5 w-5" strokeWidth={2.6} />
              Mapa
            </button>
          )}

          {!ready && (
            <span
              className="order-last w-full text-sm font-bold text-(--trail-muted) sm:order-none sm:w-auto"
              role="status"
            >
              Responda as atividades para concluir: {answered.length} de {scored.length}
            </span>
          )}

          <button
            type="button"
            onClick={() => onFinishStep(stepIndex)}
            disabled={!ready && !completed}
            className={buttonClass.primary}
          >
            {primaryLabel}
            <ArrowRight aria-hidden className="h-5 w-5" strokeWidth={2.6} />
          </button>
        </footer>
      </main>
    </div>
  )
}
