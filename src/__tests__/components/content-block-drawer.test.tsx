import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentBlockDrawer } from '@/components/ContentBlockDrawer'
import { blockRegistry } from '@/components/course/blocks'
import { CATALOGO_BLOCOS, TIPOS_BLOCO, criarBlocoVazio } from '@/lib/blocos'
import type { ConteudoUnidade } from '@/types/gerador-curso'

const erroToast = jest.fn()
jest.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => erroToast(...args),
    success: jest.fn(),
    info: jest.fn(),
  },
}))

jest.mock('@/components/RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))

function montar(tipo: ConteudoUnidade['tipo'], onSave = jest.fn()) {
  render(
    <ContentBlockDrawer
      open
      onOpenChange={jest.fn()}
      mode="add"
      blockData={{ tipo }}
      onSave={onSave}
      onCancel={jest.fn()}
    />
  )
  return onSave
}

beforeEach(() => erroToast.mockClear())

describe('preview do bloco no editor', () => {
  it('tem componente de render para todo tipo do catálogo', () => {
    // O card do editor renderiza blockRegistry[item.tipo] no fallback. Sem entrada
    // aqui, o bloco recém-criado aparecia como um card vazio.
    for (const tipo of TIPOS_BLOCO) {
      expect(blockRegistry[tipo]).toBeDefined()
    }
  })
})

describe('ContentBlockDrawer', () => {
  it('mostra o rótulo do catálogo no cabeçalho de cada tipo', () => {
    for (const tipo of TIPOS_BLOCO) {
      const { unmount } = render(
        <ContentBlockDrawer
          open
          onOpenChange={jest.fn()}
          mode="add"
          blockData={{ tipo }}
          onSave={jest.fn()}
          onCancel={jest.fn()}
        />
      )

      expect(screen.getAllByText(CATALOGO_BLOCOS[tipo].rotulo).length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('bloqueia o salvamento de bloco vazio e mostra a mensagem do catálogo', async () => {
    const usuario = userEvent.setup()
    const onSave = montar('tabs')

    await usuario.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(erroToast).toHaveBeenCalledWith(
      CATALOGO_BLOCOS.tabs.validarFormulario(criarBlocoVazio('tabs'))
    )
  })

  it('salva o separador sem exigir preenchimento', async () => {
    const usuario = userEvent.setup()
    const onSave = montar('separador')

    await usuario.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'separador', estiloSeparador: 'linha' })
    )
  })

  it('permite montar uma aba completa e salvar', async () => {
    const usuario = userEvent.setup()
    const onSave = montar('tabs')

    await usuario.click(screen.getByRole('button', { name: /adicionar/i }))
    await usuario.type(screen.getByPlaceholderText('Título da aba...'), 'Riscos')
    await usuario.type(screen.getByPlaceholderText('Conteúdo da aba...'), 'Físicos e químicos')
    await usuario.click(screen.getByRole('button', { name: /salvar/i }))

    expect(erroToast).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'tabs',
        itensTabs: [expect.objectContaining({ titulo: 'Riscos', conteudo: 'Físicos e químicos' })],
      })
    )
  })

  it('monta uma pergunta do vídeo interativo e salva', async () => {
    const usuario = userEvent.setup()
    const onSave = montar('video-interativo')

    await usuario.type(
      screen.getByPlaceholderText('Digite o título do vídeo...'),
      'Uso do capacete'
    )
    await usuario.type(screen.getByPlaceholderText('ou cole a URL aqui...'), 'https://b.com/a.mp4')

    await usuario.click(screen.getByRole('button', { name: /adicionar/i }))
    await usuario.type(screen.getByPlaceholderText('mm:ss — ex.: 02:30'), '01:30')
    await usuario.type(
      screen.getByPlaceholderText('O que o aluno precisa responder...'),
      'O que prende o capacete?'
    )
    await usuario.type(screen.getByPlaceholderText('A...'), 'O casco')
    await usuario.type(screen.getByPlaceholderText('B...'), 'A jugular')

    await usuario.click(screen.getByRole('button', { name: /salvar/i }))

    expect(erroToast).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'video-interativo',
        videoUrl: 'https://b.com/a.mp4',
        perguntasVideo: [
          expect.objectContaining({
            tempo: '01:30',
            pergunta: 'O que prende o capacete?',
            opcaoA: 'O casco',
            opcaoB: 'A jugular',
            correta: 'A',
          }),
        ],
      })
    )
  })

  it('recusa a pergunta do vídeo cuja alternativa correta está vazia', async () => {
    const usuario = userEvent.setup()
    const onSave = montar('video-interativo')

    await usuario.type(screen.getByPlaceholderText('Digite o título do vídeo...'), 'Aula')
    await usuario.type(screen.getByPlaceholderText('ou cole a URL aqui...'), 'https://b.com/a.mp4')

    await usuario.click(screen.getByRole('button', { name: /adicionar/i }))
    await usuario.type(screen.getByPlaceholderText('mm:ss — ex.: 02:30'), 'agora')
    await usuario.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(erroToast).toHaveBeenCalledWith('Pergunta 1: informe o tempo no formato mm:ss')
  })

  it('troca o campo de link do vídeo pelo upload ao escolher arquivo', async () => {
    const usuario = userEvent.setup()
    montar('video')

    expect(screen.getByPlaceholderText('Cole o link do vídeo do YouTube...')).toBeInTheDocument()

    await usuario.click(screen.getByRole('combobox'))
    await usuario.click(screen.getByRole('option', { name: 'Arquivo do computador' }))

    expect(screen.queryByPlaceholderText('Cole o link do vídeo do YouTube...')).toBeNull()
    expect(screen.getByPlaceholderText('ou cole a URL aqui...')).toBeInTheDocument()
  })

  it('cobra título do evento na linha do tempo', async () => {
    const usuario = userEvent.setup()
    const onSave = montar('linha-do-tempo')

    await usuario.click(screen.getByRole('button', { name: /adicionar/i }))
    await usuario.type(screen.getByPlaceholderText('Ex.: 1990 ou Março/2024'), '1943')
    await usuario.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(erroToast).toHaveBeenCalledWith('Todos os eventos devem ter título')
  })

  it('monta uma grade de flipcards num único bloco', async () => {
    const usuario = userEvent.setup()
    const onSave = montar('flipcard')

    await usuario.click(screen.getByRole('button', { name: /adicionar/i }))
    await usuario.type(screen.getByPlaceholderText('Digite o título...'), 'Flexbox')
    await usuario.type(
      screen.getByPlaceholderText('Digite o conteúdo do verso...'),
      'Layout em uma dimensão'
    )

    await usuario.click(screen.getByRole('button', { name: /adicionar/i }))
    await usuario.type(screen.getAllByPlaceholderText('Digite o título...')[1], 'CSS Grid')
    await usuario.type(
      screen.getAllByPlaceholderText('Digite o conteúdo do verso...')[1],
      'Layout em duas dimensões'
    )

    await usuario.click(screen.getByRole('button', { name: /salvar/i }))

    expect(erroToast).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'flipcard',
        itensFlipcard: [
          expect.objectContaining({
            tituloFrente: 'Flexbox',
            conteudoVerso: 'Layout em uma dimensão',
          }),
          expect.objectContaining({
            tituloFrente: 'CSS Grid',
            conteudoVerso: 'Layout em duas dimensões',
          }),
        ],
      })
    )
  })

  it('abre um flipcard legado de card único já como lista', async () => {
    const usuario = userEvent.setup()
    const onSave = jest.fn()
    render(
      <ContentBlockDrawer
        open
        onOpenChange={jest.fn()}
        mode="edit"
        blockData={{
          tipo: 'flipcard',
          tipoFrente: 'titulo',
          tituloFrente: 'Conceito antigo',
          conteudoVerso: 'Definição antiga',
        }}
        onSave={onSave}
        onCancel={jest.fn()}
      />
    )

    expect(screen.getByDisplayValue('Conceito antigo')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /salvar/i }))

    expect(erroToast).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        itensFlipcard: [
          expect.objectContaining({
            tituloFrente: 'Conceito antigo',
            conteudoVerso: 'Definição antiga',
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
        blockData={{ tipo: 'paragrafo' }}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Meia largura' })).toBeInTheDocument()
    unmount()

    montar('flipcard')
    expect(screen.queryByRole('button', { name: 'Meia largura' })).not.toBeInTheDocument()
  })

  it('remove item da lista sem afetar os demais', async () => {
    const usuario = userEvent.setup()
    const onSave = montar('carrossel')

    await usuario.click(screen.getByRole('button', { name: /adicionar/i }))
    await usuario.type(
      screen.getByPlaceholderText('ou cole a URL aqui...'),
      'https://exemplo.com/a.png'
    )
    await usuario.click(screen.getByRole('button', { name: /adicionar/i }))

    const urls = screen.getAllByPlaceholderText('ou cole a URL aqui...')
    expect(urls).toHaveLength(2)
    await usuario.type(urls[1], 'https://exemplo.com/b.png')

    const legendas = screen.getAllByPlaceholderText('Legenda da imagem...')
    const fontes = screen.getAllByPlaceholderText('Fonte da imagem...')
    await usuario.type(legendas[0], 'Legenda A')
    await usuario.type(fontes[0], 'Fonte A')
    await usuario.type(legendas[1], 'Legenda B')
    await usuario.type(fontes[1], 'Fonte B')

    const remover = screen.getAllByRole('button', { name: '' })
    await usuario.click(remover[remover.length - 1])

    await usuario.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        itensCarrossel: [
          expect.objectContaining({
            url: 'https://exemplo.com/a.png',
            legenda: 'Legenda A',
            fonte: 'Fonte A',
          }),
        ],
      })
    )
  })
})
