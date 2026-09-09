import { render, screen } from '@testing-library/react'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'

it('label e campo ficam no mesmo wrapper gap-2', () => {
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

it('campo sem render prop nao emite htmlFor orfao', () => {
  const { container } = render(
    <FormField label="Layout do curso">
      <div>seletor</div>
    </FormField>
  )
  expect(container.querySelector('label')!.hasAttribute('for')).toBe(false)
})
