import '@testing-library/jest-dom'
import { render, screen, cleanup } from '@testing-library/react'
import { ContentBlockDrawer } from '@/components/ContentBlockDrawer'
import { BLOCK_TYPES } from '@/lib/blocks'
import type { Block } from '@/types/course'

jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() } }))

jest.mock('@/components/RichTextEditor', () => ({
  RichTextEditor: () => <textarea aria-label="editor" />,
}))

const item = { id: 'i1' }

const everyListFilled: Partial<Block> = {
  items: [{ id: 'i1', title: 'Item', content: 'Texto' }],
  listItems: [{ id: 'i1', text: 'Item' }],
  objectiveItems: [{ id: 'i1', text: 'Item' }],
  flipcardItems: [{ ...item, front: 'Frente', back: 'Verso' }],
  tabItems: [{ ...item, title: 'Aba', content: 'Texto' }],
  timelineItems: [{ ...item, title: 'Etapa', content: 'Texto' }],
  carouselItems: [{ ...item, image: 'https://x/a.png' }],
  videoQuestions: [{ ...item, time: 1, question: 'Pergunta' }],
  matchingPairs: [{ id: 'p1', left: 'A', right: 'B' }],
  categories: [{ id: 'c1', name: 'Categoria', items: [{ id: 'i1', text: 'Item' }] }],
  baseImage: 'https://x/base.png',
  hotspots: [{ id: 'h1', x: 10, y: 10, title: 'Ponto', content: 'Texto' }],
} as Partial<Block>

function mount(type: Block['type']) {
  render(
    <ContentBlockDrawer
      open
      onOpenChange={jest.fn()}
      mode="edit"
      blockData={{ ...everyListFilled, type }}
      onSave={jest.fn()}
      onCancel={jest.fn()}
    />
  )
  return screen.getByRole('dialog')
}

const classesOf = (root: Element) =>
  [root, ...root.querySelectorAll('*')].flatMap((el) =>
    (el.getAttribute('class') ?? '').split(/\s+/)
  )

it('fills the screen on phones and keeps 480px from sm up', () => {
  const dialog = mount('paragraph')
  const classes = dialog.className.split(/\s+/)
  expect(classes).toContain('w-full')
  expect(classes).toContain('max-w-full!')
  expect(classes).toContain('sm:max-w-[480px]!')
  expect(dialog.className).not.toContain('!w-[480px]')
})

it('never gives an item list its own scroll below sm, for any block type', () => {
  const scopedLists: string[] = []

  for (const type of BLOCK_TYPES) {
    const classes = classesOf(mount(type))
    const unscoped = classes.filter((c) => /^(max-h-\[|overflow-y-auto$)/.test(c))
    const drawerBody = unscoped.filter((c) => c === 'overflow-y-auto').length
    expect({ type, heights: unscoped.filter((c) => c.startsWith('max-h-[')) }).toEqual({
      type,
      heights: [],
    })
    expect({ type, scrollers: drawerBody }).toEqual({ type, scrollers: 1 })
    scopedLists.push(...classes.filter((c) => c.startsWith('sm:max-h-[')))
    cleanup()
  }

  expect(scopedLists.length).toBeGreaterThan(0)
})
