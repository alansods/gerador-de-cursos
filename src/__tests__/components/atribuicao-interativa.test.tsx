import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssociacaoBlock } from '@/components/course/blocks/AssociacaoBlock'
import { CategorizacaoBlock } from '@/components/course/blocks/CategorizacaoBlock'
import type { ConteudoUnidade } from '@/types/gerador-curso'

const associacao: ConteudoUnidade = {
  id: 'b1',
  ordem: 0,
  tipo: 'associacao',
  conteudo: '',
  paresAssociacao: [
    { id: 'par-1', esquerda: 'NR-6', direita: 'EPI' },
    { id: 'par-2', esquerda: 'NR-5', direita: 'CIPA' },
  ],
}

const categorizacao: ConteudoUnidade = {
  id: 'b2',
  ordem: 0,
  tipo: 'categorizacao',
  conteudo: '',
  categorias: [
    { id: 'cat-1', nome: 'Cabeça', itens: [{ id: 'i1', texto: 'Capacete' }] },
    { id: 'cat-2', nome: 'Membros', itens: [{ id: 'i2', texto: 'Luva' }] },
  ],
}

async function atribuir(usuario: ReturnType<typeof userEvent.setup>, ficha: string, alvo: RegExp) {
  await usuario.click(screen.getByRole('button', { name: ficha }))
  await usuario.click(screen.getByRole('button', { name: alvo }))
}

describe('associação', () => {
  it('permite associar sem arrastar, só com clique e teclado', async () => {
    const usuario = userEvent.setup()
    render(<AssociacaoBlock item={associacao} />)

    await atribuir(usuario, 'EPI', /NR-6/)
    await atribuir(usuario, 'CIPA', /NR-5/)
    await usuario.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(screen.getByText('2 de 2 corretos')).toBeInTheDocument()
  })

  it('só libera a verificação depois de atribuir todas as fichas', async () => {
    const usuario = userEvent.setup()
    render(<AssociacaoBlock item={associacao} />)

    expect(screen.getByRole('button', { name: 'Verificar' })).toBeDisabled()

    await atribuir(usuario, 'EPI', /NR-6/)
    expect(screen.getByRole('button', { name: 'Verificar' })).toBeDisabled()

    await atribuir(usuario, 'CIPA', /NR-5/)
    expect(screen.getByRole('button', { name: 'Verificar' })).toBeEnabled()
  })

  it('conta o erro quando os lados são trocados', async () => {
    const usuario = userEvent.setup()
    render(<AssociacaoBlock item={associacao} />)

    await atribuir(usuario, 'EPI', /NR-5/)
    await atribuir(usuario, 'CIPA', /NR-6/)
    await usuario.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(screen.getByText('0 de 2 corretos')).toBeInTheDocument()
  })

  it('devolve o ocupante ao banco quando o alvo já está preenchido', async () => {
    const usuario = userEvent.setup()
    render(<AssociacaoBlock item={associacao} />)

    await atribuir(usuario, 'EPI', /NR-6/)
    await atribuir(usuario, 'CIPA', /NR-6/)

    expect(screen.getByRole('button', { name: 'Verificar' })).toBeDisabled()
  })
})

describe('categorização', () => {
  it('aceita mais de um item por categoria e apura o resultado', async () => {
    const usuario = userEvent.setup()
    render(<CategorizacaoBlock item={categorizacao} />)

    await atribuir(usuario, 'Capacete', /Cabeça/)
    await atribuir(usuario, 'Luva', /Membros/)
    await usuario.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(screen.getByText('2 de 2 corretos')).toBeInTheDocument()
  })

  it('reabre a atividade ao tentar novamente', async () => {
    const usuario = userEvent.setup()
    render(<CategorizacaoBlock item={categorizacao} />)

    await atribuir(usuario, 'Capacete', /Cabeça/)
    await atribuir(usuario, 'Luva', /Cabeça/)
    await usuario.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(screen.getByText('1 de 2 corretos')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /Tentar novamente/ }))

    expect(screen.getByRole('button', { name: 'Verificar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Capacete' })).toBeEnabled()
  })
})
