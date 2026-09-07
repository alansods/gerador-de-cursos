import { ConteudoUnidade } from '@/types/gerador-curso'

export function LinhaDoTempoBlock({ item }: { item: ConteudoUnidade }) {
  const itens = item.itensTimeline ?? []

  if (itens.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">
        Linha do tempo vazia
      </div>
    )
  }

  if (item.orientacaoTimeline === 'horizontal') {
    return (
      <div className="mb-4 overflow-x-auto">
        <ol className="flex gap-6 pb-2">
          {itens.map((evento, idx) => (
            <li key={evento.id || idx} className="w-64 shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full bg-(--block-accent,#2563eb)" />
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-(--block-accent,#2563eb)">
                {evento.data}
              </p>
              <h4 className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                {evento.titulo}
              </h4>
              <div
                className="mt-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: evento.descricao }}
              />
            </li>
          ))}
        </ol>
      </div>
    )
  }

  return (
    <ol className="mb-4 relative border-l border-gray-200 dark:border-gray-700 ml-1.5">
      {itens.map((evento, idx) => (
        <li key={evento.id || idx} className="ml-6 pb-8 last:pb-0">
          <span className="absolute -left-1.5 flex h-3 w-3 rounded-full bg-(--block-accent,#2563eb)" />
          <p className="text-xs font-semibold uppercase tracking-wider text-(--block-accent,#2563eb)">
            {evento.data}
          </p>
          <h4 className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{evento.titulo}</h4>
          <div
            className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: evento.descricao }}
          />
        </li>
      ))}
    </ol>
  )
}
