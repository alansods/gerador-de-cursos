import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Block, Course, Unit } from '@/types/course'
import { CoursePlayer } from '@/components/course/CoursePlayer'
import { layoutRegistry } from '@/components/course/layouts'

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
