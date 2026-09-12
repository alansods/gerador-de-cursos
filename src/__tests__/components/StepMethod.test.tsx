import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepMethod } from '@/components/course/new/StepMethod'
import { StepInformation } from '@/components/course/new/StepInformation'
import type { ManualCourseData } from '@/lib/course-validation'

const emptyData: ManualCourseData = {
  title: '',
  category: '',
  description: '',
  workload: '',
  modality: 'Online',
}

describe('StepMethod', () => {
  it('exposes both methods as a radiogroup', () => {
    render(<StepMethod method={null} onSelect={jest.fn()} />)

    expect(screen.getByRole('radiogroup', { name: 'Método de criação' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('marks the selected method with aria-checked', () => {
    render(<StepMethod method="ia" onSelect={jest.fn()} />)

    expect(screen.getByRole('radio', { name: /Gerar por IA/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Criação manual/ })).not.toBeChecked()
  })

  it('selects on click', async () => {
    const onSelect = jest.fn()
    render(<StepMethod method={null} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('radio', { name: /Criação manual/ }))

    expect(onSelect).toHaveBeenCalledWith('manual')
  })

  it('moves between the options with the arrow keys', async () => {
    const onSelect = jest.fn()
    render(<StepMethod method="manual" onSelect={onSelect} />)

    const manual = screen.getByRole('radio', { name: /Criação manual/ })
    manual.focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(onSelect).toHaveBeenCalledWith('ia')
  })

  it('keeps a single tab stop in the group', () => {
    render(<StepMethod method="ia" onSelect={jest.fn()} />)

    const focusables = screen.getAllByRole('radio').filter((button) => button.tabIndex === 0)

    expect(focusables).toHaveLength(1)
    expect(focusables[0]).toHaveAccessibleName(expect.stringContaining('Gerar por IA'))
  })
})

describe('StepInformation', () => {
  function renderComponent(props: Partial<React.ComponentProps<typeof StepInformation>> = {}) {
    return render(
      <StepInformation
        data={emptyData}
        errors={{ title: 'Informe o título do curso', category: 'Selecione uma categoria' }}
        showError={() => true}
        onChange={jest.fn()}
        onBlur={jest.fn()}
        {...props}
      />
    )
  }

  it('ties the error message to the field', () => {
    renderComponent()

    const title = screen.getByLabelText('Título do curso')
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveAccessibleDescription('Informe o título do curso')
  })

  it('moves the focus to the first invalid field on an attempt to advance', () => {
    renderComponent({ submitted: true })

    expect(screen.getByLabelText('Título do curso')).toHaveFocus()
  })

  it('leaves the focus alone until the user tries to advance', () => {
    renderComponent({ submitted: false })

    expect(screen.getByLabelText('Título do curso')).not.toHaveFocus()
  })

  it('moves through the categories with the arrow keys', async () => {
    const onChange = jest.fn()
    renderComponent({ data: { ...emptyData, category: 'Tecnologia' }, onChange })

    screen.getByRole('radio', { name: 'Tecnologia' }).focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(onChange).toHaveBeenCalledWith('category', 'Marketing')
  })

  it('jumps to the last and first category with End and Home', async () => {
    const onChange = jest.fn()
    renderComponent({ data: { ...emptyData, category: 'Tecnologia' }, onChange })

    screen.getByRole('radio', { name: 'Tecnologia' }).focus()
    await userEvent.keyboard('{End}')

    expect(onChange).toHaveBeenCalledWith('category', 'Idiomas')
  })
})
