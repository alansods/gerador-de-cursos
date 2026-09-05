import { ConteudoUnidade } from '@/types/gerador-curso'

export function ListaBlock({ item }: { item: ConteudoUnidade }) {
  return (
    <div className="mb-4">
      {item.itensLista && item.itensLista.length > 0 ? (
        <ul className="space-y-3">
          {item.itensLista.map((listaItem, idx) => (
            <li
              key={listaItem.id || idx}
              className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
            >
              {item.tipoLista === 'check' ? (
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
              ) : item.tipoLista === 'nao-ordenada' ? (
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-(--block-accent,#2563eb)/10 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-(--block-accent,#2563eb)" />
                </span>
              ) : (
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-(--block-accent,#2563eb)/10 text-(--block-accent,#2563eb) font-semibold text-sm tabular-nums shrink-0">
                  {idx + 1}
                </span>
              )}
              <span
                className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: listaItem.texto,
                }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
          Lista vazia
        </div>
      )}
    </div>
  )
}
