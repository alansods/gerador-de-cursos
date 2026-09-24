import {
  VIDEO_LESSONS_LAYOUT_ID,
  allowedBlockTypes,
  blocksOutsideLayout,
  canUseLayout,
} from '@/lib/layout-blocks'
import type { Block, Unit } from '@/types/course'

const block = (type: Block['type']) => ({ id: type, type }) as Block
const unit = (...types: Block['type'][]) => ({ blocks: types.map(block) }) as Unit

describe('layout block rules', () => {
  it('limits the video lessons layout to video blocks and leaves the others open', () => {
    expect(allowedBlockTypes(VIDEO_LESSONS_LAYOUT_ID)).toEqual(['video'])
    expect(allowedBlockTypes('classic')).toBeNull()
    expect(allowedBlockTypes(undefined)).toBeNull()
  })

  it('counts the blocks a layout does not accept', () => {
    const units = [unit('video', 'paragraph'), unit('quiz', 'video', 'image')]

    expect(blocksOutsideLayout(units, VIDEO_LESSONS_LAYOUT_ID)).toBe(3)
    expect(blocksOutsideLayout(units, 'trail')).toBe(0)
  })

  it('allows the layout only when every block fits', () => {
    expect(canUseLayout({ units: [unit('video', 'video'), unit()] }, VIDEO_LESSONS_LAYOUT_ID)).toBe(
      true
    )
    expect(canUseLayout({ units: [unit('video', 'heading')] }, VIDEO_LESSONS_LAYOUT_ID)).toBe(false)
    expect(canUseLayout({ units: [] }, VIDEO_LESSONS_LAYOUT_ID)).toBe(true)
  })
})
