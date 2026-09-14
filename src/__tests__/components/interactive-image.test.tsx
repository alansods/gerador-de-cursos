import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  FIND_MISS_ALLOWANCE,
  InteractiveImageBlock,
  findHotspotAt,
} from '@/components/course/blocks/InteractiveImageBlock'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
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

  it('caps the image and its hotspots at the chosen size', () => {
    render(<InteractiveImageBlock item={{ ...item, size: 'small' }} />)

    expect(ponto(1).parentElement).toHaveClass('max-w-[min(20rem,100%)]')
  })

  it('centers the image and the caption', () => {
    render(<InteractiveImageBlock item={item} />)

    expect(ponto(1).parentElement).toHaveClass('mx-auto')
    expect(screen.getByText('Partes do capacete')).toHaveClass('text-center')
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

describe('interactive image in find mode', () => {
  const findItem: Block = { ...item, hotspotMode: 'find' }

  function renderFind() {
    const recordQuiz = jest.fn()
    render(
      <ScormProgressProvider value={{ unitId: 'u1', recordQuiz }}>
        <InteractiveImageBlock item={findItem} blockIndex={4} />
      </ScormProgressProvider>
    )
    const area = screen.getByRole('application', { name: 'Procurar pontos na imagem' })
    area.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300 }) as DOMRect
    return { area, recordQuiz }
  }

  const press = (area: HTMLElement, key: string, times = 1) => {
    for (let i = 0; i < times; i++) fireEvent.keyDown(area, { key })
  }

  afterEach(() => jest.useRealTimers())

  it('hides the hotspots and shows the progress counter', () => {
    renderFind()

    expect(screen.queryByRole('button', { name: /^Ponto/ })).not.toBeInTheDocument()
    expect(screen.getByText('0 de 2 encontrados')).toBeInTheDocument()
    expect(screen.getByText(/cada um dos 2 pontos/)).toBeInTheDocument()
  })

  it('shows a miss briefly and reveals a hotspot clicked in the right place', () => {
    jest.useFakeTimers()
    const { area, recordQuiz } = renderFind()

    fireEvent.click(area, { clientX: 40, clientY: 30 })
    expect(screen.getAllByTestId('find-miss')).toHaveLength(1)
    expect(screen.getByText('Nada aqui. Tente outro ponto.')).toBeInTheDocument()

    act(() => jest.advanceTimersByTime(1000))
    expect(screen.queryByTestId('find-miss')).not.toBeInTheDocument()

    fireEvent.click(area, { clientX: 205, clientY: 70 })
    expect(screen.getByText('1 de 2 encontrados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Encontrado 1: Casco' })).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Casco')
    expect(recordQuiz).not.toHaveBeenCalled()
  })

  it('finds every hotspot with the keyboard and records a first-try result', () => {
    const { area, recordQuiz } = renderFind()

    press(area, 'ArrowUp', 5)
    expect(screen.getByTestId('find-cursor')).toHaveStyle({ left: '50%', top: '25%' })
    press(area, 'Enter')
    press(area, 'ArrowLeft', 4)
    press(area, 'ArrowDown', 9)
    press(area, ' ')

    expect(screen.getByText('Você encontrou todos os 2 pontos!')).toBeInTheDocument()
    expect(recordQuiz).toHaveBeenCalledTimes(1)
    expect(recordQuiz).toHaveBeenCalledWith('u1', 4, 2, 2, true)
  })

  it('closes an open popup on an empty tap without counting a miss', () => {
    const { area, recordQuiz } = renderFind()

    fireEvent.click(area, { clientX: 200, clientY: 75 })
    for (let i = 0; i <= FIND_MISS_ALLOWANCE; i++) {
      fireEvent.mouseDown(area)
      fireEvent.click(area, { clientX: 390, clientY: 10 })
      fireEvent.click(area, { clientX: 200, clientY: 75 })
    }

    expect(screen.queryByTestId('find-miss')).not.toBeInTheDocument()

    fireEvent.mouseDown(area)
    fireEvent.click(area, { clientX: 128, clientY: 216 })

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Jugular')
    expect(recordQuiz).toHaveBeenCalledWith('u1', 4, 2, 2, true)
  })

  it('records without the first-try flag after too many misses', () => {
    const { area, recordQuiz } = renderFind()

    for (let i = 0; i <= FIND_MISS_ALLOWANCE; i++) {
      fireEvent.click(area, { clientX: 390, clientY: 10 })
    }
    fireEvent.click(area, { clientX: 200, clientY: 75 })
    fireEvent.click(area, { clientX: 128, clientY: 216 })

    expect(recordQuiz).toHaveBeenCalledWith('u1', 4, 2, 2, false)
  })

  it('keeps the first-try flag with misses up to the allowance', () => {
    const { area, recordQuiz } = renderFind()

    for (let i = 0; i < FIND_MISS_ALLOWANCE; i++) {
      fireEvent.click(area, { clientX: 390, clientY: 10 })
    }
    fireEvent.click(area, { clientX: 200, clientY: 75 })
    fireEvent.click(area, { clientX: 128, clientY: 216 })

    expect(recordQuiz).toHaveBeenCalledWith('u1', 4, 2, 2, true)
  })
})

describe('findHotspotAt', () => {
  const hotspots = item.hotspots!

  it('hits the closest hotspot inside the radius, correcting for the image ratio', () => {
    expect(findHotspotAt(hotspots, 53, 25, 400, 300)?.id).toBe('h1')
    expect(findHotspotAt(hotspots, 50, 36, 400, 300)).toBeUndefined()
    expect(findHotspotAt(hotspots, 50, 34, 400, 300)?.id).toBe('h1')
  })

  it('never shrinks the radius below a finger on small images', () => {
    expect(findHotspotAt(hotspots, 60, 25, 200, 150)?.id).toBe('h1')
  })
})
