import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepMetodo } from '@/components/course/novo/StepMetodo'
import { StepInformacoes } from '@/components/course/novo/StepInformacoes'
import type { DadosCursoManual } from '@/lib/validacao-curso'

const dadosVazios: DadosCursoManual = {
  titulo: '',
  categoria: '',
  descricao: '',
  cargaHoraria: '',
  modalidade: 'Online',
}

describe('StepMetodo', () => {
  it('expõe os dois métodos como radiogroup', () => {
    render(<StepMetodo metodo={null} onSelecionar={jest.fn()} />)

    expect(screen.getByRole('radiogroup', { name: 'Método de criação' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('marca o método selecionado com aria-checked', () => {
    render(<StepMetodo metodo="ia" onSelecionar={jest.fn()} />)

    expect(screen.getByRole('radio', { name: /Gerar por IA/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Criação manual/ })).not.toBeChecked()
  })

  it('seleciona pelo clique', async () => {
    const onSelecionar = jest.fn()
    render(<StepMetodo metodo={null} onSelecionar={onSelecionar} />)

    await userEvent.click(screen.getByRole('radio', { name: /Criação manual/ }))

    expect(onSelecionar).toHaveBeenCalledWith('manual')
  })

  it('navega entre as opções pelas setas', async () => {
    const onSelecionar = jest.fn()
    render(<StepMetodo metodo="manual" onSelecionar={onSelecionar} />)

    const manual = screen.getByRole('radio', { name: /Criação manual/ })
    manual.focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(onSelecionar).toHaveBeenCalledWith('ia')
  })

  it('mantém um único ponto de tabulação no grupo', () => {
    render(<StepMetodo metodo="ia" onSelecionar={jest.fn()} />)

    const focaveis = screen.getAllByRole('radio').filter((botao) => botao.tabIndex === 0)

    expect(focaveis).toHaveLength(1)
    expect(focaveis[0]).toHaveAccessibleName(expect.stringContaining('Gerar por IA'))
  })
})

describe('StepInformacoes', () => {
  function renderizar(props: Partial<React.ComponentProps<typeof StepInformacoes>> = {}) {
    return render(
      <StepInformacoes
        dados={dadosVazios}
        erros={{ titulo: 'Informe o título do curso', categoria: 'Selecione uma categoria' }}
        mostrarErro={() => true}
        onAlterar={jest.fn()}
        onBlur={jest.fn()}
        {...props}
      />
    )
  }

  it('associa a mensagem de erro ao campo', () => {
    renderizar()

    const titulo = screen.getByLabelText('Título do curso')
    expect(titulo).toHaveAttribute('aria-invalid', 'true')
    expect(titulo).toHaveAccessibleDescription('Informe o título do curso')
  })

  it('move o foco para o primeiro campo inválido ao tentar avançar', () => {
    renderizar({ enviado: true })

    expect(screen.getByLabelText('Título do curso')).toHaveFocus()
  })

  it('não mexe no foco enquanto o usuário não tentou avançar', () => {
    renderizar({ enviado: false })

    expect(screen.getByLabelText('Título do curso')).not.toHaveFocus()
  })

  it('navega pelas categorias com as setas', async () => {
    const onAlterar = jest.fn()
    renderizar({ dados: { ...dadosVazios, categoria: 'Tecnologia' }, onAlterar })

    screen.getByRole('radio', { name: 'Tecnologia' }).focus()
    await userEvent.keyboard('{ArrowRight}')

    expect(onAlterar).toHaveBeenCalledWith('categoria', 'Marketing')
  })

  it('volta para a última categoria com End e Home', async () => {
    const onAlterar = jest.fn()
    renderizar({ dados: { ...dadosVazios, categoria: 'Tecnologia' }, onAlterar })

    screen.getByRole('radio', { name: 'Tecnologia' }).focus()
    await userEvent.keyboard('{End}')

    expect(onAlterar).toHaveBeenCalledWith('categoria', 'Idiomas')
  })
})
