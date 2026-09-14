'use client'

import { ArrowRight, Map as MapIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrailBadge, TrailLevel } from '@/lib/trail-progress'
import { BadgeCoin, Stars, buttonClass } from './TrailParts'

interface TrailUnitCompleteProps {
  unitNumber: number
  badge: TrailBadge
  stars: number
  unitXp: number
  firstTries: number
  scoredCount: number
  stepCount: number
  level: TrailLevel
  nextUnitTitle: string | null
  allCompleted: boolean
  onHome: () => void
  onNext: () => void
  onShowTrailComplete: () => void
}

export function TrailUnitComplete({
  unitNumber,
  badge,
  stars,
  unitXp,
  firstTries,
  scoredCount,
  stepCount,
  level,
  nextUnitTitle,
  allCompleted,
  onHome,
  onNext,
  onShowTrailComplete,
}: TrailUnitCompleteProps) {
  return (
    <main className="mx-auto max-w-4xl px-4 pt-8 pb-24 sm:px-6">
      <section className="flex flex-col items-center gap-6 rounded-[32px] border-[2.5px] border-(--trail-edge) bg-(--trail-edge) px-5 py-12 text-center text-white sm:px-10">
        <span className="rounded-full border-2 border-white/30 bg-white/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.14em]">
          Missão {String(unitNumber).padStart(2, '0')} concluída
        </span>

        <BadgeCoin
          badge={badge}
          earned
          size={140}
          className="border-white motion-safe:animate-[trail-drop_0.8s_cubic-bezier(.2,.8,.3,1.2)_both]"
        />

        <div className="flex flex-col gap-2">
          <span className="font-bold text-(--trail-gold)">Nova medalha desbloqueada</span>
          <h1 className="trail-display text-4xl leading-none font-extrabold tracking-tight text-balance sm:text-6xl">
            {badge.name}
          </h1>
        </div>

        <Stars count={stars} size={48} label={`${stars} de 3 estrelas nesta missão`} />

        <dl className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-0.5 rounded-2xl bg-(--trail-paper) p-4 text-(--trail-ink)">
            <dt className="order-2 text-xs font-bold text-(--trail-muted)">XP nesta missão</dt>
            <dd className="trail-display order-1 text-3xl font-extrabold text-(--trail-gold-deep) tabular-nums">
              +{unitXp}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 rounded-2xl bg-(--trail-paper) p-4 text-(--trail-ink)">
            <dt className="order-2 text-xs font-bold text-(--trail-muted)">
              {scoredCount > 0
                ? 'acertos de primeira'
                : stepCount === 1
                  ? 'etapa concluída'
                  : 'etapas concluídas'}
            </dt>
            <dd className="trail-display order-1 text-3xl font-extrabold text-(--trail-teal-deep) tabular-nums">
              {scoredCount > 0 ? `${firstTries} de ${scoredCount}` : stepCount}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 rounded-2xl bg-(--trail-paper) p-4 text-(--trail-ink)">
            <dt className="order-2 text-xs font-bold text-(--trail-muted)">{level.name}</dt>
            <dd className="trail-display order-1 text-3xl font-extrabold text-(--trail-orange-deep)">
              Nível {level.number}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onHome}
            className={cn(buttonClass.flat, 'border-white text-white')}
          >
            <MapIcon aria-hidden className="h-5 w-5" />
            Voltar ao mapa
          </button>
          {allCompleted ? (
            <button type="button" onClick={onShowTrailComplete} className={buttonClass.primary}>
              Ver resultado da trilha
              <ArrowRight aria-hidden className="h-5 w-5" strokeWidth={2.6} />
            </button>
          ) : nextUnitTitle ? (
            <button type="button" onClick={onNext} className={buttonClass.primary}>
              Próxima: {nextUnitTitle}
              <ArrowRight aria-hidden className="h-5 w-5" strokeWidth={2.6} />
            </button>
          ) : null}
        </div>
      </section>
    </main>
  )
}
