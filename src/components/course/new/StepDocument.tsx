'use client'

import { useRef } from 'react'
import { AlertCircle, Download, FileText, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMegabytes } from '@/lib/course-validation'
import { cn } from '@/lib/utils'

interface StepDocumentProps {
  file: File | null
  extracting: boolean
  error: string
  warning: string
  showError: boolean
  onSelect: (file: File | null) => void
  onRemove: () => void
  onDownloadSample: () => void
}

export function StepDocument({
  file,
  extracting,
  error,
  warning,
  showError,
  onSelect,
  onRemove,
  onDownloadSample,
}: StepDocumentProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const invalid = showError && !file

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <input
        ref={inputRef}
        type="file"
        accept=".docx,.doc"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />

      {!file ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              invalid || error
                ? 'border-destructive bg-destructive/5'
                : 'border-border bg-muted/40 hover:border-primary/50'
            )}
          >
            <span
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl',
                invalid || error
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-primary/10 text-primary'
              )}
            >
              <Upload className="h-6 w-6" aria-hidden />
            </span>
            <span className="text-base font-semibold text-foreground">
              Arraste o documento ou clique para selecionar
            </span>
            <span className="text-sm text-muted-foreground">
              Word (.docx ou .doc) &middot; até 10 MB
            </span>
          </button>

          {(error || invalid) && (
            <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {error || 'Envie um documento .docx ou .doc de até 10 MB'}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <Download className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="flex-1 text-sm text-foreground/80">
              Não sabe como estruturar o documento? Baixe um exemplo para usar como base.
            </span>
            <button
              type="button"
              onClick={onDownloadSample}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Baixar Exemplo
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-card text-primary">
              <FileText className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {file.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {formatMegabytes(file.size)}
                {extracting ? ' · lendo o documento…' : ' · pronto para gerar'}
              </span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemove}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Trocar
            </Button>
          </div>

          {warning && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {warning}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
