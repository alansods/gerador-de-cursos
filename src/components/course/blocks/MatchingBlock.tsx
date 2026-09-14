'use client'

import { useMemo } from 'react'
import { Block } from '@/types/course'
import { InteractiveAssignment } from './InteractiveAssignment'

export function MatchingBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const pairs = useMemo(() => item.matchingPairs ?? [], [item.matchingPairs])

  const chips = useMemo(
    () => pairs.map((pair) => ({ id: pair.id, text: pair.right, correctTarget: pair.id })),
    [pairs]
  )

  const targets = useMemo(
    () => pairs.map((pair) => ({ id: pair.id, label: pair.left, image: pair.leftImage })),
    [pairs]
  )

  if (pairs.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">Associação vazia</div>
    )
  }

  return (
    <InteractiveAssignment
      chips={chips}
      targets={targets}
      singleCapacity
      bankLabel="Opções"
      instructions={{
        mouse: 'Arraste cada opção até o item correspondente, ou clique na opção e depois no item.',
        touch:
          'Toque e segure uma opção para arrastá-la até o item correspondente, ou toque na opção e depois no item.',
      }}
      blockIndex={blockIndex}
    />
  )
}
