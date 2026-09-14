import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ImageBlock } from '@/components/course/blocks/ImageBlock'
import { TechnicalSheetBlock } from '@/components/course/blocks/TechnicalSheetBlock'
import { FlipCard } from '@/components/flipcard'
import type { Block } from '@/types/course'

const cream = 'background-color: #FBF4E6'

const image = (content: string): Block => ({
  id: 'img',
  type: 'image',
  content,
  order: 0,
  caption: 'Coco',
  size: 'medium',
})

describe('illustration cream card', () => {
  it('puts library illustrations on the cream card and leaves uploads as they were', () => {
    const { rerender } = render(
      <ImageBlock item={image('/illustrations/culinary/ingredients/coconut.svg')} />
    )
    expect(screen.getByRole('img', { name: 'Coco' })).toHaveStyle(cream)

    rerender(<ImageBlock item={image('https://blob.example.com/foto.png')} />)
    expect(screen.getByRole('img', { name: 'Coco' }).style.backgroundColor).toBe('')
  })

  it('keeps the card in exported packages, where the path points to images/', () => {
    const { container } = render(
      <TechnicalSheetBlock
        item={{
          id: 'ts',
          type: 'technical-sheet',
          content: '',
          order: 0,
          sheetMaterials: [
            {
              id: 'm1',
              name: 'Coco',
              quantity: '',
              image: 'images/illustration-culinary-ingredients-coconut.svg',
            },
          ],
          sheetSteps: [],
        }}
      />
    )

    expect(container.querySelector('img')?.parentElement).toHaveStyle(cream)
  })

  it('shows the whole illustration on a flipcard front instead of cropping it', () => {
    const { container } = render(
      <FlipCard
        frontType="image"
        frontImage="/illustrations/culinary/ingredients/coconut.svg"
        backContent="Verso"
      />
    )

    expect(container.querySelector('.fc-band')).toHaveStyle(cream)
    expect(container.querySelector('.fc-band img')).toHaveStyle('object-fit: contain')
  })
})
