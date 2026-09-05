import { FlipCard } from '@/components/flipcard'
import { ConteudoUnidade } from '@/types/gerador-curso'

export function FlipCardBlock({ item }: { item: ConteudoUnidade }) {
  return (
    <div className="mb-4">
      {item.tipoFrente && item.conteudoVerso ? (
        <FlipCard
          tipoFrente={item.tipoFrente}
          imagemFrente={item.imagemFrente}
          tituloFrente={item.tituloFrente}
          conteudoVerso={item.conteudoVerso}
          alturaCard={item.alturaCard}
        />
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
          FlipCard vazio ou incompleto
        </div>
      )}
    </div>
  )
}
