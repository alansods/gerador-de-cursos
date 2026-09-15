import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import BlocksPage from '@/app/(app)/blocks/page'
import { BLOCK_CATEGORIES, modalEntriesFor } from '@/lib/blocks'
import { BLOCK_GUIDE, type ShowcaseEntryId } from '@/lib/block-showcase'
import blocksMessages from '@/i18n/locales/pt-BR/blocks.json'

beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver
})

function renderPage() {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={{ blocks: blocksMessages }}>
      <BlocksPage />
    </NextIntlClientProvider>
  )
}

describe('blocks showcase page', () => {
  it('shows one tab per category', () => {
    renderPage()
    for (const category of BLOCK_CATEGORIES) {
      expect(screen.getByRole('tab', { name: category.label })).toBeInTheDocument()
    }
  })

  it.each(BLOCK_CATEGORIES)('lists the $label entries with their guide', async (category) => {
    const user = userEvent.setup()
    const { container } = renderPage()
    await user.click(screen.getByRole('tab', { name: category.label }))

    for (const entry of modalEntriesFor(category.id)) {
      const card = container.querySelector(`[id="${entry.id}"]`) as HTMLElement
      expect(card).not.toBeNull()
      expect(within(card).getByRole('heading', { name: entry.label })).toBeInTheDocument()
      expect(
        within(card).getByText(BLOCK_GUIDE[entry.id as ShowcaseEntryId].authorFills)
      ).toBeInTheDocument()
    }
  })

  it('switches an activity between graded and practice', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()
    await user.click(screen.getByRole('tab', { name: 'Atividades' }))

    const card = container.querySelector('[id="fill-blanks"]') as HTMLElement
    const toggle = within(card).getByRole('checkbox', { name: 'Vale nota' })
    expect(within(card).getAllByText('Vale nota')).toHaveLength(2)

    await user.click(toggle)
    expect(toggle).not.toBeChecked()
    expect(within(card).getAllByText('Vale nota')).toHaveLength(1)
  })

  it('offers no grading toggle on content blocks', () => {
    const { container } = renderPage()
    const card = container.querySelector('[id="paragraph"]') as HTMLElement
    expect(within(card).queryByRole('checkbox')).not.toBeInTheDocument()
  })
})
