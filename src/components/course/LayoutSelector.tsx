'use client'

import { Check, LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'
import { layoutRegistry } from './layouts'

interface LayoutSelectorProps {
  value: string
  onChange: (layoutId: string) => void
  className?: string
}

export function LayoutSelector({ value, onChange, className }: LayoutSelectorProps) {
  const layouts = Object.values(layoutRegistry)

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>
      {layouts.map(({ meta }) => {
        const isSelected = value === meta.id
        return (
          <button
            key={meta.id}
            type="button"
            onClick={() => onChange(meta.id)}
            className={cn(
              'relative flex flex-col items-start text-left p-4 rounded-xl border-2 transition-all',
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
            )}
          >
            {isSelected && (
              <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white">
                <Check className="w-3 h-3" />
              </span>
            )}
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
              <LayoutTemplate className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {meta.nome}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{meta.descricao}</p>
          </button>
        )
      })}
    </div>
  )
}
