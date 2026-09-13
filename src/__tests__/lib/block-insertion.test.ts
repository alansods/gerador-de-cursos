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

describe('position of a newly added block', () => {
  const existentes = ['A', 'B', 'C']

  it('inserts at the top through the divider above the first block', () => {
    expect(insertAtPosition(existentes, 'NOVO', 0)).toEqual(['NOVO', 'A', 'B', 'C'])
  })

  it('inserts between two blocks through the row divider', () => {
    expect(insertAtPosition(existentes, 'NOVO', 2)).toEqual(['A', 'B', 'NOVO', 'C'])
  })

  it('inserts at the end through the "Adicionar conteúdo" button', () => {
    expect(insertAtPosition(existentes, 'NOVO', existentes.length)).toEqual(['A', 'B', 'C', 'NOVO'])
  })

  it('inserts after the last block of the row through the empty slot beside it', () => {
    // Empty slot beside the block at index 1 => target position 2
    expect(insertAtPosition(existentes, 'NOVO', 1 + 1)).toEqual(['A', 'B', 'NOVO', 'C'])
  })

  it('a negative index would send the block to the end — top divider regression', () => {
    // Documents why the top divider must never pass -1: arrayMove reads a negative
    // target as a count from the end.
    expect(insertAtPosition(existentes, 'NOVO', -1)).toEqual(['A', 'B', 'C', 'NOVO'])
  })
})
