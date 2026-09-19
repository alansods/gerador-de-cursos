/**
 * @jest-environment node
 */
import { NextRequest, after } from 'next/server'
import { SignJWT } from 'jose'
import { handleUpload } from '@vercel/blob/client'
import { POST as uploadToken } from '@/app/api/courses/[id]/knowledge/upload/route'
import { GET as getFile } from '@/app/api/courses/[id]/knowledge/[sourceId]/file/route'
import { GET as getPreview } from '@/app/api/courses/[id]/knowledge/[sourceId]/preview/route'
import { DELETE as deleteCourses } from '@/app/api/courses/route'
import { prisma } from '@/lib/prisma'
import {
  deletePrivateDocument,
  readPrivateDocument,
  signedDocumentUrl,
} from '@/lib/tutor/document-storage'

jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  after: jest.fn(),
}))

jest.mock('@vercel/blob/client', () => ({
  handleUpload: jest.fn(async () => ({ type: 'blob.generate-client-token', clientToken: 't' })),
}))

jest.mock('mammoth', () => ({
  __esModule: true,
  default: {
    images: { imgElement: jest.fn(() => 'no-images') },
    convertToHtml: jest.fn(async () => ({ value: '<p>EPI protege o trabalhador.</p>' })),
  },
}))

jest.mock('@/lib/tutor/document-storage', () => ({
  ...jest.requireActual('@/lib/tutor/document-storage'),
  documentStorageToken: jest.fn(() => 'private-token'),
  readPrivateDocument: jest.fn(),
  deletePrivateDocument: jest.fn().mockResolvedValue(undefined),
  signedDocumentUrl: jest.fn(async (pathname: string, { download = false } = {}) =>
    download ? `https://signed/${pathname}?download=1` : `https://signed/${pathname}`
  ),
}))

const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock }
  course: { findUnique: jest.Mock; delete: jest.Mock }
  courseCollaborator: { findUnique: jest.Mock }
  activity: { create: jest.Mock }
  knowledgeSource: { findUnique: jest.Mock; findMany: jest.Mock }
}

mockPrisma.knowledgeSource = { findUnique: jest.fn(), findMany: jest.fn() }

const COURSE_ID = 'curso-1'
const OWNER_ID = 'user-dono'

async function as(userId: string, role: string) {
  mockPrisma.user.findUnique.mockResolvedValue({ id: userId, name: 'X', role })
  mockPrisma.course.findUnique.mockResolvedValue({
    id: COURSE_ID,
    title: 'Curso',
    ownerId: OWNER_ID,
    owner: null,
  })
  mockPrisma.courseCollaborator.findUnique.mockResolvedValue(null)
  const token = await new SignJWT({ id: userId, email: 'x@senai.br', name: 'X', role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET))
  return { Cookie: `auth-token=${token}` }
}

function storedDocument(overrides: Record<string, unknown> = {}) {
  return {
    courseId: COURSE_ID,
    kind: 'DOCUMENT',
    name: 'apostila.pdf',
    filePathname: `courses/${COURSE_ID}/apostila-x1.pdf`,
    contentType: 'application/pdf',
    ...overrides,
  }
}

const sourceContext = { params: Promise.resolve({ id: COURSE_ID, sourceId: 'src-1' }) }
const base = `http://localhost:3000/api/courses/${COURSE_ID}/knowledge`

beforeEach(() => {
  jest.clearAllMocks()
  mockPrisma.knowledgeSource.findUnique.mockResolvedValue(storedDocument())
  mockPrisma.knowledgeSource.findMany.mockResolvedValue([])
})

describe('POST /api/courses/[id]/knowledge/upload', () => {
  async function requestToken(headers: Record<string, string>, pathname: string) {
    return uploadToken(
      new NextRequest(`${base}/upload`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blob.generate-client-token',
          payload: { pathname, callbackUrl: '', clientPayload: null, multipart: false },
        }),
      }),
      { params: Promise.resolve({ id: COURSE_ID }) }
    )
  }

  it('issues a private upload token to the owner, restricted to the course folder', async () => {
    const res = await requestToken(
      await as(OWNER_ID, 'CONTENT_AUTHOR'),
      `courses/${COURSE_ID}/a.pdf`
    )

    expect(res.status).toBe(200)
    const options = (handleUpload as jest.Mock).mock.calls[0][0]
    expect(options.token).toBe('private-token')
    await expect(
      options.onBeforeGenerateToken(`courses/${COURSE_ID}/a.pdf`)
    ).resolves.toMatchObject({ addRandomSuffix: true })
    await expect(options.onBeforeGenerateToken('courses/outro/a.pdf')).rejects.toThrow()
  })

  it.each(['MANAGER', 'REVIEWER', 'GUEST'])('refuses %s', async (role) => {
    const res = await requestToken(await as(`user-${role}`, role), `courses/${COURSE_ID}/a.pdf`)

    expect(res.status).toBe(403)
    expect(handleUpload).not.toHaveBeenCalled()
  })
})

describe('GET /api/courses/[id]/knowledge/[sourceId]/file', () => {
  it('redirects any signed-in user to a short-lived signed URL', async () => {
    const res = await getFile(
      new NextRequest(`${base}/src-1/file`, { headers: await as('user-convidado', 'GUEST') }),
      sourceContext
    )

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`https://signed/courses/${COURSE_ID}/apostila-x1.pdf`)
  })

  it('signs a download URL in download mode', async () => {
    const res = await getFile(
      new NextRequest(`${base}/src-1/file?mode=download`, {
        headers: await as('user-revisor', 'REVIEWER'),
      }),
      sourceContext
    )

    expect(res.headers.get('location')).toContain('download=1')
  })

  it.each([
    ['from another course', storedDocument({ courseId: 'outro' })],
    ['without a stored file', storedDocument({ filePathname: null })],
    ['that does not exist', null],
  ])('returns 404 for a document %s', async (_case, stored) => {
    mockPrisma.knowledgeSource.findUnique.mockResolvedValue(stored)

    const res = await getFile(
      new NextRequest(`${base}/src-1/file`, { headers: await as(OWNER_ID, 'CONTENT_AUTHOR') }),
      sourceContext
    )

    expect(res.status).toBe(404)
    expect(signedDocumentUrl).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    const res = await getFile(new NextRequest(`${base}/src-1/file`), sourceContext)

    expect(res.status).toBe(401)
  })
})

describe('GET /api/courses/[id]/knowledge/[sourceId]/preview', () => {
  it('returns a signed URL for a PDF', async () => {
    const res = await getPreview(
      new NextRequest(`${base}/src-1/preview`, { headers: await as('user-revisor', 'REVIEWER') }),
      sourceContext
    )

    expect(await res.json()).toMatchObject({
      kind: 'pdf',
      url: `https://signed/courses/${COURSE_ID}/apostila-x1.pdf`,
    })
    expect(readPrivateDocument).not.toHaveBeenCalled()
  })

  it('returns the .docx converted to HTML', async () => {
    mockPrisma.knowledgeSource.findUnique.mockResolvedValue(
      storedDocument({
        name: 'apostila.docx',
        filePathname: `courses/${COURSE_ID}/apostila-x1.docx`,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
    )
    ;(readPrivateDocument as jest.Mock).mockResolvedValue({
      buffer: Buffer.from('x'),
      contentType: 'docx',
      size: 1,
    })

    const res = await getPreview(
      new NextRequest(`${base}/src-1/preview`, { headers: await as(OWNER_ID, 'CONTENT_AUTHOR') }),
      sourceContext
    )

    expect(await res.json()).toMatchObject({
      kind: 'html',
      html: '<p>EPI protege o trabalhador.</p>',
    })
  })
})

describe('DELETE /api/courses', () => {
  it('deletes the stored tutor documents of a deleted course after responding', async () => {
    mockPrisma.knowledgeSource.findMany.mockResolvedValue([
      { filePathname: `courses/${COURSE_ID}/a.pdf` },
      { filePathname: `courses/${COURSE_ID}/b.docx` },
    ])
    mockPrisma.course.delete.mockResolvedValue({ id: COURSE_ID })
    mockPrisma.activity.create.mockResolvedValue({})

    const res = await deleteCourses(
      new NextRequest(`http://localhost:3000/api/courses?id=${COURSE_ID}`, {
        method: 'DELETE',
        headers: await as('user-admin', 'ADMIN'),
      })
    )

    expect(res.status).toBe(200)
    expect(deletePrivateDocument).not.toHaveBeenCalled()

    for (const [task] of (after as jest.Mock).mock.calls) {
      await task()
    }

    expect(deletePrivateDocument).toHaveBeenCalledWith([
      `courses/${COURSE_ID}/a.pdf`,
      `courses/${COURSE_ID}/b.docx`,
    ])
  })
})
