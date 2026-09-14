import { render, screen } from '@testing-library/react'
import { SortableBlockWrapper } from '@/components/SortableBlockWrapper'
import { EditableCard } from '@/components/EditableCard'
import { UnitsList } from '@/components/UnitsList'
import { Unit } from '@/types/course'

const units: Unit[] = [
  { id: 'u1', title: 'Unit one', order: 0, blocks: [] },
  { id: 'u2', title: 'Unit two', order: 1, blocks: [] },
]

it('gives the block drag handle touch-action none so a touch drag is not stolen by scroll', () => {
  render(
    <SortableBlockWrapper id="b1">{(dragHandle) => <div>{dragHandle}</div>}</SortableBlockWrapper>
  )
  const handle = screen.getByLabelText('Arrastar para reordenar')
  expect(handle.className).toContain('touch-none')
})

it('gives every unit drag handle touch-action none', () => {
  const { container } = render(
    <UnitsList
      units={units}
      onReorder={() => {}}
      onAdd={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
    />
  )
  const handles = container.querySelectorAll('.cursor-grab')
  expect(handles).toHaveLength(units.length)
  handles.forEach((handle) => expect(handle.className).toContain('touch-none'))
})

it('keeps the card label and actions visible on devices without hover', () => {
  const { container } = render(
    <EditableCard label="Parágrafo" actions={<button>editar</button>}>
      conteúdo
    </EditableCard>
  )
  const hoverOnly = container.querySelectorAll('.group-hover\\:opacity-100')
  expect(hoverOnly).toHaveLength(2)
  hoverOnly.forEach((el) => expect(el.className).toContain('no-hover:opacity-100'))
})
