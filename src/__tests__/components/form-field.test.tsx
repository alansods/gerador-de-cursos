import { render, screen } from '@testing-library/react'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'

it('keeps the label and the field in the same gap-2 wrapper', () => {
  const { container } = render(
    <FormField label="Nome do curso">{(props) => <Input {...props} defaultValue="x" />}</FormField>
  )
  const wrapper = container.firstElementChild as HTMLElement
  expect(wrapper.className).toContain('flex flex-col gap-2')
  const label = screen.getByText('Nome do curso')
  const input = container.querySelector('input')!
  expect(label.getAttribute('for')).toBe(input.id)
  expect(input.id).toBeTruthy()
})

it('emits no orphan htmlFor for a field without a render prop', () => {
  const { container } = render(
    <FormField label="Layout do curso">
      <div>seletor</div>
    </FormField>
  )
  expect(container.querySelector('label')!.hasAttribute('for')).toBe(false)
})
