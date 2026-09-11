'use client'

import { forwardRef, type KeyboardEvent, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChoiceCardProps {
  title: string
  description: string
  selected: boolean
  illustration: ReactNode
  items?: string[]
  onSelect: () => void
  tabIndex?: number
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void
}

export const ChoiceCard = forwardRef<HTMLButtonElement, ChoiceCardProps>(function CardEscolha(
  { title, description, selected, illustration, items, onSelect, tabIndex, onKeyDown },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onClick={onSelect}
      className={cn(
        'relative flex flex-col gap-4 rounded-xl border-2 p-5 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'hover:-translate-y-0.5',
        selected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border bg-card hover:border-primary/40'
      )}
    >
      {selected && (
        <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" aria-hidden />
        </span>
      )}

      {illustration}

      <span className="block">
        <span className="block text-base font-semibold text-foreground">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>

      {items && items.length > 0 && (
        <span className="flex flex-col gap-1.5">
          {items.map((item) => (
            <span key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3 w-3 shrink-0 text-primary" aria-hidden />
              {item}
            </span>
          ))}
        </span>
      )}
    </button>
  )
})
