import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { TechnicalSheetBlock } from '@/components/course/blocks/TechnicalSheetBlock'
import { blockRegistry } from '@/components/course/blocks'
import type { Block } from '@/types/course'

const item: Block = {
  id: 'b1',
  order: 0,
  type: 'technical-sheet',
  content: '',
  sheetSummary: 'Rende 20 porções',
  sheetMaterials: [
    { id: 'm1', name: 'Coco ralado', quantity: '500 g', image: 'https://x.com/coco.png' },
    { id: 'm2', name: 'Açúcar', quantity: '' },
  ],
  sheetSteps: [
    { id: 's1', text: 'Misture o coco e o açúcar' },
    { id: 's2', text: 'Mexa até soltar do fundo' },
  ],
}

describe('TechnicalSheetBlock', () => {
  it('is the registered renderer for the type', () => {
    expect(blockRegistry['technical-sheet']).toBe(TechnicalSheetBlock)
  })

  it('shows the summary, the materials and the numbered steps', () => {
    const { container } = render(<TechnicalSheetBlock item={item} />)

    expect(screen.getByText('Rende 20 porções')).toBeInTheDocument()
    const materials = within(screen.getByRole('heading', { name: 'Materiais' }).parentElement!)
    expect(materials.getAllByRole('listitem')).toHaveLength(2)
    expect(materials.getByText('500 g')).toBeInTheDocument()
    expect(container.querySelectorAll('img')).toHaveLength(1)

    const steps = within(screen.getByRole('heading', { name: 'Passos' }).parentElement!)
    expect(steps.getAllByRole('listitem').map((entry) => entry.textContent)).toEqual([
      '1Misture o coco e o açúcar',
      '2Mexa até soltar do fundo',
    ])
  })

  it('falls back to an icon when a material image fails to load', () => {
    const { container } = render(<TechnicalSheetBlock item={item} />)

    fireEvent.error(container.querySelector('img') as HTMLImageElement)

    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it('hides the steps section when there are no steps', () => {
    render(<TechnicalSheetBlock item={{ ...item, sheetSteps: [] }} />)

    expect(screen.queryByRole('heading', { name: 'Passos' })).not.toBeInTheDocument()
  })
})
