'use client'

import { useId, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CampoComErroProps {
  label: string
  erro?: string
  mostrarErro?: boolean
  contador?: string
  contadorExcedido?: boolean
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby'?: string
  }) => ReactNode
}

export function CampoComErro({
  label,
  erro,
  mostrarErro = false,
  contador,
  contadorExcedido = false,
  children,
}: CampoComErroProps) {
  const id = useId()
  const idErro = `${id}-erro`
  const invalido = mostrarErro && !!erro

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {contador && (
          <span
            className={cn(
              'text-xs tabular-nums',
              contadorExcedido ? 'font-semibold text-destructive' : 'text-muted-foreground'
            )}
          >
            {contador}
          </span>
        )}
      </div>

      {children({
        id,
        'aria-invalid': invalido,
        'aria-describedby': invalido ? idErro : undefined,
      })}

      {invalido && (
        <p id={idErro} role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {erro}
        </p>
      )}
    </div>
  )
}
