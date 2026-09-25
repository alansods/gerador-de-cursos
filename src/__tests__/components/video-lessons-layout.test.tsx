import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Block, Course, Unit } from '@/types/course'
import { CoursePlayer } from '@/components/course/CoursePlayer'
import { layoutRegistry } from '@/components/course/layouts'
import { completeStep, createEmptyState, encodeSuspendData, hashCourse } from '@/lib/scorm-progress'

beforeAll(() => {
  window.scrollTo = jest.fn()
})

const video = (id: string, extra: Partial<Block> = {}): Block => ({
  id,
  type: 'video',
  content: '',
  order: 0,
  videoTitle: `Aula ${id}`,
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  ...extra,
})

const unit = (id: string, title: string, blocks: Block[], description = ''): Unit => ({
  id,
  title,
  description,
  order: 0,
  blocks,
})

const buildCourse = (extra: Partial<Course> = {}): Course =>
  ({
    id: 'c-video',
    title: 'Fundamentos de .NET',
    description: 'Do primeiro dotnet new a uma API.',
    workload: '40h',
    modality: '',
    category: 'Back-end',
    layout: 'video-lessons',
    bannerVideoUrl: 'https://youtu.be/abcdefghijk',
    objectives: ['Criar uma API', 'Usar o EF Core'],
    units: [
      unit(
        'u1',
        'Primeiros passos',
        [
          video('1', {
            videoTitle: 'O que é o .NET',
            videoDescription: 'Linha um.\nLinha dois.',
          }),
          video('2', { videoTitle: 'Instalando o SDK', videoUrl: '' }),
        ],
        'Instalar o SDK e rodar o primeiro programa.'
      ),
      unit('u2', 'Fundamentos de C#', [video('3', { videoTitle: 'Tipos e variáveis' })]),
      unit('u3', 'Módulo vazio', []),
    ],
    ...extra,
  }) as Course

describe('video lessons layout registration', () => {
  it('is available to the layout selector and only accepts videos', () => {
    const { meta } = layoutRegistry['video-lessons']
    expect(meta.name).toBe('Aulas em vídeo')
    expect(meta.allowedBlockTypes).toEqual(['video'])
  })
})

describe('video lessons intro screen', () => {
  it('shows the hero, the intro video, what you will learn, the modules and the objectives', () => {
    render(<CoursePlayer course={buildCourse()} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Fundamentos de .NET' })).toBeVisible()
    expect(screen.getByText('40h de carga horária')).toBeVisible()
    expect(screen.getAllByText('3 módulos · 3 aulas').length).toBeGreaterThan(0)
    expect(screen.getByTitle('Apresentação do curso')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/abcdefghijk'
    )

    expect(screen.getByRole('heading', { name: 'O que você vai aprender' })).toBeVisible()
    expect(screen.getByText('Instalar o SDK e rodar o primeiro programa.')).toBeVisible()

    expect(screen.getByRole('button', { name: /Primeiros passos/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByRole('button', { name: /O que é o \.NET/ })).toBeVisible()

    expect(screen.getByText('0')).toBeVisible()
    expect(screen.getByText('Criar uma API')).toBeVisible()
    expect(screen.getByText('Usar o EF Core')).toBeVisible()
  })

  it('opens another module in the accordion and says when it has no lessons', async () => {
    const user = userEvent.setup()
    render(<CoursePlayer course={buildCourse()} />)

    await user.click(screen.getByRole('button', { name: /Módulo vazio/ }))

    expect(screen.getByText('Este módulo ainda não tem aulas.')).toBeVisible()
    expect(screen.queryByRole('button', { name: /O que é o \.NET/ })).toBeNull()
  })

  it('fills the width without an intro video and hides empty sections', () => {
    render(
      <CoursePlayer
        course={buildCourse({
          bannerVideoUrl: undefined,
          objectives: [],
          units: [unit('u1', 'Primeiros passos', [video('1')])],
        })}
      />
    )

    expect(screen.queryByTitle('Apresentação do curso')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'O que você vai aprender' })).toBeNull()
    expect(screen.queryByRole('heading', { name: /OBJETIVOS/ })).toBeNull()
  })

  it('has an icon-only menu button with an accessible name', () => {
    render(<CoursePlayer course={buildCourse()} />)

    const header = screen.getByRole('banner')
    expect(within(header).getByRole('button', { name: 'Abrir lista de aulas' })).toBeVisible()
  })
})

interface FakeScorm {
  status: string
  suspendData: string
  location: string
  getLocation: () => string
  setLocation: (value: string) => boolean
  getSuspendData: () => string
  setSuspendData: (value: string) => boolean
  getStatus: () => string
  setStatus: (value: string) => boolean
  setExit: () => boolean
  save: () => boolean
}

const installScorm = (initial: Partial<Pick<FakeScorm, 'suspendData' | 'location'>> = {}) => {
  const scorm: FakeScorm = {
    status: 'not attempted',
    suspendData: initial.suspendData ?? '',
    location: initial.location ?? '',
    getLocation: () => scorm.location,
    setLocation: (value) => ((scorm.location = value), true),
    getSuspendData: () => scorm.suspendData,
    setSuspendData: (value) => ((scorm.suspendData = value), true),
    getStatus: () => scorm.status,
    setStatus: (value) => ((scorm.status = value), true),
    setExit: () => true,
    save: () => true,
  }
  ;(window as unknown as { SCORM?: FakeScorm }).SCORM = scorm
  return scorm
}

afterEach(() => {
  delete (window as unknown as { SCORM?: FakeScorm }).SCORM
})

const lessonHeading = () => screen.getByRole('heading', { level: 1 })
const sidebar = () => screen.getByRole('complementary', { name: 'Aulas do curso' })

describe('video lessons lesson screen', () => {
  it('opens the first lesson with its label, video and description line breaks', async () => {
    const user = userEvent.setup()
    render(<CoursePlayer course={buildCourse()} />)

    await user.click(screen.getByRole('button', { name: /Começar curso/ }))

    expect(lessonHeading()).toHaveTextContent('O que é o .NET')
    expect(screen.getByText('MÓDULO 01 · AULA 01')).toBeVisible()
    expect(screen.getByTitle('O que é o .NET')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    )
    const description = screen.getByText(/Linha um\./)
    expect(description.textContent).toBe('Linha um.\nLinha dois.')
    expect(description).toHaveClass('whitespace-pre-line')
    expect(screen.getByRole('button', { name: 'Aula anterior' })).toBeDisabled()
  })

  it('plays uploaded files in a video tag and shows a placeholder when the video is missing', async () => {
    const user = userEvent.setup()
    const course = buildCourse()
    course.units[0].blocks[0] = video('1', {
      videoTitle: 'O que é o .NET',
      videoUrl: 'https://blob.example.com/aula.mp4',
      videoSource: 'file',
    })
    const { container } = render(<CoursePlayer course={course} />)

    await user.click(screen.getByRole('button', { name: /Começar curso/ }))
    expect(container.querySelector('video')).toHaveAttribute(
      'src',
      'https://blob.example.com/aula.mp4'
    )

    await user.click(screen.getByRole('button', { name: /Próxima aula/ }))
    expect(lessonHeading()).toHaveTextContent('Instalando o SDK')
    expect(screen.getByText('Vídeo ainda não adicionado')).toBeVisible()
  })

  it('marks lessons as done, moves across modules and completes the course', async () => {
    const user = userEvent.setup()
    const scorm = installScorm()
    render(<CoursePlayer course={buildCourse()} />)

    await user.click(screen.getByRole('button', { name: /Começar curso/ }))
    await user.click(screen.getByRole('button', { name: 'Marcar como concluída' }))
    expect(screen.getByRole('button', { name: 'Concluída' })).toBeDisabled()
    expect(screen.getByText('1 de 3 aulas concluídas')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Próxima aula/ }))
    await user.click(screen.getByRole('button', { name: /Próxima aula/ }))

    expect(lessonHeading()).toHaveTextContent('Tipos e variáveis')
    expect(screen.getByText('MÓDULO 02 · AULA 01')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Aula anterior' }))
    expect(lessonHeading()).toHaveTextContent('Instalando o SDK')
    await user.click(screen.getByRole('button', { name: /Próxima aula/ }))

    await user.click(screen.getByRole('button', { name: /Concluir curso/ }))

    expect(screen.getByRole('heading', { level: 1, name: 'Fundamentos de .NET' })).toBeVisible()
    expect(scorm.status).toBe('completed')
  })

  it('lists every lesson with its status in the sidebar and navigates from it', async () => {
    const user = userEvent.setup()
    render(<CoursePlayer course={buildCourse()} />)

    await user.click(screen.getByRole('button', { name: /Começar curso/ }))
    await user.click(screen.getByRole('button', { name: 'Marcar como concluída' }))

    const list = within(sidebar())
    expect(list.getByText('1 de 2 aulas concluídas')).toBeInTheDocument()
    expect(
      within(list.getByRole('button', { name: /O que é o \.NET/ })).getByText('Concluída')
    ).toBeInTheDocument()

    await user.click(list.getByRole('button', { name: /Instalando o SDK/ }))
    expect(lessonHeading()).toHaveTextContent('Instalando o SDK')
    expect(within(sidebar()).getByRole('button', { name: /Instalando o SDK/ })).toHaveAttribute(
      'aria-current',
      'step'
    )

    await user.click(within(sidebar()).getByRole('button', { name: /Fundamentos de C#/ }))
    await user.click(within(sidebar()).getByRole('button', { name: /Tipos e variáveis/ }))
    expect(lessonHeading()).toHaveTextContent('Tipos e variáveis')
  })

  it('resumes the saved module on its first pending lesson', () => {
    const course = buildCourse()
    const saved = completeStep(createEmptyState(course.units.length), 0, 0)
    installScorm({
      location: 'u1',
      suspendData: encodeSuspendData(saved, hashCourse({ id: course.id!, units: course.units })),
    })

    render(<CoursePlayer course={course} />)

    expect(lessonHeading()).toHaveTextContent('Instalando o SDK')
    expect(screen.getByText('1 de 3 aulas concluídas')).toBeInTheDocument()
  })
})
