/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { GET, POST, DELETE } from '@/app/api/courses/[id]/knowledge/route'
import { prisma } from '@/lib/prisma'
import { indexSource, listSources } from '@/lib/tutor/knowledge'
import {
  DocumentStorageError,
  deletePrivateDocument,
  readPrivateDocument,
} from '@/lib/tutor/document-storage'

jest.mock('mammoth', () => ({
  __esModule: true,
  default: { extractRawText: jest.fn(async () => ({ value: 'EPI protege o trabalhador.' })) },
}))

jest.mock('@/lib/tutor/document-storage', () => ({
  ...jest.requireActual('@/lib/tutor/document-storage'),
  readPrivateDocument: jest.fn(),
  deletePrivateDocument: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/tutor/knowledge', () => ({
  ...jest.requireActual('@/lib/tutor/knowledge'),
  indexSource: jest.fn(),
  listSources: jest.fn(),
}))

const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock }
  course: { findUnique: jest.Mock }
  courseCollaborator: { findUnique: jest.Mock }
  knowledgeSource: { findFirst: jest.Mock; findUnique: jest.Mock; delete: jest.Mock }
}

mockPrisma.knowledgeSource = {
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  delete: jest.fn(),
}

const mockIndexSource = indexSource as jest.Mock
const mockListSources = listSources as jest.Mock
const mockRead = readPrivateDocument as jest.Mock
const mockDelete = deletePrivateDocument as jest.Mock

const COURSE_ID = 'curso-1'
const OWNER_ID = 'user-dono'
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const PATHNAME = `courses/${COURSE_ID}/aula-x1.docx`

async function cookieFor(userId: string, role: string) {
  const token = await new SignJWT({ id: userId, email: 'x@senai.br', name: 'X', role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET))
  return `auth-token=${token}`
}

async function as(userId: string, role: string, { collaborator = false } = {}) {
  mockPrisma.user.findUnique.mockResolvedValue({ id: userId, name: 'X', role })
  mockPrisma.course.findUnique.mockResolvedValue({ id: COURSE_ID, ownerId: OWNER_ID, owner: null })
  mockPrisma.courseCollaborator.findUnique.mockResolvedValue(collaborator ? { id: 'col' } : null)
  return { Cookie: await cookieFor(userId, role) }
}

const context = { params: Promise.resolve({ id: COURSE_ID }) }
const url = `http://localhost:3000/api/courses/${COURSE_ID}/knowledge`

function upload(headers: Record<string, string>, body: Record<string, unknown> = {}) {
  return POST(
    new NextRequest(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathname: PATHNAME, name: 'aula.docx', ...body }),
    }),
    context
  )
}

function remove(headers: Record<string, string>, sourceId = 'src-1') {
  return DELETE(
    new NextRequest(`${url}?sourceId=${sourceId}`, { method: 'DELETE', headers }),
    context
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPrisma.knowledgeSource.findFirst.mockResolvedValue(null)
  mockIndexSource.mockResolvedValue({ id: 'src-1', name: 'aula.docx', chunkCount: 1 })
  mockListSources.mockResolvedValue([])
  mockRead.mockResolvedValue({ buffer: Buffer.from('x'), contentType: DOCX, size: 1234 })
})

describe('POST /api/courses/[id]/knowledge', () => {
  it.each([
    ['owner', OWNER_ID, 'CONTENT_AUTHOR', false],
    ['collaborator', 'user-colab', 'CONTENT_AUTHOR', true],
    ['admin', 'user-admin', 'ADMIN', false],
  ])(
    'lets the %s index a document and keeps the stored file',
    async (_who, userId, role, collaborator) => {
      const res = await upload(await as(userId, role, { collaborator }))

      expect(res.status).toBe(201)
      expect(mockRead).toHaveBeenCalledWith(PATHNAME, expect.any(Number))
      expect(mockIndexSource).toHaveBeenCalledWith({
        courseId: COURSE_ID,
        kind: 'DOCUMENT',
        name: 'aula.docx',
        sections: [{ label: 'aula.docx', text: 'EPI protege o trabalhador.' }],
        file: { pathname: PATHNAME, contentType: DOCX, size: 1234 },
      })
      expect(mockDelete).not.toHaveBeenCalled()
    }
  )

  it.each([
    ['MANAGER', 'user-gestor'],
    ['REVIEWER', 'user-revisor'],
    ['GUEST', 'user-convidado'],
    ['CONTENT_AUTHOR', 'user-outro'],
  ])('refuses %s without ownership or collaboration', async (role, userId) => {
    const res = await upload(await as(userId, role))

    expect(res.status).toBe(403)
    expect(mockRead).not.toHaveBeenCalled()
  })

  it.each([
    ['another course', 'courses/outro-curso/aula.docx'],
    ['a path escaping the course folder', `courses/${COURSE_ID}/../outro/aula.docx`],
    ['a missing file', undefined],
  ])('refuses %s without reading or deleting anything', async (_case, pathname) => {
    const res = await upload(await as(OWNER_ID, 'CONTENT_AUTHOR'), { pathname })

    expect(res.status).toBe(400)
    expect(mockRead).not.toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('refuses an unsupported file and deletes the upload', async () => {
    mockRead.mockResolvedValue({
      buffer: Buffer.from('x'),
      contentType: 'application/zip',
      size: 9,
    })

    const res = await upload(await as(OWNER_ID, 'CONTENT_AUTHOR'), { name: 'aula.zip' })

    expect(res.status).toBe(400)
    expect(mockIndexSource).not.toHaveBeenCalled()
    expect(mockDelete).toHaveBeenCalledWith(PATHNAME)
  })

  it('refuses content already in the repository and deletes the upload', async () => {
    mockPrisma.knowledgeSource.findFirst.mockResolvedValue({ name: 'antiga.docx' })

    const res = await upload(await as(OWNER_ID, 'CONTENT_AUTHOR'))

    expect(res.status).toBe(409)
    expect(mockIndexSource).not.toHaveBeenCalled()
    expect(mockDelete).toHaveBeenCalledWith(PATHNAME)
  })

  it('reports a file missing from storage as a bad request', async () => {
    mockRead.mockRejectedValue(
      new DocumentStorageError('Documento não encontrado no armazenamento')
    )

    const res = await upload(await as(OWNER_ID, 'CONTENT_AUTHOR'))

    expect(res.status).toBe(400)
  })

  it('deletes the upload when indexing fails', async () => {
    mockIndexSource.mockRejectedValue(new Error('Gemini 429'))

    const res = await upload(await as(OWNER_ID, 'CONTENT_AUTHOR'))

    expect(res.status).toBe(500)
    expect(mockDelete).toHaveBeenCalledWith(PATHNAME)
  })
})

describe('GET /api/courses/[id]/knowledge', () => {
  it('lists the sources to a reviewer, flagged as read-only', async () => {
    mockListSources.mockResolvedValue([{ id: 'src-1', name: 'aula.docx' }])

    const res = await GET(
      new NextRequest(url, { headers: await as('user-revisor', 'REVIEWER') }),
      context
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.sources).toHaveLength(1)
    expect(body.canManage).toBe(false)
  })
})

describe('DELETE /api/courses/[id]/knowledge', () => {
  it('deletes a document of the course and its stored file', async () => {
    mockPrisma.knowledgeSource.findUnique.mockResolvedValue({
      courseId: COURSE_ID,
      kind: 'DOCUMENT',
      filePathname: PATHNAME,
    })

    const res = await remove(await as(OWNER_ID, 'CONTENT_AUTHOR'))

    expect(res.status).toBe(200)
    expect(mockPrisma.knowledgeSource.delete).toHaveBeenCalledWith({ where: { id: 'src-1' } })
    expect(mockDelete).toHaveBeenCalledWith(PATHNAME)
  })

  it('refuses a GUEST', async () => {
    const res = await remove(await as('user-convidado', 'GUEST'))

    expect(res.status).toBe(403)
    expect(mockPrisma.knowledgeSource.delete).not.toHaveBeenCalled()
  })

  it('does not delete a source from another course or the course content source', async () => {
    const headers = await as(OWNER_ID, 'CONTENT_AUTHOR')

    mockPrisma.knowledgeSource.findUnique.mockResolvedValue({ courseId: 'outro', kind: 'DOCUMENT' })
    expect((await remove(headers)).status).toBe(404)

    mockPrisma.knowledgeSource.findUnique.mockResolvedValue({ courseId: COURSE_ID, kind: 'COURSE' })
    expect((await remove(headers)).status).toBe(404)

    expect(mockPrisma.knowledgeSource.delete).not.toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
