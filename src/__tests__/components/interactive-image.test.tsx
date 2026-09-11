import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InteractiveImageBlock } from '@/components/course/blocks/InteractiveImageBlock'
import type { Block } from '@/types/course'

const item: Block = {
  id: 'b1',
  ordem: 0,
  tipo: 'imagem-interativa',
  conteudo: '',
  imagemBase: 'https://exemplo.com/capacete.png',
  legenda: 'Partes do capacete',
  hotspots: [
    { id: 'h1', x: 50, y: 25, titulo: 'Casco', conteudo: '<p>Camada externa rígida.</p>' },
    { id: 'h2', x: 32, y: 72, titulo: 'Jugular', conteudo: '<p>Prende ao queixo.</p>' },
  ],
}

const ponto = (n: number) => screen.getByRole('button', { name: new RegExp(`^Ponto ${n}`) })

describe('imagem interativa', () => {
  it('abre o popup no ponto clicado e não mostra nada antes', async () => {
    const user = userEvent.setup()
    render(<InteractiveImageBlock item={item} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(ponto(1))

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Casco')
    expect(screen.getByText('Camada externa rígida.')).toBeInTheDocument()
  })

  it('fecha pelo X e devolve o foco ao ponto', async () => {
    const user = userEvent.setup()
    render(<InteractiveImageBlock item={item} />)

    await user.click(ponto(1))
    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(ponto(1)).toHaveFocus()
  })

  it('troca de ponto sem deixar dois popups abertos', async () => {
    const user = userEvent.setup()
    render(<InteractiveImageBlock item={item} />)

    await user.click(ponto(1))
    await user.click(ponto(2))

    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Jugular')
  })

  it('fecha ao clicar no mesmo ponto de novo', async () => {
    const user = userEvent.setup()
    render(<InteractiveImageBlock item={item} />)

    await user.click(ponto(1))
    await user.click(ponto(1))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('fecha ao clicar fora do popup', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <InteractiveImageBlock item={item} />
        <button type="button">fora</button>
      </div>
    )

    await user.click(ponto(1))
    await user.click(screen.getByRole('button', { name: 'fora' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('não fecha ao clicar dentro do próprio popup', async () => {
    const user = userEvent.setup()
    render(<InteractiveImageBlock item={item} />)

    await user.click(ponto(1))
    await user.click(screen.getByText('Camada externa rígida.'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('fecha com Escape e devolve o foco ao ponto', async () => {
    const user = userEvent.setup()
    render(<InteractiveImageBlock item={item} />)

    await user.click(ponto(1))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(ponto(1)).toHaveFocus()
  })
})
