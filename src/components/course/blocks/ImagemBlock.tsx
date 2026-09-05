import { ConteudoUnidade } from '@/types/gerador-curso'

export function ImagemBlock({ item }: { item: ConteudoUnidade }) {
  return (
    <div className="space-y-3">
      {item.fonte && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
          Fonte: {item.fonte}
        </p>
      )}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <img
          src={item.conteudo}
          alt={item.legenda || 'Imagem'}
          className={`h-auto object-contain rounded-lg mx-auto ${
            item.tamanho === 'pequena'
              ? 'max-w-xs'
              : item.tamanho === 'media'
                ? 'max-w-md'
                : 'max-w-full'
          }`}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      {item.legenda && (
        <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-2 text-center">
          {item.legenda}
        </p>
      )}
    </div>
  )
}
