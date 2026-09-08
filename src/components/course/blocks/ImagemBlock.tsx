import { ConteudoUnidade } from '@/types/gerador-curso'

/**
 * O tamanho escolhido é um teto, não uma largura: `min(..., 100%)` impede que a imagem
 * estoure o bloco quando ele ocupa meia largura, sem esticar imagem menor que o teto.
 */
export function larguraMaximaImagem(tamanho: ConteudoUnidade['tamanho']): string {
  if (tamanho === 'pequena') return 'max-w-[min(20rem,100%)]'
  if (tamanho === 'media') return 'max-w-[min(28rem,100%)]'
  return 'max-w-full'
}

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
          className={`h-auto object-contain rounded-lg mx-auto ${larguraMaximaImagem(item.tamanho)}`}
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
