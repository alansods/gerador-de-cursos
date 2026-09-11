import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepMethod } from '@/components/course/new/StepMethod'
import { StepInformation } from '@/components/course/new/StepInformation'
import type { ManualCourseData } from '@/lib/course-validation'

const emptyData: ManualCourseData = {
  titulo: '',
  categoria: '',
  descricao: '',
  cargaHoraria: '',
  modalidade: 'Online',
}

describe('StepMetodo', () => {
  it('expõe os dois métodos como radiogroup', () => {
    render(<StepMethod method={null} onSelect={jest.fn()} />)

    expect(screen.getByRole('radiogroup', { name: 'Método de criação' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('marca o método selecionado com aria-checked', () => {
    render(<StepMethod method="ia" onSelect={jest.fn()} />)

    expect(screen.getByRole('radio', { name: /Gerar por IA/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Criação manual/ })).not.toBeChecked()
  })

  it('seleciona pelo clique', async () => {
    const onSelect = jest.fn()
    render(<StepMethod method={null} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('radio', { name: /Criação manual/ }))

    expect(onSelect).toHaveBeenCalledWith('manual')
  })

  it('navega entre as opções pelas setas', async () => {
    const onSelect = jest.fn()
    render(<StepMethod method="manual" onSelect={onSelect} />)

    const manual = screen.getByRole('radio', { name: /Criação manual/ })
    manual.focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(onSelect).toHaveBeenCalledWith('ia')
  })

  it('mantém um único ponto de tabulação no grupo', () => {
    render(<StepMethod method="ia" onSelect={jest.fn()} />)

    const focusables = screen.getAllByRole('radio').filter((button) => button.tabIndex === 0)

    expect(focusables).toHaveLength(1)
    expect(focusables[0]).toHaveAccessibleName(expect.stringContaining('Gerar por IA'))
  })
})

describe('StepInformacoes', () => {
  function renderComponent(props: Partial<React.ComponentProps<typeof StepInformation>> = {}) {
    return render(
      <StepInformation
        data={emptyData}
        errors={{ titulo: 'Informe o título do curso', categoria: 'Selecione uma categoria' }}
        showError={() => true}
        onChange={jest.fn()}
        onBlur={jest.fn()}
        {...props}
      />
    )
  }

  it('associa a mensagem de erro ao campo', () => {
    renderComponent()

    const title = screen.getByLabelText('Título do curso')
    expect(title).toHaveAttribute('aria-invalid', 'true')
    expect(title).toHaveAccessibleDescription('Informe o título do curso')
  })

  it('move o foco para o primeiro campo inválido ao tentar avançar', () => {
    renderComponent({ submitted: true })

    expect(screen.getByLabelText('Título do curso')).toHaveFocus()
  })

  it('não mexe no foco enquanto o usuário não tentou avançar', () => {
    renderComponent({ submitted: false })

    expect(screen.getByLabelText('Título do curso')).not.toHaveFocus()
  })

  it('navega pelas categorias com as setas', async () => {
    const onChange = jest.fn()
    renderComponent({ data: { ...emptyData, categoria: 'Tecnologia' }, onChange })

    screen.getByRole('radio', { name: 'Tecnologia' }).focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(onChange).toHaveBeenCalledWith('categoria', 'Marketing')
  })

  it('volta para a última categoria com End e Home', async () => {
    const onChange = jest.fn()
    renderComponent({ data: { ...emptyData, categoria: 'Tecnologia' }, onChange })

    screen.getByRole('radio', { name: 'Tecnologia' }).focus()
    await userEvent.keyboard('{End}')

    expect(onChange).toHaveBeenCalledWith('categoria', 'Idiomas')
  })
})
