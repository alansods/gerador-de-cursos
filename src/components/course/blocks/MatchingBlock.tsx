'use client'

import { useMemo } from 'react'
import { Block } from '@/types/course'
import { InteractiveAssignment } from './InteractiveAssignment'

export function MatchingBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const pairs = useMemo(() => item.paresAssociacao ?? [], [item.paresAssociacao])

  const chips = useMemo(
    () => pairs.map((pair) => ({ id: pair.id, text: pair.direita, correctTarget: pair.id })),
    [pairs]
  )

  const targets = useMemo(
    () => pairs.map((pair) => ({ id: pair.id, label: pair.esquerda })),
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
      instruction="Selecione uma opção e depois o item correspondente. Também é possível arrastar."
      blockIndex={blockIndex}
    />
  )
}
