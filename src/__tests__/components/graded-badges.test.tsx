import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { BlockRenderer } from '@/components/course/blocks'
import { ActivityGradingBadge } from '@/components/course/ActivityGradingBadge'
import type { Block } from '@/types/course'

const block = (type: Block['type'], extra: Partial<Block> = {}): Block => ({
  id: `${type}-${Math.random().toString(36).slice(2)}`,
  type,
  content: '<p>Texto</p>',
  order: 0,
  ...extra,
})

const fillBlanks = (extra: Partial<Block> = {}) =>
  block('fill-blanks', { content: '', fillBlanksText: 'Use [luvas].', ...extra })

describe('player badge', () => {
  it('marks graded activities once and leaves practice and content blocks without it', () => {
    render(
      <BlockRenderer
        block={[
          fillBlanks(),
          fillBlanks({ graded: false }),
          block('paragraph'),
          block('interactive-image', { baseImage: 'https://exemplo.com/a.png', hotspots: [] }),
        ]}
      />
    )

    expect(screen.getAllByText('Vale nota')).toHaveLength(1)
  })
})

describe('editor badge', () => {
  it('shows Vale nota or Fixação on gradable blocks only', () => {
    const { rerender, container } = render(<ActivityGradingBadge block={fillBlanks()} />)
    expect(screen.getByText('Vale nota')).toBeInTheDocument()

    rerender(<ActivityGradingBadge block={fillBlanks({ graded: false })} />)
    expect(screen.getByText('Fixação')).toBeInTheDocument()

    rerender(<ActivityGradingBadge block={block('flipcard', { graded: false })} />)
    expect(container).toBeEmptyDOMElement()
  })
})
