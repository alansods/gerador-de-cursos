import { FlipCard } from '@/components/flipcard'
import { cardsFlipcard } from '@/lib/blocks'
import { Block } from '@/types/course'

const GRID_COLUMNS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export function FlipCardBlock({ item }: { item: Block }) {
  const cards = cardsFlipcard(item)

  if (cards.length === 0) {
    return (
      <div className="mb-4 text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
        FlipCard vazio ou incompleto
      </div>
    )
  }

  const columns = GRID_COLUMNS[Math.min(cards.length, 4)]

  return (
    <div className={`mb-4 grid gap-4 ${columns}`}>
      {cards.map((card, index) => (
        <FlipCard
          key={card.id}
          index={index + 1}
          frontType={card.tipoFrente}
          frontImage={card.imagemFrente}
          frontTitle={card.tituloFrente}
          backContent={card.conteudoVerso}
          cardHeight={item.alturaCard}
        />
      ))}
    </div>
  )
}
