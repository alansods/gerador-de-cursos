'use client'

import { Fragment } from 'react'
import { layoutRegistry } from '@/components/course/layouts'
import type { MarkerDetection } from '@/lib/markers'
import type { ManualCourseData } from '@/lib/course-validation'
import type { CreationMethod } from './useNewCourseWizard'

interface StepReviewProps {
  method: CreationMethod | null
  data: ManualCourseData
  layout: string
  file: File | null
  markers: MarkerDetection | null
  onEdit: (step: number) => void
}

interface SummaryRow {
  label: string
  value: string
  detail?: string
  step: number
}

export function StepReview({ method, data, layout, file, markers, onEdit }: StepReviewProps) {
  const isAi = method === 'ia'
  const meta = layoutRegistry[layout]?.meta

  const lines: SummaryRow[] = [
    {
      label: 'Método',
      value: isAi ? 'Gerar por IA' : 'Criação manual',
      detail: isAi
        ? markers?.found
          ? 'Estrutura definida pelos marcadores do documento'
          : 'Estrutura definida pela IA a partir do conteúdo'
        : 'Campos preenchidos manualmente',
      step: 1,
    },
    isAi
      ? {
          label: 'Documento',
          value: file?.name ?? '—',
          detail: file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : undefined,
          step: 2,
        }
      : {
          label: 'Curso',
          value: data.titulo || '—',
          detail: [data.categoria, `${data.cargaHoraria} horas`, data.modalidade]
            .filter(Boolean)
            .join(' · '),
          step: 2,
        },
    {
      label: 'Layout',
      value: meta?.name ?? layout,
      detail: meta?.description,
      step: 3,
    },
  ]

  if (!isAi) {
    lines.push({ label: 'Descrição', value: data.descricao || '—', step: 2 })
  }

  return (
    <div className="max-w-3xl overflow-hidden rounded-xl border border-border">
      {lines.map((line, index) => (
        <Fragment key={line.label}>
          <div
            className={`flex items-start gap-5 bg-card p-4 ${index > 0 ? 'border-t border-border' : ''}`}
          >
            <span className="w-28 shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {line.label}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium leading-relaxed text-foreground">
                {line.value}
              </span>
              {line.detail && (
                <span className="mt-0.5 block text-sm text-muted-foreground">{line.detail}</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => onEdit(line.step)}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Editar
            </button>
          </div>
        </Fragment>
      ))}
    </div>
  )
}
