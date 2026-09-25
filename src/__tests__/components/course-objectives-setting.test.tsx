import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CourseSettingsDrawer } from '@/components/CourseSettingsDrawer'

jest.mock('@/components/collaboration/ManageCollaborators', () => ({
  ManageCollaborators: () => null,
}))

jest.mock('@/components/course/LayoutSelector', () => ({
  LayoutSelector: () => null,
}))

function openDrawer(layout: string, objectives: string[] = [], onSave = jest.fn()) {
  const view = render(
    <CourseSettingsDrawer
      open
      onOpenChange={jest.fn()}
      courseData={{
        title: 'Fundamentos de .NET',
        description: 'APIs com ASP.NET Core',
        workload: '20 horas',
        layout,
        objectives,
      }}
      units={[]}
      onSave={onSave}
    />
  )
  return { onSave, ...view }
}

describe('course objectives setting', () => {
  it('shows the notice and the objectives only in the video lessons layout', () => {
    openDrawer('classic')

    expect(screen.queryByText(/No layout Aulas em vídeo/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Adicionar objetivo/ })).toBeNull()
  })

  it('saves the objectives cleaned and reopens them as saved', async () => {
    const user = userEvent.setup()
    const { onSave, unmount } = openDrawer('video-lessons')

    expect(screen.getByText(/No layout Aulas em vídeo/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Adicionar objetivo/ }))
    await user.type(screen.getByLabelText('Objetivo 1'), '  Criar uma API  ')
    await user.click(screen.getByRole('button', { name: /Adicionar objetivo/ }))
    await user.click(screen.getByRole('button', { name: /Adicionar objetivo/ }))
    await user.type(screen.getByLabelText('Objetivo 3'), 'Publicar no Azure')
    await user.click(screen.getByRole('button', { name: 'Remover objetivo 3' }))
    await user.click(screen.getByRole('button', { name: /Adicionar objetivo/ }))
    await user.type(screen.getByLabelText('Objetivo 3'), 'Testar com xUnit')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    const saved = onSave.mock.calls[0][0].objectives
    expect(saved).toEqual(['Criar uma API', 'Testar com xUnit'])

    unmount()
    openDrawer('video-lessons', saved)
    expect(screen.getByLabelText('Objetivo 1')).toHaveValue('Criar uma API')
    expect(screen.getByLabelText('Objetivo 2')).toHaveValue('Testar com xUnit')
  })

  it('stops adding objectives at the limit', () => {
    openDrawer(
      'video-lessons',
      Array.from({ length: 8 }, (_, i) => `Objetivo ${i + 1}`)
    )

    expect(screen.getByRole('button', { name: /Adicionar objetivo/ })).toBeDisabled()
  })
})
