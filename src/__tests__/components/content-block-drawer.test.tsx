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

  it('cobra título do evento na linha do tempo', async () => {
    const usuario = userEvent.setup()
    const onSave = montar('linha-do-tempo')

    await usuario.click(screen.getByRole('button', { name: /adicionar/i }))
    await usuario.type(screen.getByPlaceholderText('Ex.: 1990 ou Março/2024'), '1943')
    await usuario.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(erroToast).toHaveBeenCalledWith('Todos os eventos devem ter título')
  })

  it('remove item da lista sem afetar os demais', async () => {
    const usuario = userEvent.setup()
    const onSave = montar('carrossel')

    await usuario.click(screen.getByRole('button', { name: /adicionar/i }))
    await usuario.type(screen.getByPlaceholderText('https://...'), 'https://exemplo.com/a.png')
    await usuario.click(screen.getByRole('button', { name: /adicionar/i }))

    const urls = screen.getAllByPlaceholderText('https://...')
    expect(urls).toHaveLength(2)
    await usuario.type(urls[1], 'https://exemplo.com/b.png')

    const remover = screen.getAllByRole('button', { name: '' })
    await usuario.click(remover[remover.length - 1])

    await usuario.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        itensCarrossel: [expect.objectContaining({ url: 'https://exemplo.com/a.png' })],
      })
    )
  })
})
