/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { GET, POST, DELETE } from '@/app/api/courses/[id]/knowledge/route'
import { prisma } from '@/lib/prisma'
import { indexSource, listSources } from '@/lib/tutor/knowledge'
import { del } from '@vercel/blob'

jest.mock('mammoth', () => ({
  __esModule: true,
  default: { extractRawText: jest.fn(async () => ({ value: 'EPI protege o trabalhador.' })) },
}))

jest.mock('@vercel/blob', () => ({ del: jest.fn().mockResolvedValue(undefined) }))

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

const COURSE_ID = 'curso-1'
const OWNER_ID = 'user-dono'
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

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

const BLOB_URL = 'https://abc.public.blob.vercel-storage.com/cursos/knowledge/aula-x1.docx'
const fetchMock = jest.fn()
global.fetch = fetchMock as unknown as typeof fetch

function blobResponse(type: string) {
  return {
    ok: true,
    headers: new Headers({ 'content-type': type }),
    arrayBuffer: async () => new ArrayBuffer(8),
  }
}

function upload(headers: Record<string, string>, body: Record<string, unknown> = {}) {
  return POST(
    new NextRequest(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: BLOB_URL, name: 'aula.docx', ...body }),
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
  fetchMock.mockResolvedValue(blobResponse(DOCX))
})

describe('POST /api/courses/[id]/knowledge', () => {
  it.each([
    ['owner', OWNER_ID, 'CONTENT_AUTHOR', false],
    ['collaborator', 'user-colab', 'CONTENT_AUTHOR', true],
    ['admin', 'user-admin', 'ADMIN', false],
  ])('lets the %s index a .docx', async (_who, userId, role, collaborator) => {
    const res = await upload(await as(userId, role, { collaborator }))

    expect(res.status).toBe(201)
    expect(mockIndexSource).toHaveBeenCalledWith({
      courseId: COURSE_ID,
      kind: 'DOCUMENT',
      name: 'aula.docx',
      sections: [{ label: 'aula.docx', text: 'EPI protege o trabalhador.' }],
    })
    expect(fetchMock).toHaveBeenCalledWith(BLOB_URL)
    expect(del).toHaveBeenCalledWith(BLOB_URL)
  })

  it.each([
    ['MANAGER', 'user-gestor'],
    ['REVIEWER', 'user-revisor'],
    ['GUEST', 'user-convidado'],
    ['CONTENT_AUTHOR', 'user-outro'],
  ])('refuses %s without ownership or collaboration', async (role, userId) => {
    const res = await upload(await as(userId, role))

    expect(res.status).toBe(403)
    expect(mockIndexSource).not.toHaveBeenCalled()
  })

  it('refuses a file that is not .docx and still deletes the upload', async () => {
    fetchMock.mockResolvedValue(blobResponse('application/zip'))

    const res = await upload(await as(OWNER_ID, 'CONTENT_AUTHOR'), { name: 'aula.zip' })

    expect(res.status).toBe(400)
    expect(mockIndexSource).not.toHaveBeenCalled()
    expect(del).toHaveBeenCalledWith(BLOB_URL)
  })

  it.each([
    ['another host', 'https://evil.example.com/cursos/knowledge/a.docx'],
    ['another blob folder', 'https://abc.public.blob.vercel-storage.com/cursos/image/a.png'],
    ['plain http', 'http://abc.public.blob.vercel-storage.com/cursos/knowledge/a.docx'],
  ])('refuses a URL from %s without fetching or deleting it', async (_case, other) => {
    const res = await upload(await as(OWNER_ID, 'CONTENT_AUTHOR'), { url: other })

    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(del).not.toHaveBeenCalled()
  })

  it('refuses content already in the repository', async () => {
    mockPrisma.knowledgeSource.findFirst.mockResolvedValue({ name: 'antiga.docx' })

    const res = await upload(await as(OWNER_ID, 'CONTENT_AUTHOR'))

    expect(res.status).toBe(409)
    expect(mockIndexSource).not.toHaveBeenCalled()
    expect(del).toHaveBeenCalledWith(BLOB_URL)
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
  it('deletes a document of the course', async () => {
    mockPrisma.knowledgeSource.findUnique.mockResolvedValue({
      courseId: COURSE_ID,
      kind: 'DOCUMENT',
    })

    const res = await remove(await as(OWNER_ID, 'CONTENT_AUTHOR'))

    expect(res.status).toBe(200)
    expect(mockPrisma.knowledgeSource.delete).toHaveBeenCalledWith({ where: { id: 'src-1' } })
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
  })
})
