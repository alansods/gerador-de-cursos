import { arrayMove } from '@dnd-kit/sortable'

/**
 * Reproduz a reordenação feita em `editar/page.tsx` após adicionar um bloco: o bloco
 * novo entra no fim da lista e é movido para a posição de destino.
 */
function insertAtPosition(
  existentes: string[],
  newValue: string,
  targetPosition: number
): string[] {
  const withNew = [...existentes, newValue]

  if (targetPosition >= existentes.length) return withNew

  return arrayMove(withNew, withNew.length - 1, targetPosition)
}

describe('posição do bloco recém-adicionado', () => {
  const existentes = ['A', 'B', 'C']

  it('insere no topo pelo divisor acima do primeiro bloco', () => {
    expect(insertAtPosition(existentes, 'NOVO', 0)).toEqual(['NOVO', 'A', 'B', 'C'])
  })

  it('insere entre dois blocos pelo divisor da linha', () => {
    expect(insertAtPosition(existentes, 'NOVO', 2)).toEqual(['A', 'B', 'NOVO', 'C'])
  })

  it('insere no fim pelo botão "Adicionar conteúdo"', () => {
    expect(insertAtPosition(existentes, 'NOVO', existentes.length)).toEqual(['A', 'B', 'C', 'NOVO'])
  })

  it('insere após o último bloco da linha pelo slot vazio ao lado dele', () => {
    // Slot vazio ao lado do bloco de índice 1 => posição de destino 2
    expect(insertAtPosition(existentes, 'NOVO', 1 + 1)).toEqual(['A', 'B', 'NOVO', 'C'])
  })

  it('índice negativo mandaria o bloco para o fim — regressão do divisor do topo', () => {
    // Documenta por que o divisor superior não pode passar -1: arrayMove trata
    // destino negativo como contagem a partir do fim.
    expect(insertAtPosition(existentes, 'NOVO', -1)).toEqual(['A', 'B', 'C', 'NOVO'])
  })
})
