import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { BlockRenderer, type BlockSurface, type BlockTheme } from '@/components/course/blocks'
import {
  BlockThemeProvider,
  DEFAULT_BLOCK_THEME,
} from '@/components/course/blocks/BlockThemeProvider'
import type { Block } from '@/types/course'

const surface: BlockSurface = {
  radius: '20px',
  borderWidth: '2.5px',
  borderColor: '#2B2140',
  shadow: '0 6px 0 #2B2140',
  background: '#FFFDF7',
  borderColorDark: '#EDE7F6',
  backgroundDark: '#241C33',
}

const themeWithSurface: BlockTheme = { ...DEFAULT_BLOCK_THEME, surface }

const themeRoot = (container: HTMLElement) =>
  container.querySelector('[data-block-theme]') as HTMLElement

describe('BlockThemeProvider surface tokens', () => {
  it('does not mark the surface when the theme has none', () => {
    const { container } = render(
      <BlockThemeProvider theme={DEFAULT_BLOCK_THEME}>
        <span />
      </BlockThemeProvider>
    )

    const root = themeRoot(container)
    expect(root).not.toHaveAttribute('data-block-surface')
    expect(root.style.getPropertyValue('--block-surface-radius')).toBe('')
    expect(root.style.getPropertyValue('--block-accent-light')).toBe('#2563eb')
  })

  it('marks the surface and exposes every token when the theme defines one', () => {
    const { container } = render(
      <BlockThemeProvider theme={themeWithSurface}>
        <span />
      </BlockThemeProvider>
    )

    const root = themeRoot(container)
    expect(root).toHaveAttribute('data-block-surface')
    expect(root.style.getPropertyValue('--block-surface-radius')).toBe('20px')
    expect(root.style.getPropertyValue('--block-surface-border-width')).toBe('2.5px')
    expect(root.style.getPropertyValue('--block-surface-border-color-light')).toBe('#2B2140')
    expect(root.style.getPropertyValue('--block-surface-border-color-dark')).toBe('#EDE7F6')
    expect(root.style.getPropertyValue('--block-surface-background-dark')).toBe('#241C33')
  })

  it('falls back to the light values for missing dark variants', () => {
    const { container } = render(
      <BlockThemeProvider theme={themeWithSurface}>
        <span />
      </BlockThemeProvider>
    )

    expect(themeRoot(container).style.getPropertyValue('--block-surface-shadow-dark')).toBe(
      '0 6px 0 #2B2140'
    )
  })

  it('marks block cards so a surface theme can restyle them', () => {
    const list: Block = {
      id: 'list-1',
      type: 'list',
      content: '',
      order: 0,
      listType: 'ordered',
      listItems: [{ id: 'a', text: 'Separar os ingredientes' }],
    }

    const { container } = render(<BlockRenderer block={[list]} theme={themeWithSurface} />)

    expect(container.querySelector('[data-block-surface] .block-surface')).toBeInTheDocument()
  })
})
