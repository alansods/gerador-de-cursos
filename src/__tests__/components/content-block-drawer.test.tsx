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

  it('creates a technical sheet with an optional material image and reopens it', async () => {
    const user = userEvent.setup()
    const onSave = mount('technical-sheet')

    await user.click(screen.getByRole('button', { name: /salvar/i }))
    expect(errorToast).toHaveBeenLastCalledWith('Adicione pelo menos 1 material')

    const [addMaterial] = screen.getAllByRole('button', { name: /adicionar/i })
    await user.click(addMaterial)
    expect(screen.getByText(/Imagem do material/)).not.toHaveTextContent('*')
    await user.type(screen.getByPlaceholderText(/Coco ralado/), 'Coco')
    await user.type(screen.getByPlaceholderText('Ex.: 500 g'), '500 g')
    await user.click(screen.getByRole('button', { name: /salvar/i }))
    expect(errorToast).toHaveBeenLastCalledWith('Adicione pelo menos 1 passo')

    await user.click(screen.getAllByRole('button', { name: /adicionar/i }).at(-1) as HTMLElement)
    await user.type(screen.getByPlaceholderText(/Misture o coco/), 'Misture')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    const saved = onSave.mock.calls[0][0]
    expect(saved.sheetMaterials).toEqual([
      expect.objectContaining({ name: 'Coco', quantity: '500 g' }),
    ])
    expect(saved.sheetSteps).toEqual([expect.objectContaining({ text: 'Misture' })])

    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={saved}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect((screen.getAllByPlaceholderText(/Coco ralado/).at(-1) as HTMLInputElement).value).toBe(
      'Coco'
    )
    expect(
      (screen.getAllByPlaceholderText(/Misture o coco/).at(-1) as HTMLTextAreaElement).value
    ).toBe('Misture')
  })

  it('creates a practice mission and reopens it', async () => {
    const user = userEvent.setup()
    const onSave = mount('practice-checklist')

    await user.click(screen.getByRole('button', { name: /salvar/i }))
    expect(errorToast).toHaveBeenLastCalledWith('Descreva a missão')

    await user.type(screen.getByPlaceholderText(/Vista seus EPIs/), 'Confira seus EPIs')
    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.type(screen.getByPlaceholderText(/jugular ajustada/), 'Capacete')
    await user.click(screen.getByRole('button', { name: /salvar/i }))
    expect(errorToast).toHaveBeenLastCalledWith('Adicione pelo menos 2 itens')

    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.type(screen.getAllByPlaceholderText(/jugular ajustada/)[1], 'Luvas')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    const saved = onSave.mock.calls[0][0]
    expect(saved).toMatchObject({
      type: 'practice-checklist',
      practiceMission: 'Confira seus EPIs',
    })
    expect(saved.practiceItems.map((entry: { text: string }) => entry.text)).toEqual([
      'Capacete',
      'Luvas',
    ])

    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={saved}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    const reopened = screen.getAllByPlaceholderText(/jugular ajustada/).slice(-2)
    expect(reopened.map((input) => (input as HTMLInputElement).value)).toEqual([
      'Capacete',
      'Luvas',
    ])
  })

  it('creates a scenario with an optional avatar and reopens it', async () => {
    const user = userEvent.setup()
    const onSave = mount('scenario')

    expect(screen.getByText(/Imagem do personagem/)).not.toHaveTextContent('*')

    await user.type(screen.getByLabelText(/Personagem/), 'Seu João')
    await user.type(screen.getByLabelText(/Situação/), 'Colega sem cinto')
    await user.click(screen.getByRole('button', { name: /salvar/i }))
    expect(errorToast).toHaveBeenLastCalledWith('Adicione pelo menos 2 opções')

    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    const choices = screen.getAllByPlaceholderText(/Peço que ele use o cinto/)
    await user.type(choices[0], 'Deixo subir')
    await user.type(choices[1], 'Peço o cinto')
    await user.click(screen.getByRole('button', { name: /salvar/i }))
    expect(errorToast).toHaveBeenLastCalledWith('Marque pelo menos uma opção como correta')
    expect(onSave).not.toHaveBeenCalled()

    const draft = {
      type: 'scenario' as const,
      scenarioCharacter: 'Seu João',
      scenarioSituation: 'Colega sem cinto',
      scenarioOptions: [
        { id: 'a', text: 'Deixo subir', outcome: 'incorrect' as const, consequence: '' },
        { id: 'b', text: 'Peço o cinto', outcome: 'correct' as const, consequence: 'Isso.' },
      ],
    }
    const onSaveEdit = jest.fn()
    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={draft}
        onSave={onSaveEdit}
        onCancel={jest.fn()}
      />
    )

    expect(screen.getAllByRole('combobox').map((box) => box.textContent)).toEqual(
      expect.arrayContaining(['Incorreta', 'Correta'])
    )
    await user.click(screen.getAllByRole('button', { name: /salvar/i }).at(-1) as HTMLElement)
    expect(onSaveEdit).toHaveBeenCalledWith(expect.objectContaining(draft))
  })

  it('creates a fill-blanks block, listing the blanks, and reopens it', async () => {
    const user = userEvent.setup()
    const onSave = mount('fill-blanks')

    expect(screen.getByText('Nenhuma lacuna marcada ainda.')).toBeInTheDocument()

    const text = screen.getByLabelText(/Texto com lacunas/)
    await user.click(text)
    await user.paste('Lave por [20] segundos com [sabão].')
    expect(screen.getByText('2 lacunas: 20, sabão')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Palavras extras/), '10, álcool, sabão,')
    expect(screen.getByLabelText(/Palavras extras/)).toHaveValue('10, álcool, sabão,')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    const saved = onSave.mock.calls[0][0]
    expect(saved).toEqual(
      expect.objectContaining({
        fillBlanksText: 'Lave por [20] segundos com [sabão].',
        fillBlanksDistractors: ['10', 'álcool'],
      })
    )

    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={saved}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getAllByDisplayValue('10, álcool')).toHaveLength(1)
  })

  it('creates a sequence, reorders its steps and reopens it in that order', async () => {
    const user = userEvent.setup()
    const onSave = mount('sequence')

    for (let i = 0; i < 3; i++) await user.click(screen.getByRole('button', { name: /adicionar/i }))
    const fields = screen.getAllByPlaceholderText(/Ajustar a carneira/)
    await user.type(fields[0], 'Colocar')
    await user.type(fields[1], 'Inspecionar')
    await user.type(fields[2], 'Prender')

    expect(screen.getByRole('button', { name: 'Mover passo 1 para cima' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Mover passo 2 para cima' }))
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    const saved = onSave.mock.calls[0][0]
    expect(saved.sequenceItems.map((s: { text: string }) => s.text)).toEqual([
      'Inspecionar',
      'Colocar',
      'Prender',
    ])

    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={saved}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    const reopened = screen.getAllByPlaceholderText(/Ajustar a carneira/).slice(-3)
    expect(reopened.map((input) => (input as HTMLInputElement).value)).toEqual([
      'Inspecionar',
      'Colocar',
      'Prender',
    ])
  })

  it('keeps the other item editors without reorder buttons', async () => {
    const user = userEvent.setup()
    mount('tabs')

    await user.click(screen.getByRole('button', { name: /adicionar/i }))

    expect(screen.queryByRole('button', { name: /Mover/ })).not.toBeInTheDocument()
  })

  it('creates a true-false block and reopens it with the saved answers', async () => {
    const user = userEvent.setup()
    const onSave = mount('true-false')

    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    const statements = screen.getAllByPlaceholderText(/O EPI deve ser fornecido/)
    await user.type(statements[0], 'O EPI é gratuito.')
    await user.type(statements[1], 'Tarefa rápida dispensa EPI.')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    const saved = onSave.mock.calls[0][0]
    expect(saved.trueFalseItems).toEqual([
      expect.objectContaining({ statement: 'O EPI é gratuito.', answer: 'true' }),
      expect.objectContaining({ statement: 'Tarefa rápida dispensa EPI.', answer: 'true' }),
    ])

    const reopened = {
      ...saved,
      trueFalseItems: [saved.trueFalseItems[0], { ...saved.trueFalseItems[1], answer: 'false' }],
    }
    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={reopened}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    )

    expect(screen.getAllByDisplayValue('Tarefa rápida dispensa EPI.').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('combobox').map((box) => box.textContent)).toContain('Falso')
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
