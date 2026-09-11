import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewCoursePage from '@/app/(app)/courses/new/page'
import { createCourseWithAi, extractDocument } from '@/app/(app)/courses/new/actions'

const mockPush = jest.fn()
const mockBack = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/courses/new',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() },
}))

jest.mock('@/app/(app)/courses/new/actions', () => ({
  extractDocument: jest.fn(),
  createCourseWithAi: jest.fn(),
  downloadSampleDocument: jest.fn(),
}))

const mockCreateCourse = jest.fn()
jest.mock('@/context/CourseEditorContext', () => ({
  useCourseEditor: () => ({ createCourse: mockCreateCourse }),
}))

jest.mock('@/components/PageTransition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockExtract = extractDocument as jest.MockedFunction<typeof extractDocument>
const mockGenerate = createCourseWithAi as jest.MockedFunction<typeof createCourseWithAi>

function docx(name = 'apostila.docx'): File {
  const file = new File(['conteudo'], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  Object.defineProperty(file, 'size', { value: 300 * 1024 })
  return file
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Título do curso'), 'Fundamentos de Automação')
  await user.click(screen.getByRole('radio', { name: 'Tecnologia' }))
  await user.type(
    screen.getByLabelText('Descrição'),
    'Ao final o aluno identifica componentes e configura um CLP básico com segurança.'
  )
  await user.type(screen.getByLabelText('Carga horária'), '40')
}

beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()
  mockCreateCourse.mockResolvedValue('curso-123')
})

describe('Página Novo Curso', () => {
  it('abre na etapa 1 pedindo o método', () => {
    render(<NewCoursePage />)

    expect(screen.getByRole('heading', { name: 'Como você quer começar?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeInTheDocument()
  })

  it('avisa quando tenta continuar sem escolher método', async () => {
    const user = userEvent.setup()
    render(<NewCoursePage />)

    await user.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(await screen.findByText('Selecione um método para continuar')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Como você quer começar?' })).toBeInTheDocument()
  })

  it('percorre as quatro etapas e cria o curso manual', async () => {
    const user = userEvent.setup()
    render(<NewCoursePage />)

    await user.click(screen.getByRole('radio', { name: /Criação manual/ }))
    await user.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(await screen.findByRole('heading', { name: 'Informações do curso' })).toBeInTheDocument()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(
      await screen.findByRole('heading', { name: 'Escolha o layout do curso' })
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(
      await screen.findByRole('heading', { name: 'Revise antes de criar' })
    ).toBeInTheDocument()
    expect(screen.getByText('Fundamentos de Automação')).toBeInTheDocument()
    expect(screen.getByText(/Tecnologia · 40 horas · Online/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Criar curso/ }))

    await waitFor(() =>
      expect(mockCreateCourse).toHaveBeenCalledWith(
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

    await user.click(screen.getByRole('button', { name: 'Abrir no editor' }))

    expect(mockPush).toHaveBeenCalledWith('/courses/curso-123/edit')
  })

  it('bloqueia a etapa de informações enquanto houver campo inválido', async () => {
    const user = userEvent.setup()
    render(<NewCoursePage />)

    await user.click(screen.getByRole('radio', { name: /Criação manual/ }))
    await user.click(screen.getByRole('button', { name: /Continuar/ }))
    await user.click(await screen.findByRole('button', { name: /Continuar/ }))

    expect(
      await screen.findByText('Corrija os campos destacados para continuar')
    ).toBeInTheDocument()
    expect(screen.getByText('Informe o título do curso')).toBeInTheDocument()
    expect(screen.getByText('Selecione uma categoria')).toBeInTheDocument()
    expect(mockCreateCourse).not.toHaveBeenCalled()
  })

  it('lê o documento em segundo plano, sem expor a detecção ao usuário', async () => {
    const user = userEvent.setup()
    mockExtract.mockResolvedValue({
      text: 'QUIZ_INICIO a QUIZ_FIM',
      markers: { found: true, total: 2, byType: { quiz: 2 }, mode: 'markers' },
    })

    const { container } = render(<NewCoursePage />)

    await user.click(screen.getByRole('radio', { name: /Gerar por IA/ }))
    await user.click(screen.getByRole('button', { name: /Continuar/ }))

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, docx())

    expect(await screen.findByText(/pronto para gerar/)).toBeInTheDocument()
    expect(mockExtract).toHaveBeenCalled()
    expect(screen.queryByText(/Marcadores encontrados/)).not.toBeInTheDocument()
    expect(screen.queryByText(/quizzes/)).not.toBeInTheDocument()
    expect(screen.queryByText(/marcadores suportados/)).not.toBeInTheDocument()
  })

  it('gera o curso por IA e mostra o resumo do que foi criado', async () => {
    const user = userEvent.setup()
    mockExtract.mockResolvedValue({
      text: 'texto sem marcador',
      markers: { found: false, total: 0, byType: {}, mode: 'auto' },
    })
    mockGenerate.mockResolvedValue({
      course: { titulo: 'Curso gerado', unidades: [] } as never,
      summary: { units: 3, blocks: 12, byType: { quiz: 2, accordion: 1 }, discarded: [] },
    })

    const { container } = render(<NewCoursePage />)

    await user.click(screen.getByRole('radio', { name: /Gerar por IA/ }))
    await user.click(screen.getByRole('button', { name: /Continuar/ }))
    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, docx())
    await screen.findByText(/pronto para gerar/)

    await user.click(screen.getByRole('button', { name: /Continuar/ }))
    await user.click(await screen.findByRole('button', { name: /Continuar/ }))
    await user.click(await screen.findByRole('button', { name: /Gerar curso/ }))

    expect(await screen.findByRole('heading', { name: 'Curso criado' })).toBeInTheDocument()
    expect(screen.getByText(/3 unidades · 12 blocos · 2 quizzes, 1 accordion/)).toBeInTheDocument()
    expect(mockGenerate).toHaveBeenCalledWith('texto sem marcador')
  })

  it('volta para a etapa do documento quando a geração falha', async () => {
    const user = userEvent.setup()
    mockExtract.mockResolvedValue({
      text: 'texto',
      markers: { found: false, total: 0, byType: {}, mode: 'auto' },
    })
    mockGenerate.mockRejectedValue(new Error('A IA está indisponível no momento'))

    const { container } = render(<NewCoursePage />)

    await user.click(screen.getByRole('radio', { name: /Gerar por IA/ }))
    await user.click(screen.getByRole('button', { name: /Continuar/ }))
    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, docx())
    await screen.findByText(/pronto para gerar/)

    await user.click(screen.getByRole('button', { name: /Continuar/ }))
    await user.click(await screen.findByRole('button', { name: /Continuar/ }))
    await user.click(await screen.findByRole('button', { name: /Gerar curso/ }))

    expect(await screen.findByText('A IA está indisponível no momento')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Envie o documento base' })).toBeInTheDocument()
  })

  it('permite voltar a uma etapa concluída pelo stepper', async () => {
    const user = userEvent.setup()
    render(<NewCoursePage />)

    await user.click(screen.getByRole('radio', { name: /Criação manual/ }))
    await user.click(screen.getByRole('button', { name: /Continuar/ }))
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /Continuar/ }))

    await screen.findByRole('heading', { name: 'Escolha o layout do curso' })
    await user.click(screen.getByRole('button', { name: /Método/ }))

    expect(
      await screen.findByRole('heading', { name: 'Como você quer começar?' })
    ).toBeInTheDocument()
  })
})
