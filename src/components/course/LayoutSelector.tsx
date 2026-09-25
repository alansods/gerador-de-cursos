'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { blocksOutsideLayout, type LayoutUnits } from '@/lib/layout-blocks'
import { layoutRegistry } from './layouts'
import { LayoutThumbnail } from './new/LayoutThumbnail'

interface LayoutSelectorProps {
  value: string
  onChange: (layoutId: string) => void
  units?: LayoutUnits
  className?: string
}

export function LayoutSelector({ value, onChange, units, className }: LayoutSelectorProps) {
  const layouts = Object.values(layoutRegistry)

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
      {layouts.map(({ meta }) => {
        const isSelected = value === meta.id
        const outside = isSelected ? 0 : blocksOutsideLayout(units, meta.id)
        const disabled = outside > 0
        return (
          <button
            key={meta.id}
            type="button"
            onClick={() => onChange(meta.id)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-start text-left p-4 rounded-xl border-2 transition-all',
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700',
              disabled &&
                'cursor-not-allowed opacity-60 hover:border-gray-200 dark:hover:border-gray-700'
            )}
          >
            {isSelected && (
              <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white">
                <Check className="w-3 h-3" />
              </span>
            )}
            <LayoutThumbnail layoutId={meta.id} className="w-full h-20 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {meta.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{meta.description}</p>
            {disabled && (
              <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                {`Este layout aceita apenas aulas em vídeo; o curso tem ${outside} ${
                  outside === 1 ? 'bloco' : 'blocos'
                } de outros tipos.`}
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}
