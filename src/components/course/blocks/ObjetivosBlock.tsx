import { Target } from 'lucide-react'
import { ConteudoUnidade } from '@/types/gerador-curso'

export function ObjetivosBlock({ item }: { item: ConteudoUnidade }) {
  return (
    <div className="mb-4 w-full">
      {item.itensObjetivos && item.itensObjetivos.length > 0 ? (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 rounded-2xl border border-(--block-accent,#2563eb)/25 bg-(--block-accent,#2563eb)/8 dark:bg-(--block-accent,#2563eb)/15 p-4 sm:p-8">
          <div className="shrink-0 flex items-center justify-center w-11 h-11 sm:w-16 sm:h-16 rounded-full border-2 border-(--block-accent,#2563eb)">
            <Target className="w-5 h-5 sm:w-7 sm:h-7 text-(--block-accent,#2563eb)" />
          </div>
          <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-w-0 w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 text-center sm:text-left">
              Objetivos de aprendizagem
            </h2>
            {item.itensObjetivos.map((objetivo, idx) => (
              <div key={objetivo.id || idx} className="flex items-baseline gap-2 sm:gap-3">
                <span className="text-(--block-accent,#2563eb) font-semibold text-sm tabular-nums shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span
                  className="text-gray-800 dark:text-gray-200 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: objetivo.texto,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
          Objetivos de aprendizagem vazios
        </div>
      )}
    </div>
  )
}
