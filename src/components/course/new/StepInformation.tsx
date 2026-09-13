'use client'

import { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { COURSE_CATEGORIES, COURSE_MODALITIES, VALIDATION_RULES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ManualCourseField, ManualCourseData } from '@/lib/course-validation'
import { FormField } from '@/components/ui/form-field'
import { useRadioGroup } from './useRadioGroup'

const DESCRIPTION_LIMIT = VALIDATION_RULES.NEW_COURSE.DESCRIPTION_MAX

interface StepInformationProps {
  data: ManualCourseData
  errors: Partial<Record<ManualCourseField, string>>
  showError: (field: ManualCourseField) => boolean
  onChange: (field: ManualCourseField, value: string) => void
  onBlur: (field: ManualCourseField) => void
  submitted?: boolean
}

export function StepInformation({
  data,
  errors,
  showError,
  onChange,
  onBlur,
  submitted = false,
}: StepInformationProps) {
  const caracteres = data.description.trim().length
  const container = useRef<HTMLDivElement>(null)

  const categories = useRadioGroup(COURSE_CATEGORIES, data.category || null, (category) =>
    onChange('category', category)
  )
  const modalities = useRadioGroup(COURSE_MODALITIES, data.modality || null, (modality) =>
    onChange('modality', modality)
  )

  useEffect(() => {
    if (!submitted) return
    focusFirstInvalid(container.current)
  }, [submitted])

  return (
    <div ref={container} className="flex max-w-3xl flex-col gap-6">
      <FormField label="Título do curso" error={errors.title} showError={showError('title')}>
        {(props) => (
          <Input
            {...props}
            value={data.title}
            maxLength={VALIDATION_RULES.NEW_COURSE.TITLE_MAX}
            onChange={(e) => onChange('title', e.target.value)}
            onBlur={() => onBlur('title')}
            placeholder="Ex.: Fundamentos de Automação Industrial"
            className={cn('h-11', showError('title') && 'border-destructive')}
          />
        )}
      </FormField>

      <FormField label="Categoria" error={errors.category} showError={showError('category')}>
        {(props) => (
          <div
            id={props.id}
            role="radiogroup"
            aria-label="Categoria"
            aria-invalid={props['aria-invalid']}
            aria-describedby={props['aria-describedby']}
            className="flex flex-wrap gap-2"
          >
            {COURSE_CATEGORIES.map((category, index) => {
              const selected = data.category === category
              return (
                <button
                  key={category}
                  ref={categories.register(index)}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={categories.tabIndex(index)}
                  onKeyDown={(event) => categories.onKeyDown(event, index)}
                  onClick={() => onChange('category', category)}
                  className={cn(
                    'h-9 rounded-full border px-4 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {category}
                </button>
              )
            })}
          </div>
        )}
      </FormField>

      <FormField
        label="Descrição"
        error={errors.description}
        showError={showError('description')}
        counter={`${caracteres} / ${DESCRIPTION_LIMIT}`}
        counterExceeded={caracteres > DESCRIPTION_LIMIT}
      >
        {(props) => (
          <Textarea
            {...props}
            rows={4}
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            onBlur={() => onBlur('description')}
            placeholder="O que o aluno será capaz de fazer ao concluir este curso?"
            className={cn(showError('description') && 'border-destructive')}
          />
        )}
      </FormField>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Carga horária" error={errors.workload} showError={showError('workload')}>
          {(props) => (
            <div className="relative">
              <Input
                {...props}
                inputMode="numeric"
                maxLength={4}
                value={data.workload}
                onChange={(e) => onChange('workload', e.target.value)}
                onBlur={() => onBlur('workload')}
                placeholder="40"
                className={cn('pr-16', showError('workload') && 'border-destructive')}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                horas
              </span>
            </div>
          )}
        </FormField>

        <FormField label="Modalidade" error={errors.modality} showError={showError('modality')}>
          {(props) => (
            <div
              id={props.id}
              role="radiogroup"
              aria-label="Modalidade"
              className="flex gap-1 rounded-lg bg-muted p-1"
            >
              {COURSE_MODALITIES.map((modality, index) => {
                const selected = data.modality === modality
                return (
                  <button
                    key={modality}
                    ref={modalities.register(index)}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={modalities.tabIndex(index)}
                    onKeyDown={(event) => modalities.onKeyDown(event, index)}
                    onClick={() => onChange('modality', modality)}
                    className={cn(
                      'h-8 flex-1 rounded-md text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {modality}
                  </button>
                )
              })}
            </div>
          )}
        </FormField>
      </div>
    </div>
  )
}

function focusFirstInvalid(container: HTMLDivElement | null) {
  if (!container) return

  const invalid = container.querySelector<HTMLElement>('[aria-invalid="true"]')
  if (!invalid) return

  const focusable = invalid.matches('input, textarea, select, button')
    ? invalid
    : invalid.querySelector<HTMLElement>('button, input, textarea, select')

  focusable?.focus()
}
