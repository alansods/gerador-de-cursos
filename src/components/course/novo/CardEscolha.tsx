'use client'

import { forwardRef, type KeyboardEvent, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CardEscolhaProps {
  titulo: string
  descricao: string
  selecionado: boolean
  ilustracao: ReactNode
  itens?: string[]
  onSelecionar: () => void
  tabIndex?: number
  onKeyDown?: (evento: KeyboardEvent<HTMLButtonElement>) => void
}

export const CardEscolha = forwardRef<HTMLButtonElement, CardEscolhaProps>(function CardEscolha(
  { titulo, descricao, selecionado, ilustracao, itens, onSelecionar, tabIndex, onKeyDown },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selecionado}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onClick={onSelecionar}
      className={cn(
        'relative flex flex-col gap-4 rounded-xl border-2 p-5 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'hover:-translate-y-0.5',
        selecionado
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border bg-card hover:border-primary/40'
      )}
    >
      {selecionado && (
        <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" aria-hidden />
        </span>
      )}

      {ilustracao}

      <span className="block">
        <span className="block text-base font-semibold text-foreground">{titulo}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {descricao}
        </span>
      </span>

      {itens && itens.length > 0 && (
        <span className="flex flex-col gap-1.5">
          {itens.map((item) => (
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
