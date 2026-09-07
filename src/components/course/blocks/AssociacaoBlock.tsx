'use client'

import { useMemo } from 'react'
import { ConteudoUnidade } from '@/types/gerador-curso'
import { AtribuicaoInterativa } from './AtribuicaoInterativa'

export function AssociacaoBlock({
  item,
  blocoIndex,
}: {
  item: ConteudoUnidade
  blocoIndex?: number
}) {
  const pares = useMemo(() => item.paresAssociacao ?? [], [item.paresAssociacao])

  const fichas = useMemo(
    () => pares.map((par) => ({ id: par.id, texto: par.direita, alvoCorreto: par.id })),
    [pares]
  )

  const alvos = useMemo(() => pares.map((par) => ({ id: par.id, rotulo: par.esquerda })), [pares])

  if (pares.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">Associação vazia</div>
    )
  }

  return (
    <AtribuicaoInterativa
      fichas={fichas}
      alvos={alvos}
      capacidadeUnica
      rotuloBanco="Opções"
      instrucao="Selecione uma opção e depois o item correspondente. Também é possível arrastar."
      blocoIndex={blocoIndex}
    />
  )
}
