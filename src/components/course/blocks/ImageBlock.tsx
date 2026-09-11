import { Block } from '@/types/course'

/**
 * O tamanho escolhido é um teto, não uma largura: `min(..., 100%)` impede que a imagem
 * estoure o bloco quando ele ocupa meia largura, sem esticar imagem menor que o teto.
 */
export function maxImageWidth(size: Block['tamanho']): string {
  if (size === 'pequena') return 'max-w-[min(20rem,100%)]'
  if (size === 'media') return 'max-w-[min(28rem,100%)]'
  return 'max-w-full'
}

export function ImageBlock({ item }: { item: Block }) {
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
          className={`h-auto object-contain rounded-lg mx-auto ${maxImageWidth(item.tamanho)}`}
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
