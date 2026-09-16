import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NewCoursePage from '@/app/(app)/courses/new/page'
import { extractDocument } from '@/app/(app)/courses/new/actions'

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
  downloadSampleDocument: jest.fn(),
}))

const mockCreateCourse = jest.fn()
jest.mock('@/context/CourseEditorContext', () => ({
  useCourseEditor: () => ({ createCourse: mockCreateCourse }),
}))

const mockStartGeneration = jest.fn()
jest.mock('@/hooks/queries/useGenerationJobsQuery', () => ({
  useStartGenerationMutation: () => ({ mutateAsync: mockStartGeneration }),
}))

const mockShowGenerating = jest.fn()
jest.mock('@/context/GenerationBannerContext', () => ({
  useGenerationBanners: () => ({ showGenerating: mockShowGenerating }),
}))

jest.mock('@/components/PageTransition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockExtract = extractDocument as jest.MockedFunction<typeof extractDocument>

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

describe('New Course page', () => {
  it('opens on step 1 asking for the method', () => {
    render(<NewCoursePage />)

    expect(screen.getByRole('heading', { name: 'Como você quer começar?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeInTheDocument()
  })

  it('warns when continuing without a method', async () => {
    const user = userEvent.setup()
    render(<NewCoursePage />)

    await user.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(await screen.findByText('Selecione um método para continuar')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Como você quer começar?' })).toBeInTheDocument()
  })

  it('walks the four steps and creates the manual course', async () => {
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
          title: 'Fundamentos de Automação',
          category: 'Tecnologia',
          workload: '40 horas',
          modality: 'Online',
          layout: 'classic',
          units: [],
        })
      )
    )

    expect(await screen.findByRole('heading', { name: 'Curso criado' })).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Abrir no editor' }))

    expect(mockPush).toHaveBeenCalledWith('/courses/curso-123/edit')
  })

  it('blocks the information step while a field is invalid', async () => {
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

  it('reads the document in the background, without exposing the detection', async () => {
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

  it('starts the generation in the background and goes back to the course list', async () => {
    const user = userEvent.setup()
    mockExtract.mockResolvedValue({
      text: 'texto sem marcador',
      markers: { found: false, total: 0, byType: {}, mode: 'auto' },
    })
    let finishStart: (value: unknown) => void = () => {}
    mockStartGeneration.mockReturnValue(
      new Promise((resolve) => {
        finishStart = resolve
      })
    )

    const { container } = render(<NewCoursePage />)

    await user.click(screen.getByRole('radio', { name: /Gerar por IA/ }))
    await user.click(screen.getByRole('button', { name: /Continuar/ }))
    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, docx())
    await screen.findByText(/pronto para gerar/)

    await user.click(screen.getByRole('button', { name: /Continuar/ }))
    await user.click(await screen.findByRole('button', { name: /Continuar/ }))

    expect(
      await screen.findByText(
        'A geração roda em segundo plano: você volta para a lista e pode seguir usando o app.'
      )
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Gerar curso/ }))

    expect(screen.getByRole('button', { name: /Gerar curso/ })).toBeDisabled()
    expect(screen.queryByRole('status', { name: /Gerando seu curso/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Gerando seu curso com IA')).not.toBeInTheDocument()

    await act(async () =>
      finishStart({ jobId: 'job-1', courseId: 'course-1', fileName: 'apostila.docx' })
    )

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/courses'))
    expect(screen.queryByText('Gerando seu curso com IA')).not.toBeInTheDocument()
    expect(mockStartGeneration).toHaveBeenCalledWith({
      text: 'texto sem marcador',
      fileName: 'apostila.docx',
      layout: 'classic',
    })
    expect(mockShowGenerating).toHaveBeenCalledWith({
      jobId: 'job-1',
      courseId: 'course-1',
      fileName: 'apostila.docx',
    })
    expect(mockCreateCourse).not.toHaveBeenCalled()
  })

  it('returns to the document step when the generation cannot start', async () => {
    const user = userEvent.setup()
    mockExtract.mockResolvedValue({
      text: 'texto',
      markers: { found: false, total: 0, byType: {}, mode: 'auto' },
    })
    mockStartGeneration.mockRejectedValue(new Error('API de IA não configurada'))

    const { container } = render(<NewCoursePage />)

    await user.click(screen.getByRole('radio', { name: /Gerar por IA/ }))
    await user.click(screen.getByRole('button', { name: /Continuar/ }))
    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, docx())
    await screen.findByText(/pronto para gerar/)

    await user.click(screen.getByRole('button', { name: /Continuar/ }))
    await user.click(await screen.findByRole('button', { name: /Continuar/ }))
    await user.click(await screen.findByRole('button', { name: /Gerar curso/ }))

    expect(await screen.findByText('API de IA não configurada')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Envie o documento base' })).toBeInTheDocument()
  })

  it('allows going back to a finished step through the stepper', async () => {
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
