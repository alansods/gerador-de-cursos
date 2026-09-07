'use client'

import { useMemo } from 'react'
import { ConteudoUnidade } from '@/types/gerador-curso'
import { AtribuicaoInterativa } from './AtribuicaoInterativa'

export function CategorizacaoBlock({
  item,
  blocoIndex,
}: {
  item: ConteudoUnidade
  blocoIndex?: number
}) {
  const categorias = useMemo(() => item.categorias ?? [], [item.categorias])

  const fichas = useMemo(
    () =>
      categorias.flatMap((categoria) =>
        (categoria.itens ?? []).map((entrada) => ({
          id: entrada.id,
          texto: entrada.texto,
          alvoCorreto: categoria.id,
        }))
      ),
    [categorias]
  )

  const alvos = useMemo(
    () => categorias.map((categoria) => ({ id: categoria.id, rotulo: categoria.nome })),
    [categorias]
  )

  if (fichas.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">
        Categorização vazia
      </div>
    )
  }

  return (
    <AtribuicaoInterativa
      fichas={fichas}
      alvos={alvos}
      capacidadeUnica={false}
      rotuloBanco="Itens para classificar"
      instrucao="Selecione um item e depois a categoria. Também é possível arrastar."
      blocoIndex={blocoIndex}
    />
  )
}
