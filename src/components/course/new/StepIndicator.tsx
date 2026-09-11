'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TOTAL_STEPS } from './useNewCourseWizard'

export interface WizardStep {
  numero: number
  label: string
  description: string
}

interface StepIndicatorProps {
  steps: WizardStep[]
  currentStep: number
  completedCount?: boolean
  onSelect: (step: number) => void
}

export function StepIndicator({
  steps,
  currentStep,
  completedCount = false,
  onSelect,
}: StepIndicatorProps) {
  const activeStep = steps.find((step) => step.numero === currentStep)

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-foreground">{activeStep?.label}</span>
          <span className="text-xs text-muted-foreground">
            Etapa {currentStep} de {TOTAL_STEPS}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <ol className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const completed = completedCount || step.numero < currentStep
          const active = !completedCount && step.numero === currentStep
          const accessible = completed && !completedCount

          return (
            <li
              key={step.numero}
              className={cn('flex items-center', index < steps.length - 1 && 'min-w-0 flex-1')}
            >
              <button
                type="button"
                onClick={() => accessible && onSelect(step.numero)}
                disabled={!accessible}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-md text-left',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  accessible ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors',
                    active && 'bg-highlight text-highlight-foreground ring-4 ring-highlight/20',
                    completed && 'bg-primary text-primary-foreground',
                    !active && !completed && 'border border-border bg-card text-muted-foreground'
                  )}
                >
                  {completed ? <Check className="h-4 w-4" aria-hidden /> : step.numero}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block whitespace-nowrap text-sm font-semibold transition-colors',
                      active ? 'text-foreground' : 'text-muted-foreground',
                      accessible && 'group-hover:text-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="block whitespace-nowrap text-xs text-muted-foreground/70">
                    {step.description}
                  </span>
                </span>
              </button>

              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'mx-4 h-0.5 min-w-6 flex-1 rounded-full',
                    completed ? 'bg-primary/40' : 'bg-border'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
