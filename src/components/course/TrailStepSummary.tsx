import { AlertTriangle, Footprints } from 'lucide-react'
import type { Unit } from '@/types/course'
import { MAX_RECOMMENDED_STEPS, reviewTrailSteps } from '@/lib/trail-progress'

interface TrailStepSummaryProps {
  layout?: string
  unit: Unit
}

export function TrailStepSummary({ layout, unit }: TrailStepSummaryProps) {
  if (layout !== 'trail') return null

  const { stepCount, stepsWithoutScored, tooManySteps } = reviewTrailSteps(unit)
  const warnings: string[] = []

  if (stepsWithoutScored.length > 0) {
    const titles = stepsWithoutScored.map((step) => `“${step.title}”`).join(', ')
    warnings.push(
      stepsWithoutScored.length === 1
        ? `A etapa ${titles} não tem atividade avaliada.`
        : `As etapas ${titles} não têm atividade avaliada.`
    )
  }
  if (tooManySteps) {
    warnings.push(
      `Mais de ${MAX_RECOMMENDED_STEPS} etapas: considere dividir esta unidade em duas missões.`
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <Footprints aria-hidden className="h-3.5 w-3.5" />
        {stepCount} {stepCount === 1 ? 'etapa' : 'etapas'} no layout Trilha
      </span>
      {warnings.length > 0 && (
        <ul className="flex flex-col gap-1" aria-label="Avisos das etapas">
          {warnings.map((warning) => (
            <li
              key={warning}
              className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300"
            >
              <AlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {warning}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
