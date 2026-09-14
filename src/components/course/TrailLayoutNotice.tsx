import { Info } from 'lucide-react'

interface TrailLayoutNoticeProps {
  selected?: string
  previous?: string
}

export function TrailLayoutNotice({ selected, previous }: TrailLayoutNoticeProps) {
  if (selected !== 'trail' || previous === 'trail') return null

  const switching = previous !== undefined

  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
    >
      <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        {switching
          ? 'No layout Trilha, cada unidade vira uma missão e cada bloco Título abre uma etapa. Nenhum conteúdo é alterado ao trocar: revise os Títulos das unidades depois de salvar.'
          : 'No layout Trilha, cada unidade vira uma missão e cada bloco Título abre uma etapa. Use Títulos para dividir o conteúdo das unidades.'}
      </p>
    </div>
  )
}
