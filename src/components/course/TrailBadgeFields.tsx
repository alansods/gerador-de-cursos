'use client'

import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { BADGE_ICONS, unitBadge } from '@/lib/trail-progress'
import {
  BADGE_ICON_COMPONENTS,
  BADGE_ICON_LABELS,
} from '@/components/course/layouts/trail/badge-icons'

export const BADGE_NAME_MAX_LENGTH = 40

interface TrailBadgeFieldsProps {
  layout?: string
  unitIndex: number
  name: string
  icon: string
  onNameChange: (name: string) => void
  onIconChange: (icon: string) => void
}

export function TrailBadgeFields({
  layout,
  unitIndex,
  name,
  icon,
  onNameChange,
  onIconChange,
}: TrailBadgeFieldsProps) {
  if (layout !== 'trail') return null

  const fallback = unitBadge(
    { id: '', title: '', description: '', blocks: [], order: 0 },
    unitIndex
  )
  const FallbackIcon = BADGE_ICON_COMPONENTS[fallback.icon]

  const optionClass = (selected: boolean) =>
    cn(
      'flex h-11 w-11 items-center justify-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
      selected
        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
        : 'border-gray-200 text-gray-600 hover:border-blue-300 dark:border-gray-700 dark:text-gray-300'
    )

  return (
    <fieldset className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
        Medalha da missão (layout Trilha)
      </legend>

      <FormField
        label="Nome da medalha"
        optional
        description="Aparece quando o aluno conclui a missão. Vazio usa o nome padrão."
        counter={`${name.length}/${BADGE_NAME_MAX_LENGTH}`}
      >
        {(field) => (
          <Input
            {...field}
            value={name}
            maxLength={BADGE_NAME_MAX_LENGTH}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={fallback.name}
          />
        )}
      </FormField>

      <div className="space-y-2">
        <p id="badge-icon-label" className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Ícone da medalha
        </p>
        <div role="group" aria-labelledby="badge-icon-label" className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={icon === ''}
            aria-label={`Padrão (${BADGE_ICON_LABELS[fallback.icon]})`}
            title="Padrão"
            onClick={() => onIconChange('')}
            className={cn(optionClass(icon === ''), 'w-auto gap-1.5 px-3 text-xs font-medium')}
          >
            <FallbackIcon aria-hidden className="h-4 w-4" />
            Padrão
          </button>
          {BADGE_ICONS.map((option) => {
            const Icon = BADGE_ICON_COMPONENTS[option]
            return (
              <button
                key={option}
                type="button"
                aria-pressed={icon === option}
                aria-label={BADGE_ICON_LABELS[option]}
                title={BADGE_ICON_LABELS[option]}
                onClick={() => onIconChange(option)}
                className={optionClass(icon === option)}
              >
                <Icon aria-hidden className="h-5 w-5" />
              </button>
            )
          })}
        </div>
      </div>
    </fieldset>
  )
}
