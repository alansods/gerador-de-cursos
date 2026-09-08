import { FlipCard } from '@/components/flipcard'
import { cardsFlipcard } from '@/lib/blocos'
import { ConteudoUnidade } from '@/types/gerador-curso'

const COLUNAS_DA_GRADE: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export function FlipCardBlock({ item }: { item: ConteudoUnidade }) {
  const cards = cardsFlipcard(item)

  if (cards.length === 0) {
    return (
      <div className="mb-4 text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
        FlipCard vazio ou incompleto
      </div>
    )
  }

  const colunas = COLUNAS_DA_GRADE[Math.min(cards.length, 4)]

  return (
    <div className={`mb-4 grid gap-4 ${colunas}`}>
      {cards.map((card) => (
        <FlipCard
          key={card.id}
          tipoFrente={card.tipoFrente}
          imagemFrente={card.imagemFrente}
          tituloFrente={card.tituloFrente}
          conteudoVerso={card.conteudoVerso}
          alturaCard={item.alturaCard}
        />
      ))}
    </div>
  )
}
