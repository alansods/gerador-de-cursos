import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CourseSettingsDrawer } from '@/components/CourseSettingsDrawer'
import { ClassicHome } from '@/components/course/layouts/classic/ClassicHome'
import type { Course } from '@/types/course'

jest.mock('@/components/collaboration/ManageCollaborators', () => ({
  ManageCollaborators: () => null,
}))

jest.mock('@/components/course/LayoutSelector', () => ({
  LayoutSelector: () => null,
}))

const baseCourse: Course = {
  id: 'curso-1',
  title: 'Fundamentos de Cozinha Italiana',
  description: 'Massas frescas, molhos-mãe e risotos clássicos.',
  workload: '20 horas',
  modality: 'Presencial',
  category: 'Gastronomia',
  layout: 'classic',
  createdAt: new Date(),
  updatedAt: new Date(),
  units: [],
}

function openDrawer(bannerVideoUrl = '', onSave = jest.fn()) {
  render(
    <CourseSettingsDrawer
      open
      onOpenChange={jest.fn()}
      courseData={{
        title: baseCourse.title,
        description: baseCourse.description,
        category: baseCourse.category,
        workload: baseCourse.workload,
        layout: 'classic',
        bannerVideoUrl,
      }}
      units={[]}
      onSave={onSave}
    />
  )
  return onSave
}

describe('banner video field', () => {
  it('saves a valid link pasted by the author', async () => {
    const onSave = openDrawer()
    const field = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...')

    await userEvent.type(field, 'https://youtu.be/dQw4w9WgXcQ')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ bannerVideoUrl: 'https://youtu.be/dQw4w9WgXcQ' }),
      []
    )
  })

  it('blocks the save and warns when the link is not from YouTube', async () => {
    const onSave = openDrawer()

    await userEvent.type(
      screen.getByPlaceholderText('https://www.youtube.com/watch?v=...'),
      'https://vimeo.com/123456'
    )

    expect(screen.getByText('Link do YouTube inválido')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows the preview when the link is valid', async () => {
    openDrawer()
    expect(document.querySelector('iframe')).toBeNull()

    await userEvent.type(
      screen.getByPlaceholderText('https://www.youtube.com/watch?v=...'),
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLPli'
    )

    expect(document.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    )
  })

  it('shows no preview for an invalid link', async () => {
    openDrawer()

    await userEvent.type(
      screen.getByPlaceholderText('https://www.youtube.com/watch?v=...'),
      'https://vimeo.com/123456'
    )

    expect(document.querySelector('iframe')).toBeNull()
  })

  it('lets the field be cleared to drop the video', async () => {
    const onSave = openDrawer('https://youtu.be/dQw4w9WgXcQ')

    await userEvent.clear(screen.getByPlaceholderText('https://www.youtube.com/watch?v=...'))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ bannerVideoUrl: '' }), [])
  })
})

describe('classic layout banner', () => {
  it('renders no iframe when the course has no video', () => {
    const { container } = render(<ClassicHome course={baseCourse} onNavigate={jest.fn()} />)
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('embeds the YouTube video when the course has a link', () => {
    const { container } = render(
      <ClassicHome
        course={{ ...baseCourse, bannerVideoUrl: 'https://youtu.be/dQw4w9WgXcQ' }}
        onNavigate={jest.fn()}
      />
    )

    const iframe = container.querySelector('iframe')
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
    expect(iframe).toHaveAttribute('title', baseCourse.title)
  })

  it('ignores a non-YouTube link instead of embedding an invalid url', () => {
    const { container } = render(
      <ClassicHome
        course={{ ...baseCourse, bannerVideoUrl: 'https://vimeo.com/123456' }}
        onNavigate={jest.fn()}
      />
    )
    expect(container.querySelector('iframe')).toBeNull()
  })
})
