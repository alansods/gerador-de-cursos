'use client'

import { useId, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FormFieldRenderProps {
  id: string
  'aria-invalid': boolean
  'aria-describedby'?: string
}

interface FormFieldProps {
  label: ReactNode
  opcional?: boolean
  descricao?: ReactNode
  erro?: string
  mostrarErro?: boolean
  contador?: string
  contadorExcedido?: boolean
  compacto?: boolean
  htmlFor?: string
  className?: string
  children: ReactNode | ((props: FormFieldRenderProps) => ReactNode)
}

export function FormField({
  label,
  opcional = false,
  descricao,
  erro,
  mostrarErro = false,
  contador,
  contadorExcedido = false,
  compacto = false,
  htmlFor,
  className,
  children,
}: FormFieldProps) {
  const id = useId()
  const idErro = `${id}-erro`
  const idDescricao = `${id}-descricao`
  const invalido = mostrarErro && !!erro
  const idDoCampo = htmlFor ?? (typeof children === 'function' ? id : undefined)

  const descrito = [descricao ? idDescricao : null, invalido ? idErro : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={idDoCampo}
          className={cn(
            'flex items-center gap-2 font-medium text-foreground',
            compacto ? 'text-xs' : 'text-sm'
          )}
        >
          {label}
          {opcional && <span className="text-xs font-normal text-muted-foreground">opcional</span>}
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

      {descricao && (
        <p id={idDescricao} className="text-xs text-muted-foreground">
          {descricao}
        </p>
      )}

      {typeof children === 'function'
        ? children({
            id,
            'aria-invalid': invalido,
            'aria-describedby': descrito || undefined,
          })
        : children}

      {invalido && (
        <p id={idErro} role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {erro}
        </p>
      )}
    </div>
  )
}
