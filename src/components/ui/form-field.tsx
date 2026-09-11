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
  optional?: boolean
  description?: ReactNode
  error?: string
  showError?: boolean
  counter?: string
  counterExceeded?: boolean
  compact?: boolean
  htmlFor?: string
  className?: string
  children: ReactNode | ((props: FormFieldRenderProps) => ReactNode)
}

export function FormField({
  label,
  optional = false,
  description,
  error,
  showError = false,
  counter,
  counterExceeded = false,
  compact = false,
  htmlFor,
  className,
  children,
}: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  const descriptionId = `${id}-descricao`
  const invalid = showError && !!error
  const fieldId = htmlFor ?? (typeof children === 'function' ? id : undefined)

  const described = [description ? descriptionId : null, invalid ? errorId : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={fieldId}
          className={cn(
            'flex items-center gap-2 font-medium text-foreground',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {label}
          {optional && <span className="text-xs font-normal text-muted-foreground">opcional</span>}
        </label>
        {counter && (
          <span
            className={cn(
              'text-xs tabular-nums',
              counterExceeded ? 'font-semibold text-destructive' : 'text-muted-foreground'
            )}
          >
            {counter}
          </span>
        )}
      </div>

      {description && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {typeof children === 'function'
        ? children({
            id,
            'aria-invalid': invalid,
            'aria-describedby': described || undefined,
          })
        : children}

      {invalid && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}
