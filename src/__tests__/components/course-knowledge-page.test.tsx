import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import CourseKnowledgePage from '@/app/(app)/courses/[id]/knowledge/page'
import coursesMessages from '@/i18n/locales/pt-BR/courses.json'
import { useCourseQuery } from '@/hooks/queries/useCourseQuery'
import {
  useDeleteKnowledgeMutation,
  useKnowledgeQuery,
  useUploadKnowledgeMutation,
} from '@/hooks/queries/useTutorQuery'

jest.mock('next/navigation', () => ({ useParams: () => ({ id: 'curso-1' }) }))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn() } }))
jest.mock('@/hooks/queries/useCourseQuery', () => ({ useCourseQuery: jest.fn() }))
jest.mock('@/hooks/queries/useTutorQuery', () => ({
  useKnowledgeQuery: jest.fn(),
  useUploadKnowledgeMutation: jest.fn(),
  useDeleteKnowledgeMutation: jest.fn(),
}))

const upload = { mutateAsync: jest.fn().mockResolvedValue({ warning: null }), isPending: false }
const remove = { mutateAsync: jest.fn().mockResolvedValue(undefined), isPending: false }

const sources = [
  {
    id: 'src-course',
    kind: 'COURSE',
    name: 'Conteúdo do curso',
    chunkCount: 4,
    createdAt: '2026-09-19T10:00:00Z',
    updatedAt: '2026-09-19T10:00:00Z',
  },
  {
    id: 'src-doc',
    kind: 'DOCUMENT',
    name: 'apostila.docx',
    chunkCount: 1,
    createdAt: '2026-09-19T10:00:00Z',
    updatedAt: '2026-09-19T10:00:00Z',
  },
]

function renderPage({ canManage = true, tutorEnabled = true } = {}) {
  ;(useCourseQuery as jest.Mock).mockReturnValue({ course: { title: 'Segurança', tutorEnabled } })
  ;(useKnowledgeQuery as jest.Mock).mockReturnValue({
    sources,
    canManage,
    loading: false,
    error: null,
  })
  ;(useUploadKnowledgeMutation as jest.Mock).mockReturnValue(upload)
  ;(useDeleteKnowledgeMutation as jest.Mock).mockReturnValue(remove)

  render(
    <NextIntlClientProvider locale="pt-BR" messages={{ courses: coursesMessages }} timeZone="UTC">
      <CourseKnowledgePage />
    </NextIntlClientProvider>
  )
}

beforeEach(() => jest.clearAllMocks())

describe('course knowledge page', () => {
  it('lists the course content and the documents with their passage counts', () => {
    renderPage()

    expect(screen.getByText('Conteúdo do curso')).toBeInTheDocument()
    expect(screen.getByText('apostila.docx')).toBeInTheDocument()
    expect(screen.getByText(/4 trechos/)).toBeInTheDocument()
    expect(screen.getByText(/1 trecho ·/)).toBeInTheDocument()
  })

  it('uploads the chosen .docx', async () => {
    renderPage()
    const file = new File(['x'], 'nova.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    await userEvent.upload(screen.getByLabelText('Escolher arquivo'), file)

    expect(upload.mutateAsync).toHaveBeenCalledWith(file)
  })

  it('deletes a document but never the course content source', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()

    expect(screen.queryByRole('button', { name: 'Excluir Conteúdo do curso' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir apostila.docx' }))

    expect(remove.mutateAsync).toHaveBeenCalledWith('src-doc')
  })

  it('shows only the list to someone who cannot manage it', () => {
    renderPage({ canManage: false })

    expect(screen.queryByLabelText('Escolher arquivo')).toBeNull()
    expect(screen.queryByRole('button', { name: /Excluir/ })).toBeNull()
    expect(screen.getByText(/Só o dono do curso/)).toBeInTheDocument()
    expect(screen.getByText('apostila.docx')).toBeInTheDocument()
  })

  it('warns when the tutor is off for the course', () => {
    renderPage({ tutorEnabled: false })

    expect(screen.getByText(/O Tutor IA está desligado neste curso/)).toBeInTheDocument()
  })
})
