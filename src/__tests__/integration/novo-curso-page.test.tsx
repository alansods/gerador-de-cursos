import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NovoCursoPage from '@/app/(app)/cursos/novo/page'
import { criarCursoPorIA, extrairDocumento } from '@/app/(app)/cursos/novo/actions'

const mockPush = jest.fn()
const mockBack = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/cursos/novo',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() },
}))

jest.mock('@/app/(app)/cursos/novo/actions', () => ({
  extrairDocumento: jest.fn(),
  criarCursoPorIA: jest.fn(),
  baixarDocumentoExemplo: jest.fn(),
}))

const mockCriarCurso = jest.fn()
jest.mock('@/context/GeradorCursoContext', () => ({
  useGeradorCurso: () => ({ criarCurso: mockCriarCurso }),
}))

jest.mock('@/components/PageTransition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockExtrair = extrairDocumento as jest.MockedFunction<typeof extrairDocumento>
const mockGerar = criarCursoPorIA as jest.MockedFunction<typeof criarCursoPorIA>

function docx(nome = 'apostila.docx'): File {
  const arquivo = new File(['conteudo'], nome, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  Object.defineProperty(arquivo, 'size', { value: 300 * 1024 })
  return arquivo
}

async function preencherFormulario(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText('Título do curso'), 'Fundamentos de Automação')
  await usuario.click(screen.getByRole('radio', { name: 'Tecnologia' }))
  await usuario.type(
    screen.getByLabelText('Descrição'),
    'Ao final o aluno identifica componentes e configura um CLP básico com segurança.'
  )
  await usuario.type(screen.getByLabelText('Carga horária'), '40')
}

beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()
  mockCriarCurso.mockResolvedValue('curso-123')
})

describe('Página Novo Curso', () => {
  it('abre na etapa 1 pedindo o método', () => {
    render(<NovoCursoPage />)

    expect(screen.getByRole('heading', { name: 'Como você quer começar?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeInTheDocument()
  })

  it('avisa quando tenta continuar sem escolher método', async () => {
    const usuario = userEvent.setup()
    render(<NovoCursoPage />)

    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(await screen.findByText('Selecione um método para continuar')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Como você quer começar?' })).toBeInTheDocument()
  })

  it('percorre as quatro etapas e cria o curso manual', async () => {
    const usuario = userEvent.setup()
    render(<NovoCursoPage />)

    await usuario.click(screen.getByRole('radio', { name: /Criação manual/ }))
    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(await screen.findByRole('heading', { name: 'Informações do curso' })).toBeInTheDocument()
    await preencherFormulario(usuario)
    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(
      await screen.findByRole('heading', { name: 'Escolha o layout do curso' })
    ).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(
      await screen.findByRole('heading', { name: 'Revise antes de criar' })
    ).toBeInTheDocument()
    expect(screen.getByText('Fundamentos de Automação')).toBeInTheDocument()
    expect(screen.getByText(/Tecnologia · 40 horas · Online/)).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /Criar curso/ }))

    await waitFor(() =>
      expect(mockCriarCurso).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Fundamentos de Automação',
          categoria: 'Tecnologia',
          cargaHoraria: '40 horas',
          modalidade: 'Online',
          layout: 'classico',
          unidades: [],
        })
      )
    )

    expect(await screen.findByRole('heading', { name: 'Curso criado' })).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()

    await usuario.click(screen.getByRole('button', { name: 'Abrir no editor' }))

    expect(mockPush).toHaveBeenCalledWith('/cursos/curso-123/editar')
  })

  it('bloqueia a etapa de informações enquanto houver campo inválido', async () => {
    const usuario = userEvent.setup()
    render(<NovoCursoPage />)

    await usuario.click(screen.getByRole('radio', { name: /Criação manual/ }))
    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))
    await usuario.click(await screen.findByRole('button', { name: /Continuar/ }))

    expect(
      await screen.findByText('Corrija os campos destacados para continuar')
    ).toBeInTheDocument()
    expect(screen.getByText('Informe o título do curso')).toBeInTheDocument()
    expect(screen.getByText('Selecione uma categoria')).toBeInTheDocument()
    expect(mockCriarCurso).not.toHaveBeenCalled()
  })

  it('lê o documento em segundo plano, sem expor a detecção ao usuário', async () => {
    const usuario = userEvent.setup()
    mockExtrair.mockResolvedValue({
      text: 'QUIZ_INICIO a QUIZ_FIM',
      marcadores: { encontrados: true, total: 2, porTipo: { quiz: 2 }, modo: 'markers' },
    })

    const { container } = render(<NovoCursoPage />)

    await usuario.click(screen.getByRole('radio', { name: /Gerar por IA/ }))
    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await usuario.upload(input, docx())

    expect(await screen.findByText(/pronto para gerar/)).toBeInTheDocument()
    expect(mockExtrair).toHaveBeenCalled()
    expect(screen.queryByText(/Marcadores encontrados/)).not.toBeInTheDocument()
    expect(screen.queryByText(/quizzes/)).not.toBeInTheDocument()
    expect(screen.queryByText(/marcadores suportados/)).not.toBeInTheDocument()
  })

  it('gera o curso por IA e mostra o resumo do que foi criado', async () => {
    const usuario = userEvent.setup()
    mockExtrair.mockResolvedValue({
      text: 'texto sem marcador',
      marcadores: { encontrados: false, total: 0, porTipo: {}, modo: 'auto' },
    })
    mockGerar.mockResolvedValue({
      course: { titulo: 'Curso gerado', unidades: [] } as never,
      resumo: { unidades: 3, blocos: 12, porTipo: { quiz: 2, accordion: 1 }, descartados: [] },
    })

    const { container } = render(<NovoCursoPage />)

    await usuario.click(screen.getByRole('radio', { name: /Gerar por IA/ }))
    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))
    await usuario.upload(container.querySelector('input[type="file"]') as HTMLInputElement, docx())
    await screen.findByText(/pronto para gerar/)

    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))
    await usuario.click(await screen.findByRole('button', { name: /Continuar/ }))
    await usuario.click(await screen.findByRole('button', { name: /Gerar curso/ }))

    expect(await screen.findByRole('heading', { name: 'Curso criado' })).toBeInTheDocument()
    expect(screen.getByText(/3 unidades · 12 blocos · 2 quizzes, 1 accordion/)).toBeInTheDocument()
    expect(mockGerar).toHaveBeenCalledWith('texto sem marcador')
  })

  it('volta para a etapa do documento quando a geração falha', async () => {
    const usuario = userEvent.setup()
    mockExtrair.mockResolvedValue({
      text: 'texto',
      marcadores: { encontrados: false, total: 0, porTipo: {}, modo: 'auto' },
    })
    mockGerar.mockRejectedValue(new Error('A IA está indisponível no momento'))

    const { container } = render(<NovoCursoPage />)

    await usuario.click(screen.getByRole('radio', { name: /Gerar por IA/ }))
    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))
    await usuario.upload(container.querySelector('input[type="file"]') as HTMLInputElement, docx())
    await screen.findByText(/pronto para gerar/)

    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))
    await usuario.click(await screen.findByRole('button', { name: /Continuar/ }))
    await usuario.click(await screen.findByRole('button', { name: /Gerar curso/ }))

    expect(await screen.findByText('A IA está indisponível no momento')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Envie o documento base' })).toBeInTheDocument()
  })

  it('permite voltar a uma etapa concluída pelo stepper', async () => {
    const usuario = userEvent.setup()
    render(<NovoCursoPage />)

    await usuario.click(screen.getByRole('radio', { name: /Criação manual/ }))
    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))
    await preencherFormulario(usuario)
    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))

    await screen.findByRole('heading', { name: 'Escolha o layout do curso' })
    await usuario.click(screen.getByRole('button', { name: /Método/ }))

    expect(
      await screen.findByRole('heading', { name: 'Como você quer começar?' })
    ).toBeInTheDocument()
  })
})
