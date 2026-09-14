import '@testing-library/jest-dom'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IllustrationBrowser, IllustrationPicker } from '@/components/IllustrationPicker'
import type { IllustrationItem, IllustrationManifest } from '@/lib/illustration-catalog'

const item = (id: string, overrides: Partial<IllustrationItem>): IllustrationItem => ({
  id,
  title: id,
  theme: 'culinary',
  category: 'ingredients',
  file: `culinary/ingredients/${id}.svg`,
  tags: ['tag'],
  width: 64,
  height: 64,
  set: 'original',
  license: 'original',
  author: 'Gerador de Cursos',
  ...overrides,
})

const manifest: IllustrationManifest = {
  version: 1,
  themes: [
    { id: 'culinary', title: 'Culinária' },
    { id: 'food-safety', title: 'Segurança dos alimentos' },
  ],
  categories: [
    { id: 'ingredients', theme: 'culinary', title: 'Ingredientes' },
    { id: 'scenes', theme: 'culinary', title: 'Cenas de preparo' },
    { id: 'scenes', theme: 'food-safety', title: 'Cenas de higiene' },
  ],
  items: [
    item('lemon', { title: 'Limão', tags: ['fruta', 'cítrico'] }),
    item('stove', { title: 'Fogão aceso', category: 'scenes', file: 'culinary/scenes/stove.svg' }),
    item('hands', {
      title: 'Lavar as mãos',
      theme: 'food-safety',
      category: 'scenes',
      file: 'food-safety/scenes/hands.svg',
    }),
    item('apple', {
      title: 'Maçã',
      tags: ['fruta'],
      set: 'fluent-emoji',
      license: 'MIT',
      file: 'culinary/ingredients/apple.svg',
    }),
  ],
}

const cards = () =>
  within(screen.getByRole('list', { name: 'Ilustrações' }))
    .getAllByRole('button')
    .map((button) => button.textContent)

function renderBrowser(value?: string) {
  const onConfirm = jest.fn()
  const onCancel = jest.fn()
  render(
    <IllustrationBrowser
      manifest={manifest}
      value={value}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
  return { onConfirm, onCancel }
}

describe('IllustrationBrowser', () => {
  it('lists every illustration with its title and a count', () => {
    renderBrowser()

    expect(cards()).toEqual(['Limão', 'Fogão aceso', 'Lavar as mãos', 'Maçã'])
    expect(screen.getByText('4 ilustrações')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Usar ilustração' })).toBeDisabled()
  })

  it('searches ignoring accents and shows a message when nothing matches', async () => {
    const user = userEvent.setup()
    renderBrowser()

    await user.type(screen.getByPlaceholderText(/Buscar por nome/), 'limao')
    expect(cards()).toEqual(['Limão'])
    expect(screen.getByText('1 ilustração')).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText(/Buscar por nome/))
    await user.type(screen.getByPlaceholderText(/Buscar por nome/), 'parafuso')
    expect(screen.getByText(/Nenhuma ilustração encontrada/)).toBeInTheDocument()
  })

  it('limits categories to the chosen theme and filters by set', async () => {
    const user = userEvent.setup()
    renderBrowser()

    await user.selectOptions(screen.getByLabelText('Tema'), 'food-safety')
    expect(cards()).toEqual(['Lavar as mãos'])
    expect(
      within(screen.getByLabelText('Categoria'))
        .getAllByRole('option')
        .map((option) => option.textContent)
    ).toEqual(['Todas as categorias', 'Cenas de higiene'])

    await user.selectOptions(screen.getByLabelText('Tema'), '')
    await user.selectOptions(screen.getByLabelText('Categoria'), 'culinary/scenes')
    expect(screen.getByLabelText('Tema')).toHaveValue('culinary')
    expect(cards()).toEqual(['Fogão aceso'])

    await user.selectOptions(screen.getByLabelText('Categoria'), '')
    await user.selectOptions(screen.getByLabelText('Acervo'), 'fluent-emoji')
    expect(cards()).toEqual(['Maçã'])
  })

  it('previews the chosen illustration and confirms its path', async () => {
    const user = userEvent.setup()
    const { onConfirm, onCancel } = renderBrowser()

    await user.click(screen.getByRole('button', { name: 'Maçã' }))

    expect(screen.getByRole('button', { name: 'Maçã' })).toHaveAttribute('aria-pressed', 'true')
    const preview = within(screen.getByRole('complementary', { name: 'Pré-visualização' }))
    expect(preview.getByRole('img', { name: 'Maçã' })).toHaveAttribute(
      'src',
      '/illustrations/culinary/ingredients/apple.svg'
    )
    expect(preview.getByText(/acervo fluent-emoji · licença MIT/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Usar ilustração' }))
    expect(onConfirm).toHaveBeenCalledWith('/illustrations/culinary/ingredients/apple.svg')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('preselects the illustration already in the field', () => {
    renderBrowser('/illustrations/culinary/scenes/stove.svg')

    expect(screen.getByRole('button', { name: 'Fogão aceso' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Usar ilustração' })).toBeEnabled()
  })
})

describe('IllustrationPicker', () => {
  it('loads the manifest when opened and returns the chosen path', async () => {
    const user = userEvent.setup()
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => manifest })
    global.fetch = fetchMock
    const onSelect = jest.fn()
    const onOpenChange = jest.fn()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const { rerender } = render(
      <QueryClientProvider client={client}>
        <IllustrationPicker open={false} onOpenChange={onOpenChange} onSelect={onSelect} />
      </QueryClientProvider>
    )
    expect(fetchMock).not.toHaveBeenCalled()

    rerender(
      <QueryClientProvider client={client}>
        <IllustrationPicker open onOpenChange={onOpenChange} onSelect={onSelect} />
      </QueryClientProvider>
    )

    await waitFor(() => expect(screen.getByRole('button', { name: 'Limão' })).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/illustrations/manifest.json')

    await user.click(screen.getByRole('button', { name: 'Limão' }))
    await user.click(screen.getByRole('button', { name: 'Usar ilustração' }))

    expect(onSelect).toHaveBeenCalledWith('/illustrations/culinary/ingredients/lemon.svg')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('explains when the library cannot be loaded', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={client}>
        <IllustrationPicker open onOpenChange={jest.fn()} onSelect={jest.fn()} />
      </QueryClientProvider>
    )

    expect(
      await screen.findByText('Não foi possível carregar o acervo de ilustrações.')
    ).toBeInTheDocument()
  })
})
