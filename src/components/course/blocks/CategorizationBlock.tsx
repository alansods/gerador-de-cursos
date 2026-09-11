'use client'

import { useMemo } from 'react'
import { Block } from '@/types/course'
import { InteractiveAssignment } from './InteractiveAssignment'

export function CategorizationBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const categories = useMemo(() => item.categorias ?? [], [item.categorias])

  const chips = useMemo(
    () =>
      categories.flatMap((category) =>
        (category.itens ?? []).map((input) => ({
          id: input.id,
          text: input.texto,
          correctTarget: category.id,
        }))
      ),
    [categories]
  )

  const targets = useMemo(
    () => categories.map((category) => ({ id: category.id, label: category.nome })),
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
      instruction="Selecione um item e depois a categoria. Também é possível arrastar."
      blockIndex={blockIndex}
    />
  )
}
