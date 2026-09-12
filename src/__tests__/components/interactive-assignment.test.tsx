import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatchingBlock } from '@/components/course/blocks/MatchingBlock'
import { CategorizationBlock } from '@/components/course/blocks/CategorizationBlock'
import type { Block } from '@/types/course'

const matching: Block = {
  id: 'b1',
  order: 0,
  type: 'matching',
  content: '',
  matchingPairs: [
    { id: 'par-1', left: 'NR-6', right: 'EPI' },
    { id: 'par-2', left: 'NR-5', right: 'CIPA' },
  ],
}

const categorization: Block = {
  id: 'b2',
  order: 0,
  type: 'categorization',
  content: '',
  categories: [
    { id: 'cat-1', name: 'Cabeça', items: [{ id: 'i1', text: 'Capacete' }] },
    { id: 'cat-2', name: 'Membros', items: [{ id: 'i2', text: 'Luva' }] },
  ],
}

async function assign(user: ReturnType<typeof userEvent.setup>, chip: string, target: RegExp) {
  await user.click(screen.getByRole('button', { name: chip }))
  await user.click(screen.getByRole('button', { name: target }))
}

describe('associação', () => {
  it('permite associar sem arrastar, só com clique e teclado', async () => {
    const user = userEvent.setup()
    render(<MatchingBlock item={matching} />)

    await assign(user, 'EPI', /NR-6/)
    await assign(user, 'CIPA', /NR-5/)
    await user.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(screen.getByText('2 de 2 corretos')).toBeInTheDocument()
  })

  it('só libera a verificação depois de atribuir todas as fichas', async () => {
    const user = userEvent.setup()
    render(<MatchingBlock item={matching} />)

    expect(screen.getByRole('button', { name: 'Verificar' })).toBeDisabled()

    await assign(user, 'EPI', /NR-6/)
    expect(screen.getByRole('button', { name: 'Verificar' })).toBeDisabled()

    await assign(user, 'CIPA', /NR-5/)
    expect(screen.getByRole('button', { name: 'Verificar' })).toBeEnabled()
  })

  it('conta o erro quando os lados são trocados', async () => {
    const user = userEvent.setup()
    render(<MatchingBlock item={matching} />)

    await assign(user, 'EPI', /NR-5/)
    await assign(user, 'CIPA', /NR-6/)
    await user.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(screen.getByText('0 de 2 corretos')).toBeInTheDocument()
  })

  it('devolve o ocupante ao banco quando o alvo já está preenchido', async () => {
    const user = userEvent.setup()
    render(<MatchingBlock item={matching} />)

    await assign(user, 'EPI', /NR-6/)
    await assign(user, 'CIPA', /NR-6/)

    expect(screen.getByRole('button', { name: 'Verificar' })).toBeDisabled()
  })
})

describe('categorização', () => {
  it('aceita mais de um item por categoria e apura o resultado', async () => {
    const user = userEvent.setup()
    render(<CategorizationBlock item={categorization} />)

    await assign(user, 'Capacete', /Cabeça/)
    await assign(user, 'Luva', /Membros/)
    await user.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(screen.getByText('2 de 2 corretos')).toBeInTheDocument()
  })

  it('reabre a atividade ao tentar novamente', async () => {
    const user = userEvent.setup()
    render(<CategorizationBlock item={categorization} />)

    await assign(user, 'Capacete', /Cabeça/)
    await assign(user, 'Luva', /Cabeça/)
    await user.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(screen.getByText('1 de 2 corretos')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Tentar novamente/ }))

    expect(screen.getByRole('button', { name: 'Verificar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Capacete' })).toBeEnabled()
  })
})
