'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TOTAL_ETAPAS } from './useNovoCursoWizard'

export interface EtapaWizard {
  numero: number
  rotulo: string
  descricao: string
}

interface StepIndicatorProps {
  etapas: EtapaWizard[]
  etapaAtual: number
  concluidoTotal?: boolean
  onSelecionar: (etapa: number) => void
}

export function StepIndicator({
  etapas,
  etapaAtual,
  concluidoTotal = false,
  onSelecionar,
}: StepIndicatorProps) {
  const etapaCorrente = etapas.find((etapa) => etapa.numero === etapaAtual)

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-foreground">{etapaCorrente?.rotulo}</span>
          <span className="text-xs text-muted-foreground">
            Etapa {etapaAtual} de {TOTAL_ETAPAS}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(etapaAtual / TOTAL_ETAPAS) * 100}%` }}
          />
        </div>
      </div>

      <ol className="hidden items-center sm:flex">
        {etapas.map((etapa, indice) => {
          const concluida = concluidoTotal || etapa.numero < etapaAtual
          const ativa = !concluidoTotal && etapa.numero === etapaAtual
          const acessivel = concluida && !concluidoTotal

          return (
            <li
              key={etapa.numero}
              className={cn('flex items-center', indice < etapas.length - 1 && 'min-w-0 flex-1')}
            >
              <button
                type="button"
                onClick={() => acessivel && onSelecionar(etapa.numero)}
                disabled={!acessivel}
                aria-current={ativa ? 'step' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-md text-left',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  acessivel ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors',
                    ativa && 'bg-highlight text-highlight-foreground ring-4 ring-highlight/20',
                    concluida && 'bg-primary text-primary-foreground',
                    !ativa && !concluida && 'border border-border bg-card text-muted-foreground'
                  )}
                >
                  {concluida ? <Check className="h-4 w-4" aria-hidden /> : etapa.numero}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block whitespace-nowrap text-sm font-semibold transition-colors',
                      ativa ? 'text-foreground' : 'text-muted-foreground',
                      acessivel && 'group-hover:text-foreground'
                    )}
                  >
                    {etapa.rotulo}
                  </span>
                  <span className="block whitespace-nowrap text-xs text-muted-foreground/70">
                    {etapa.descricao}
                  </span>
                </span>
              </button>

              {indice < etapas.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'mx-4 h-0.5 min-w-6 flex-1 rounded-full',
                    concluida ? 'bg-primary/40' : 'bg-border'
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
