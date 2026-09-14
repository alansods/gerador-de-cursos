'use client'

import { Map as MapIcon, Medal, Moon, Sun, X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import type { TrailLevel, TrailStep } from '@/lib/trail-progress'

interface TrailNavbarProps {
  courseTitle: string
  xp: number
  maxXp: number
  level: TrailLevel
  badgesEarned: number
  badgesTotal: number
  unit?: {
    label: string
    title: string
    steps: TrailStep[]
    currentStep: number
    isStepDone: (index: number) => boolean
    onStep: (index: number) => void
  }
  onHome: () => void
}

export function TrailNavbar({
  courseTitle,
  xp,
  maxXp,
  level,
  badgesEarned,
  badgesTotal,
  unit,
  onHome,
}: TrailNavbarProps) {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const nextLabel =
    level.nextAt === null ? 'nível máximo' : `faltam ${Math.max(level.nextAt - xp, 0)} XP`
  const xpPercent = maxXp > 0 ? Math.min(100, Math.round((xp / maxXp) * 100)) : 0

  const themeButton = (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={isDarkMode ? 'Usar tema claro' : 'Usar tema escuro'}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-(--trail-edge) bg-(--trail-paper) text-(--trail-ink) focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--trail-orange)"
    >
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )

  return (
    <header className="sticky top-0 z-30 border-b-[2.5px] border-(--trail-edge) bg-(--trail-paper)">
      <div className="mx-auto flex min-h-[72px] max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        {unit ? (
          <>
            <button
              type="button"
              onClick={onHome}
              aria-label="Voltar ao mapa da trilha"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-[2.5px] border-(--trail-edge) bg-(--trail-paper) text-(--trail-ink) shadow-[0_3px_0_var(--trail-edge)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--trail-orange)"
            >
              <X className="h-5 w-5" strokeWidth={2.8} />
            </button>
            <div className="hidden min-w-0 flex-col sm:flex sm:w-48">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-(--trail-orange-deep)">
                {unit.label}
              </span>
              <span className="trail-display truncate text-base font-extrabold">{unit.title}</span>
            </div>
            <nav
              aria-label="Etapas da missão"
              className="grid min-w-0 flex-1 gap-1.5"
              style={{ gridTemplateColumns: `repeat(${unit.steps.length}, minmax(0, 1fr))` }}
            >
              {unit.steps.map((step, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => unit.onStep(index)}
                  aria-label={`Etapa ${index + 1}: ${step.title}`}
                  aria-current={index === unit.currentStep ? 'step' : undefined}
                  className={cn(
                    'h-4 rounded-full border-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--trail-orange)',
                    unit.isStepDone(index)
                      ? 'border-(--trail-edge) bg-(--trail-teal)'
                      : index === unit.currentStep
                        ? 'border-(--trail-edge) bg-(--trail-orange)'
                        : 'border-(--trail-line-strong) bg-(--trail-track)'
                  )}
                />
              ))}
            </nav>
            <span className="trail-display flex h-11 shrink-0 items-center gap-1.5 rounded-full border-[2.5px] border-(--trail-edge) bg-(--trail-gold-soft) px-3 text-sm font-extrabold tabular-nums">
              <Zap aria-hidden className="h-4 w-4 fill-(--trail-gold) stroke-(--trail-edge)" />
              {xp}
              <span className="sr-only">XP</span>
            </span>
            {themeButton}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onHome}
              className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--trail-orange)"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-[2.5px] border-(--trail-edge) bg-(--trail-orange-fill) text-(--trail-on-accent) shadow-[0_3px_0_var(--trail-edge)]">
                <MapIcon aria-hidden className="h-5 w-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="hidden text-[11px] font-extrabold uppercase tracking-[0.12em] text-(--trail-muted) sm:block">
                  Trilha do curso
                </span>
                <span className="trail-display truncate text-base font-extrabold sm:text-lg">
                  {courseTitle}
                </span>
              </span>
            </button>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <span
                className="trail-display flex h-10 items-center gap-2 rounded-full bg-(--trail-edge) py-1 pr-3 pl-1 text-sm font-bold text-white"
                title={`Nível ${level.number}: ${level.name}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--trail-gold) font-extrabold text-(--trail-edge)">
                  {level.number}
                </span>
                <span className="hidden sm:inline">{level.name}</span>
              </span>
              <div className="hidden w-52 flex-col gap-1 md:flex">
                <span className="flex justify-between text-xs font-bold text-(--trail-muted) tabular-nums">
                  <span>{xp} XP</span>
                  <span>{nextLabel}</span>
                </span>
                <span
                  role="progressbar"
                  aria-label="XP acumulado na trilha"
                  aria-valuemin={0}
                  aria-valuemax={maxXp}
                  aria-valuenow={xp}
                  className="block h-3.5 overflow-hidden rounded-full border-2 border-(--trail-edge) bg-(--trail-track)"
                >
                  <span
                    className="block h-full bg-(--trail-gold) transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${xpPercent}%` }}
                  />
                </span>
              </div>
              <span className="trail-display flex h-10 items-center gap-1.5 rounded-full border-2 border-(--trail-edge) bg-(--trail-paper) px-3 text-sm font-extrabold tabular-nums">
                <Medal aria-hidden className="h-4 w-4 text-(--trail-gold-deep)" />
                {badgesEarned}/{badgesTotal}
                <span className="sr-only">medalhas</span>
              </span>
              {themeButton}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
