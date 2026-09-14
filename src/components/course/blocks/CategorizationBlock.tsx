'use client'

import { useMemo } from 'react'
import { Block } from '@/types/course'
import { InteractiveAssignment } from './InteractiveAssignment'

export function CategorizationBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const categories = useMemo(() => item.categories ?? [], [item.categories])

  const chips = useMemo(
    () =>
      categories.flatMap((category) =>
        (category.items ?? []).map((input) => ({
          id: input.id,
          text: input.text,
          correctTarget: category.id,
        }))
      ),
    [categories]
  )

  const targets = useMemo(
    () => categories.map((category) => ({ id: category.id, label: category.name })),
    [categories]
  )

  if (chips.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">
        Categorização vazia
      </div>
    )
  }

  return (
    <InteractiveAssignment
      chips={chips}
      targets={targets}
      singleCapacity={false}
      bankLabel="Itens para classificar"
      instructions={{
        mouse: 'Arraste cada item até a categoria, ou clique no item e depois na categoria.',
        touch:
          'Toque e segure um item para arrastá-lo até a categoria, ou toque no item e depois na categoria.',
      }}
      blockIndex={blockIndex}
    />
  )
}
