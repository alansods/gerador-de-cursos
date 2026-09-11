'use client'

import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BLOCK_CATALOG, type GenerationSummary, type BlockType } from '@/lib/blocks'

interface CourseCreatedProps {
  title: string
  summary: GenerationSummary | null
  onOpenEditor: () => void
  onCreateAnother: () => void
}

export function CourseCreated({
  title,
  summary,
  onOpenEditor,
  onCreateAnother,
}: CourseCreatedProps) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" aria-hidden />
      </span>

      <h3 className="mt-5 text-2xl font-bold text-foreground">Curso criado</h3>

      <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">{title}</span> já está disponível na sua
        lista de cursos.
      </p>

      {summary && summary.blocks > 0 && (
        <p className="mt-3 max-w-md text-sm text-muted-foreground">{describeSummary(summary)}</p>
      )}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={onOpenEditor}>
          Abrir no editor
        </Button>
        <Button type="button" variant="outline" onClick={onCreateAnother}>
          Criar outro curso
        </Button>
      </div>
    </div>
  )
}

function describeSummary(summary: GenerationSummary): string {
  const units = `${summary.units} ${summary.units === 1 ? 'unidade' : 'unidades'}`
  const blocks = `${summary.blocks} ${summary.blocks === 1 ? 'bloco' : 'blocos'}`

  const highlights = (Object.keys(summary.byType) as BlockType[])
    .filter((type) => BLOCK_CATALOG[type]?.marker)
    .sort((a, b) => (summary.byType[b] ?? 0) - (summary.byType[a] ?? 0))
    .slice(0, 3)
    .map((type) => {
      const count = summary.byType[type] ?? 0
      const meta = BLOCK_CATALOG[type]
      return `${count} ${count === 1 ? meta.label.toLowerCase() : meta.pluralLabel}`
    })

  return highlights.length > 0
    ? `${units} · ${blocks} · ${highlights.join(', ')}`
    : `${units} · ${blocks}`
}
