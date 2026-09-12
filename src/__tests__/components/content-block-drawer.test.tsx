import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
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

describe('preview do bloco no editor', () => {
  it('tem componente de render para todo tipo do catálogo', () => {
    // O card do editor renderiza blockRegistry[item.tipo] no fallback. Sem entrada
    // aqui, o bloco recém-criado aparecia como um card vazio.
    for (const type of BLOCK_TYPES) {
      expect(blockRegistry[type]).toBeDefined()
    }
  })
})

describe('ContentBlockDrawer', () => {
  it('mostra o rótulo do catálogo no cabeçalho de cada tipo', () => {
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

  it('bloqueia o salvamento de bloco vazio e mostra a mensagem do catálogo', async () => {
    const user = userEvent.setup()
    const onSave = mount('tabs')

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(errorToast).toHaveBeenCalledWith(
      BLOCK_CATALOG.tabs.validateForm(createEmptyBlock('tabs'))
    )
  })

  it('salva o separador sem exigir preenchimento', async () => {
    const user = userEvent.setup()
    const onSave = mount('divider')

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'divider', dividerStyle: 'line' })
    )
  })

  it('permite montar uma aba completa e salvar', async () => {
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

  it('monta uma pergunta do vídeo interativo e salva', async () => {
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

  it('recusa a pergunta do vídeo cuja alternativa correta está vazia', async () => {
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

  it('tem um campo de URL só, sem seletor de fonte, nos dois blocos de vídeo', async () => {
    // Enviar arquivo e colar link são a mesma coisa: um campo, sem escolher a fonte.
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

  it('avisa sobre o pacote offline assim que um link do YouTube é colado', async () => {
    const user = userEvent.setup()
    mount('interactive-video')

    expect(screen.queryByText(/precisará de internet/i)).toBeNull()

    await user.type(
      screen.getByPlaceholderText('ou cole o link do YouTube aqui...'),
      'https://youtu.be/dQw4w9WgXcQ'
    )

    expect(screen.getByText(/precisará de internet/i)).toBeInTheDocument()
  })

  it('cobra título do evento na linha do tempo', async () => {
    const user = userEvent.setup()
    const onSave = mount('timeline')

    await user.click(screen.getByRole('button', { name: /adicionar/i }))
    await user.type(screen.getByPlaceholderText('Ex.: 1990 ou Março/2024'), '1943')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(errorToast).toHaveBeenCalledWith('Todos os eventos devem ter título')
  })

  it('monta uma grade de flipcards num único bloco', async () => {
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

  it('abre um flipcard legado de card único já como lista', async () => {
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

  it('oferece o seletor de largura só nos blocos que o declaram', () => {
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

  it('remove item da lista sem afetar os demais', async () => {
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

describe('fonte do vídeo interativo ao salvar', () => {
  it('entrega fonteVideo youtube no objeto salvo', async () => {
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
