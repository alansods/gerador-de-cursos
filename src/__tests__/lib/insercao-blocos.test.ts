import { arrayMove } from '@dnd-kit/sortable'

/**
 * Reproduz a reordenação feita em `editar/page.tsx` após adicionar um bloco: o bloco
 * novo entra no fim da lista e é movido para a posição de destino.
 */
function inserirNaPosicao(existentes: string[], novo: string, posicaoDestino: number): string[] {
  const comNovo = [...existentes, novo]

  if (posicaoDestino >= existentes.length) return comNovo

  return arrayMove(comNovo, comNovo.length - 1, posicaoDestino)
}

describe('posição do bloco recém-adicionado', () => {
  const existentes = ['A', 'B', 'C']

  it('insere no topo pelo divisor acima do primeiro bloco', () => {
    expect(inserirNaPosicao(existentes, 'NOVO', 0)).toEqual(['NOVO', 'A', 'B', 'C'])
  })

  it('insere entre dois blocos pelo divisor da linha', () => {
    expect(inserirNaPosicao(existentes, 'NOVO', 2)).toEqual(['A', 'B', 'NOVO', 'C'])
  })

  it('insere no fim pelo botão "Adicionar conteúdo"', () => {
    expect(inserirNaPosicao(existentes, 'NOVO', existentes.length)).toEqual(['A', 'B', 'C', 'NOVO'])
  })

  it('insere após o último bloco da linha pelo slot vazio ao lado dele', () => {
    // Slot vazio ao lado do bloco de índice 1 => posição de destino 2
    expect(inserirNaPosicao(existentes, 'NOVO', 1 + 1)).toEqual(['A', 'B', 'NOVO', 'C'])
  })

  it('índice negativo mandaria o bloco para o fim — regressão do divisor do topo', () => {
    // Documenta por que o divisor superior não pode passar -1: arrayMove trata
    // destino negativo como contagem a partir do fim.
    expect(inserirNaPosicao(existentes, 'NOVO', -1)).toEqual(['A', 'B', 'C', 'NOVO'])
  })
})
