import '@testing-library/jest-dom'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import CourseKnowledgePage from '@/app/(app)/courses/[id]/knowledge/page'
import coursesMessages from '@/i18n/locales/pt-BR/courses.json'
import { useCourseQuery } from '@/hooks/queries/useCourseQuery'
import {
  useDeleteKnowledgeMutation,
  useDocumentPreviewQuery,
  useKnowledgeQuery,
  useUploadKnowledgeMutation,
} from '@/hooks/queries/useTutorQuery'

jest.mock('next/navigation', () => ({ useParams: () => ({ id: 'seguranca-do-trabalho' }) }))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn() } }))
jest.mock('@/hooks/queries/useCourseQuery', () => ({ useCourseQuery: jest.fn() }))
jest.mock('@/hooks/queries/useTutorQuery', () => ({
  ...jest.requireActual('@/hooks/queries/useTutorQuery'),
  useKnowledgeQuery: jest.fn(),
  useUploadKnowledgeMutation: jest.fn(),
  useDeleteKnowledgeMutation: jest.fn(),
  useDocumentPreviewQuery: jest.fn(),
}))

const upload = { mutateAsync: jest.fn().mockResolvedValue({ warning: null }), isPending: false }
const remove = { mutateAsync: jest.fn().mockResolvedValue(undefined), isPending: false }

const sources = [
  {
    id: 'src-course',
    kind: 'COURSE',
    name: 'Conteúdo do curso',
    chunkCount: 4,
    filePathname: null,
    contentType: null,
    fileSize: null,
    createdAt: '2026-09-19T10:00:00Z',
    updatedAt: '2026-09-19T10:00:00Z',
  },
  {
    id: 'src-pdf',
    kind: 'DOCUMENT',
    name: 'apostila.pdf',
    chunkCount: 12,
    filePathname: 'courses/curso-1/apostila-x1.pdf',
    contentType: 'application/pdf',
    fileSize: 2 * 1024 * 1024,
    createdAt: '2026-09-19T10:00:00Z',
    updatedAt: '2026-09-19T10:00:00Z',
  },
]

function renderPage({ canManage = true, tutorEnabled = true, items = sources } = {}) {
  ;(useCourseQuery as jest.Mock).mockReturnValue({
    course: { id: 'curso-1', slug: 'seguranca-do-trabalho', title: 'Segurança', tutorEnabled },
  })
  ;(useKnowledgeQuery as jest.Mock).mockReturnValue({
    sources: items,
    canManage,
    loading: false,
    error: null,
  })
  ;(useUploadKnowledgeMutation as jest.Mock).mockReturnValue(upload)
  ;(useDeleteKnowledgeMutation as jest.Mock).mockReturnValue(remove)
  ;(useDocumentPreviewQuery as jest.Mock).mockImplementation((_courseId, sourceId) =>
    sourceId
      ? { isPending: false, isError: false, data: { kind: 'pdf', url: 'https://signed/apostila' } }
      : { isPending: true, isError: false, data: undefined }
  )

  render(
    <NextIntlClientProvider locale="pt-BR" messages={{ courses: coursesMessages }} timeZone="UTC">
      <CourseKnowledgePage />
    </NextIntlClientProvider>
  )
}

function rowOf(text: string) {
  return screen.getByText(text).closest('tr') as HTMLElement
}

beforeEach(() => jest.clearAllMocks())

describe('course knowledge page', () => {
  it('opens by the course slug and talks to the API with the course id', () => {
    renderPage()

    expect(useCourseQuery).toHaveBeenCalledWith('seguranca-do-trabalho')
    expect(useKnowledgeQuery).toHaveBeenCalledWith('curso-1')
    expect(screen.getByRole('link', { name: /Voltar ao editor/ })).toHaveAttribute(
      'href',
      '/courses/seguranca-do-trabalho/edit'
    )
  })

  it('shows the uploaded documents in a table with type, passages and file size', () => {
    renderPage()

    expect(screen.getByRole('columnheader', { name: 'Trechos' })).toBeInTheDocument()
    const pdfRow = rowOf('apostila.pdf')
    expect(within(pdfRow).getByText('12')).toBeInTheDocument()
    expect(within(pdfRow).getByText('2 MB')).toBeInTheDocument()
    expect(within(pdfRow).getByText('PDF')).toBeInTheDocument()
  })

  it('leaves the course content out of the table', () => {
    renderPage()

    expect(screen.queryByText('Conteúdo do curso')).toBeNull()
    expect(screen.getAllByRole('row')).toHaveLength(2)
  })

  it('shows the empty state when only the course content is indexed', () => {
    renderPage({ items: sources.filter((source) => source.kind === 'COURSE') })

    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByText(/Nenhum documento enviado/)).toBeInTheDocument()
  })

  it('uploads the chosen file', async () => {
    renderPage()
    const file = new File(['x'], 'nova.pdf', { type: 'application/pdf' })

    await userEvent.upload(screen.getByLabelText('Escolher arquivo'), file)

    expect(upload.mutateAsync).toHaveBeenCalledWith(file)
  })

  it('opens the document in a modal and offers the download', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Visualizar apostila.pdf' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByTitle('apostila.pdf')).toHaveAttribute(
      'src',
      'https://signed/apostila'
    )
    expect(within(dialog).getByRole('link', { name: /Baixar/ })).toHaveAttribute(
      'href',
      '/api/courses/curso-1/knowledge/src-pdf/file?mode=download'
    )
  })

  it('offers download and delete on each document', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()

    expect(screen.getByRole('link', { name: 'Baixar apostila.pdf' })).toHaveAttribute(
      'href',
      '/api/courses/curso-1/knowledge/src-pdf/file?mode=download'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Excluir apostila.pdf' }))
    expect(remove.mutateAsync).toHaveBeenCalledWith('src-pdf')
  })

  it('lets someone who cannot manage view and download, but not add or delete', () => {
    renderPage({ canManage: false })

    expect(screen.queryByLabelText('Escolher arquivo')).toBeNull()
    expect(screen.queryByRole('button', { name: /Excluir/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Visualizar apostila.pdf' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Baixar apostila.pdf' })).toBeInTheDocument()
    expect(screen.getByText(/Só o dono do curso/)).toBeInTheDocument()
  })

  it('shows only the load error, not the read-only notice, when the list fails', () => {
    renderPage()
    ;(useKnowledgeQuery as jest.Mock).mockReturnValue({
      sources: [],
      canManage: false,
      loading: false,
      error: new Error('relation "knowledge_sources" does not exist'),
    })
    cleanup()
    render(
      <NextIntlClientProvider locale="pt-BR" messages={{ courses: coursesMessages }} timeZone="UTC">
        <CourseKnowledgePage />
      </NextIntlClientProvider>
    )

    expect(
      screen.getByText('Não foi possível carregar o repositório do tutor.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/Só o dono do curso/)).toBeNull()
  })

  it('warns when the tutor is off for the course', () => {
    renderPage({ tutorEnabled: false })

    expect(screen.getByText(/O Tutor IA está desligado neste curso/)).toBeInTheDocument()
  })
})
