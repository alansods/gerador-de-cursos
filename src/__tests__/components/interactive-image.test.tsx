import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InteractiveImageBlock } from '@/components/course/blocks/InteractiveImageBlock'
import type { Block } from '@/types/course'

const item: Block = {
  id: 'b1',
  order: 0,
  type: 'interactive-image',
  content: '',
  baseImage: 'https://exemplo.com/capacete.png',
  caption: 'Partes do capacete',
  hotspots: [
    { id: 'h1', x: 50, y: 25, title: 'Casco', content: '<p>Camada externa rígida.</p>' },
    { id: 'h2', x: 32, y: 72, title: 'Jugular', content: '<p>Prende ao queixo.</p>' },
  ],
}

const ponto = (n: number) => screen.getByRole('button', { name: new RegExp(`^Ponto ${n}`) })

describe('interactive image', () => {
  it('opens the popup on the clicked hotspot and shows nothing before', async () => {
    const user = userEvent.setup()
    render(<InteractiveImageBlock item={item} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(ponto(1))

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Casco')
    expect(screen.getByText('Camada externa rígida.')).toBeInTheDocument()
  })

  it('closes on the X and returns the focus to the hotspot', async () => {
    const user = userEvent.setup()
    render(<InteractiveImageBlock item={item} />)

    await user.click(ponto(1))
    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(ponto(1)).toHaveFocus()
  })

  it('switches hotspots without leaving two popups open', async () => {
    const user = userEvent.setup()
    render(<InteractiveImageBlock item={item} />)

    await user.click(ponto(1))
    await user.click(ponto(2))

    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Jugular')
  })

  it('closes when the same hotspot is clicked again', async () => {
    const user = userEvent.setup()
    render(<InteractiveImageBlock item={item} />)

    await user.click(ponto(1))
    await user.click(ponto(1))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on a click outside the popup', async () => {
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

  it('stays open on a click inside the popup', async () => {
    const user = userEvent.setup()
    render(<InteractiveImageBlock item={item} />)

    await user.click(ponto(1))
    await user.click(screen.getByText('Camada externa rígida.'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape and returns the focus to the hotspot', async () => {
    const user = userEvent.setup()
    render(<InteractiveImageBlock item={item} />)

    await user.click(ponto(1))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(ponto(1)).toHaveFocus()
  })
})
