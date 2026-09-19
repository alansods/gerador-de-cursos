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

function openDrawer({ tutorEnabled = false, canManageTutor = true } = {}) {
  const onSave = jest.fn()
  render(
    <CourseSettingsDrawer
      open
      onOpenChange={jest.fn()}
      canManageTutor={canManageTutor}
      courseData={{
        title: 'Segurança do Trabalho',
        description: 'EPI e EPC',
        category: 'Segurança',
        workload: '20 horas',
        layout: 'classic',
        tutorEnabled,
      }}
      units={[]}
      onSave={onSave}
    />
  )
  return onSave
}

describe('Tutor IA setting', () => {
  it('starts off and saves the tutor turned on', async () => {
    const onSave = openDrawer()
    const toggle = screen.getByRole('checkbox', { name: 'Tutor IA' })

    expect(toggle).not.toBeChecked()
    await userEvent.click(toggle)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ tutorEnabled: true }), [])
  })

  it('warns that turning it on sends the course text to Gemini', () => {
    openDrawer()

    expect(screen.getByText(/o texto do curso é enviado ao Gemini/)).toBeInTheDocument()
  })

  it('warns that turning it off cuts off the packages already exported', async () => {
    openDrawer({ tutorEnabled: true })
    const warning = /pacotes SCORM já exportados param de responder/

    expect(screen.queryByText(warning)).toBeNull()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Tutor IA' }))

    expect(screen.getByText(warning)).toBeInTheDocument()
  })

  it('is disabled for someone who cannot manage the tutor', () => {
    openDrawer({ tutorEnabled: true, canManageTutor: false })

    const toggle = screen.getByRole('checkbox', { name: 'Tutor IA' })
    expect(toggle).toBeChecked()
    expect(toggle).toBeDisabled()
    expect(screen.getByText(/Só o dono do curso, os colaboradores/)).toBeInTheDocument()
  })
})
