import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentBlockDrawer } from '@/components/ContentBlockDrawer'
import { blockRegistry } from '@/components/course/blocks'
import { BLOCK_CATALOG, BLOCK_TYPES, createEmptyBlock } from '@/lib/blocks'
import type { Block } from '@/types/course'

const errorToast = jest.fn()
jest.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => errorToast(...args),
    success: jest.fn(),
    info: jest.fn(),
  },
}))

jest.mock('@/components/RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))

function mount(type: Block['type'], onSave = jest.fn()) {
  render(
    <ContentBlockDrawer
      open
      onOpenChange={jest.fn()}
      mode="add"
      blockData={{ type }}
      onSave={onSave}
      onCancel={jest.fn()}
    />
  )
  return onSave
}

beforeEach(() => errorToast.mockClear())

describe('block preview in the editor', () => {
  it('has a render component for every type in the catalog', () => {
    // O card do editor renderiza blockRegistry[item.tipo] no fallback. Sem entrada
    // here, a freshly created block showed up as an empty card.
    for (const type of BLOCK_TYPES) {
      expect(blockRegistry[type]).toBeDefined()
    }
  })
})

describe('ContentBlockDrawer', () => {
  it('shows the catalog label in the header of each type', () => {
    for (const type of BLOCK_TYPES) {
      const { unmount } = render(
        <ContentBlockDrawer
          open
          onOpenChange={jest.fn()}
          mode="add"
          blockData={{ type }}
          onSave={jest.fn()}
          onCancel={jest.fn()}
        />
      )

      expect(screen.getAllByText(BLOCK_CATALOG[type].label).length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('blocks saving an empty block and shows the catalog message', async () => {
    const user = userEvent.setup()
    const onSave = mount('tabs')

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(errorToast).toHaveBeenCalledWith(
      BLOCK_CATALOG.tabs.validateForm(createEmptyBlock('tabs'))
    )
  })

  it('saves the divider with nothing filled in', async () => {
    const user = userEvent.setup()
    const onSave = mount('divider')

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'divider', dividerStyle: 'line' })
    )
  })

  it('builds a complete tab and saves it', async () => {
    const user = userEvent.setup()
    const onSave = mount('tabs')

    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.type(screen.getByPlaceholderText('Título da aba...'), 'Riscos')
    await user.type(screen.getByPlaceholderText('Conteúdo da aba...'), 'Físicos e químicos')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(errorToast).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tabs',
        tabItems: [expect.objectContaining({ title: 'Riscos', content: 'Físicos e químicos' })],
      })
    )
  })

  it('builds an interactive video question and saves it', async () => {
    const user = userEvent.setup()
    const onSave = mount('interactive-video')

    await user.type(screen.getByPlaceholderText('Digite o título do vídeo...'), 'Uso do capacete')
    await user.type(
      screen.getByPlaceholderText('ou cole o link do YouTube aqui...'),
      'https://b.com/a.mp4'
    )

    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.type(screen.getByPlaceholderText('mm:ss — ex.: 02:30'), '01:30')
    await user.type(
      screen.getByPlaceholderText('O que o aluno precisa responder...'),
      'O que prende o capacete?'
    )
    await user.type(screen.getByPlaceholderText('A...'), 'O casco')
    await user.type(screen.getByPlaceholderText('B...'), 'A jugular')

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(errorToast).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'interactive-video',
        videoUrl: 'https://b.com/a.mp4',
        videoQuestions: [
          expect.objectContaining({
            time: '01:30',
            question: 'O que prende o capacete?',
            optionA: 'O casco',
            optionB: 'A jugular',
            correct: 'A',
          }),
        ],
      })
    )
  })

  it('rejects a video question whose correct option is empty', async () => {
    const user = userEvent.setup()
    const onSave = mount('interactive-video')

    await user.type(screen.getByPlaceholderText('Digite o título do vídeo...'), 'Aula')
    await user.type(
      screen.getByPlaceholderText('ou cole o link do YouTube aqui...'),
      'https://b.com/a.mp4'
    )

    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.type(screen.getByPlaceholderText('mm:ss — ex.: 02:30'), 'agora')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(errorToast).toHaveBeenCalledWith('Pergunta 1: informe o tempo no formato mm:ss')
  })

  it('offers a single URL field, with no source picker, on both video blocks', async () => {
    // Uploading a file and pasting a link are the same thing: one field, no source picker.
    for (const type of ['video', 'interactive-video'] as const) {
      const { unmount } = render(
        <ContentBlockDrawer
          open
          onOpenChange={jest.fn()}
          mode="add"
          blockData={{ type }}
          onSave={jest.fn()}
          onCancel={jest.fn()}
        />
      )

      expect(screen.queryByText('Fonte do vídeo')).toBeNull()
      expect(screen.queryByRole('combobox')).toBeNull()
      expect(screen.getAllByPlaceholderText('ou cole o link do YouTube aqui...')).toHaveLength(1)
      unmount()
    }
  })

  it('warns about the offline package as soon as a YouTube link is pasted', async () => {
    const user = userEvent.setup()
    mount('interactive-video')

    expect(screen.queryByText(/precisará de internet/i)).toBeNull()

    await user.type(
      screen.getByPlaceholderText('ou cole o link do YouTube aqui...'),
      'https://youtu.be/dQw4w9WgXcQ'
    )

    expect(screen.getByText(/precisará de internet/i)).toBeInTheDocument()
  })

  it('requires a title on the timeline event', async () => {
    const user = userEvent.setup()
    const onSave = mount('timeline')

    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.type(screen.getByPlaceholderText('Ex.: 1990 ou Março/2024'), '1943')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(errorToast).toHaveBeenCalledWith('Todos os eventos devem ter título')
  })

  it('builds a flipcard grid inside a single block', async () => {
    const user = userEvent.setup()
    const onSave = mount('flipcard')

    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.type(screen.getByPlaceholderText('Digite o título...'), 'Flexbox')
    await user.type(
      screen.getByPlaceholderText('Digite o conteúdo do verso...'),
      'Layout em uma dimensão'
    )

    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.type(screen.getAllByPlaceholderText('Digite o título...')[1], 'CSS Grid')
    await user.type(
      screen.getAllByPlaceholderText('Digite o conteúdo do verso...')[1],
      'Layout em duas dimensões'
    )

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(errorToast).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'flipcard',
        flipcardItems: [
          expect.objectContaining({
            frontTitle: 'Flexbox',
            backContent: 'Layout em uma dimensão',
          }),
          expect.objectContaining({
            frontTitle: 'CSS Grid',
            backContent: 'Layout em duas dimensões',
          }),
        ],
      })
    )
  })

  it('opens a legacy single-card flipcard already as a list', async () => {
    const user = userEvent.setup()
    const onSave = jest.fn()
    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={{
          type: 'flipcard',
          flipcardItems: [
            {
              id: 'c-1',
              frontType: 'title',
              frontTitle: 'Conceito antigo',
              backContent: 'Definição antiga',
            },
          ],
        }}
        onSave={onSave}
        onCancel={jest.fn()}
      />
    )

    expect(screen.getByDisplayValue('Conceito antigo')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(errorToast).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        flipcardItems: [
          expect.objectContaining({
            frontTitle: 'Conceito antigo',
            backContent: 'Definição antiga',
          }),
        ],
      })
    )
  })

  it('offers the width picker only on the blocks that declare it', () => {
    const { unmount } = render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="add"
        blockData={{ type: 'paragraph' }}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Meia largura' })).toBeInTheDocument()
    unmount()

    mount('flipcard')
    expect(screen.queryByRole('button', { name: 'Meia largura' })).not.toBeInTheDocument()
  })

  it('offers the image size picker on the interactive image, starting at large', () => {
    mount('interactive-image')

    expect(screen.getByText('Tamanho da Imagem')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveTextContent('Grande (100%)')
  })

  it('starts the interactive image in explore mode and saves the find mode', async () => {
    const user = userEvent.setup()
    const onSave = jest.fn()
    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={{
          type: 'interactive-image',
          baseImage: 'https://exemplo.com/a.png',
          hotspots: [{ id: 'h1', x: 10, y: 10, title: 'Casco', content: '' }],
        }}
        onSave={onSave}
        onCancel={jest.fn()}
      />
    )

    expect(screen.getByRole('radio', { name: /Explorar/ })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: /Encontrar/ }))
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(screen.getByRole('radio', { name: /Encontrar/ })).toBeChecked()
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ hotspotMode: 'find' }))
  })

  it('offers an optional image on each matching item and saves it', async () => {
    const user = userEvent.setup()
    const onSave = jest.fn()
    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={{
          type: 'matching',
          matchingPairs: [
            { id: 'p1', left: 'Panela', right: 'Cozinhar' },
            { id: 'p2', left: 'Faca', right: 'Cortar' },
          ],
        }}
        onSave={onSave}
        onCancel={jest.fn()}
      />
    )

    const labels = screen.getAllByText(/Imagem do item fixo/)
    expect(labels).toHaveLength(2)
    expect(labels[0].parentElement).not.toHaveTextContent('*')

    await user.type(
      screen.getAllByPlaceholderText('ou cole a URL aqui...')[0],
      'https://x.com/pan.png'
    )
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        matchingPairs: [
          expect.objectContaining({ id: 'p1', leftImage: 'https://x.com/pan.png' }),
          expect.not.objectContaining({ leftImage: expect.anything() }),
        ],
      })
    )
  })

  it('shows the interactive base image only once, inside the hotspot editor', () => {
    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={{ type: 'interactive-image', baseImage: 'https://exemplo.com/a.png' }}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    )

    const images = document.querySelectorAll('img[src="https://exemplo.com/a.png"]')
    expect(images).toHaveLength(1)
    expect(images[0].parentElement).toHaveClass('cursor-crosshair')
  })

  it('adds hotspots only by clicking the image, with the instruction shown', () => {
    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={{ type: 'interactive-image', baseImage: 'https://exemplo.com/a.png' }}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: /adicionar/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Clique na imagem onde deseja adicionar um ponto/)).toBeInTheDocument()
  })

  it('moves a hotspot by dragging or with the arrows, with no position inputs', async () => {
    const original = window.PointerEvent
    window.PointerEvent = class extends MouseEvent {
      pointerId: number
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init)
        this.pointerId = init.pointerId ?? 0
      }
    } as typeof PointerEvent
    const onSave = jest.fn()
    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={{
          type: 'interactive-image',
          baseImage: 'https://exemplo.com/a.png',
          hotspots: [{ id: 'h1', x: 10, y: 10, title: 'Casco', content: '' }],
        }}
        onSave={onSave}
        onCancel={jest.fn()}
      />
    )

    expect(screen.queryByLabelText('Horizontal (%)')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Vertical (%)')).not.toBeInTheDocument()

    const marker = screen.getByRole('button', { name: /mover ponto 1/i })
    const area = marker.parentElement as HTMLElement
    area.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100 }) as DOMRect

    fireEvent.pointerDown(marker, { pointerId: 1, clientX: 20, clientY: 10 })
    fireEvent.pointerMove(marker, { pointerId: 1, clientX: 150, clientY: 25 })
    fireEvent.pointerUp(marker, { pointerId: 1, clientX: 150, clientY: 25 })
    window.PointerEvent = original
    fireEvent.click(marker)
    fireEvent.keyDown(marker, { key: 'ArrowDown' })
    fireEvent.keyDown(marker, { key: 'ArrowLeft', shiftKey: true })

    await userEvent.setup().click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        hotspots: [expect.objectContaining({ id: 'h1', x: 70, y: 26 })],
      })
    )
  })

  it('removes a list item without touching the others', async () => {
    const user = userEvent.setup()
    const onSave = mount('carousel')

    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.type(
      screen.getByPlaceholderText('ou cole a URL aqui...'),
      'https://exemplo.com/a.png'
    )
    await user.click(screen.getByRole('button', { name: /adicionar/i }))

    const urls = screen.getAllByPlaceholderText('ou cole a URL aqui...')
    expect(urls).toHaveLength(2)
    await user.type(urls[1], 'https://exemplo.com/b.png')

    const captions = screen.getAllByPlaceholderText('Legenda da imagem...')
    const fontes = screen.getAllByPlaceholderText('Fonte da imagem...')
    await user.type(captions[0], 'Legenda A')
    await user.type(fontes[0], 'Fonte A')
    await user.type(captions[1], 'Legenda B')
    await user.type(fontes[1], 'Fonte B')

    const remove = screen.getAllByRole('button', { name: '' })
    await user.click(remove[remove.length - 1])

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        carouselItems: [
          expect.objectContaining({
            url: 'https://exemplo.com/a.png',
            caption: 'Legenda A',
            source: 'Fonte A',
          }),
        ],
      })
    )
  })
})

describe('interactive video source on save', () => {
  it('writes a youtube videoSource into the saved object', async () => {
    const user = userEvent.setup()
    const onSave = mount('interactive-video')

    await user.type(screen.getByPlaceholderText('Digite o título do vídeo...'), 'Aula')

    await user.type(
      screen.getByPlaceholderText('ou cole o link do YouTube aqui...'),
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    )

    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.type(screen.getByPlaceholderText('mm:ss — ex.: 02:30'), '00:05')
    await user.type(screen.getByPlaceholderText('O que o aluno precisa responder...'), 'P?')
    await user.type(screen.getByPlaceholderText('A...'), 'A')
    await user.type(screen.getByPlaceholderText('B...'), 'B')

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(errorToast).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'interactive-video',
        videoSource: 'youtube',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      })
    )
  })
})
