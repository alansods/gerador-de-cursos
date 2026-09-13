/**
 * @jest-environment node
 */
/**
 * Testes da máquina de status editorial:
 * - transicaoValida (tabela pura)
 * - PATCH /api/cursos/[id]/status (transição, permissão e efeitos colaterais)
 */

import { NextRequest } from 'next/server'
import { PATCH as patchStatusHandler } from '@/app/api/courses/[id]/status/route'
import { isValidTransition } from '@/lib/course-status'
import type { CourseStatus } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

// `jest.Mocked<typeof prisma>` does not work here: the Prisma methods are generic
// and the utility never rewrites them as mocks. Declaring only what this test uses
// keeps `tsc` clean without depending on the generated type.
const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock }
  course: { findUnique: jest.Mock; update: jest.Mock }
  courseCollaborator: { findUnique: jest.Mock }
  courseComment: { create: jest.Mock }
  $transaction: jest.Mock
}

const OWNER_ID = 'user-dono'
const OTHER_ID = 'user-outro'

async function cookieFrom(userId: string, role: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const token = await new SignJWT({
    id: userId,
    email: 'testuser@senai.br',
    name: 'Test User',
    role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret)

  return `auth-token=${token}`
}

function dbUser(id: string, role: string) {
  return {
    id,
    email: 'testuser@senai.br',
    password: 'hashed',
    name: 'Test User',
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function courseWithStatus(status: CourseStatus, ownerId: string | null = OWNER_ID) {
  return {
    id: 'curso-1',
    title: 'Curso de Teste',
    ownerId,
    status,
    version: 0,
    reviewedById: null,
    reviewedAt: null,
    owner: ownerId ? { id: ownerId, name: 'Dono', email: 'dono' } : null,
  }
}

async function chamarPatch({
  userId,
  role,
  currentStatus,
  newStatus,
  comment,
  ownerId = OWNER_ID,
  authenticated = true,
}: {
  userId?: string
  role?: string
  currentStatus?: CourseStatus
  newStatus: string
  comment?: string
  ownerId?: string | null
  authenticated?: boolean
}) {
  if (authenticated && userId && role) {
    mockPrisma.user.findUnique.mockResolvedValue(dbUser(userId, role) as never)
  }

  if (currentStatus) {
    mockPrisma.course.findUnique.mockResolvedValue(
      courseWithStatus(currentStatus, ownerId) as never
    )
    mockPrisma.course.update.mockResolvedValue({
      ...courseWithStatus(currentStatus, ownerId),
      status: newStatus,
      reviewedById: userId ?? null,
      reviewedAt: new Date(),
    } as never)
  } else {
    mockPrisma.course.findUnique.mockResolvedValue(null as never)
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authenticated && userId && role) {
    headers.Cookie = await cookieFrom(userId, role)
  }

  const req = new NextRequest('http://localhost:3000/api/courses/curso-1/status', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: newStatus, ...(comment ? { comment } : {}) }),
  })

  return patchStatusHandler(req, { params: Promise.resolve({ id: 'curso-1' }) })
}

describe('isValidTransition', () => {
  const valid: Array<[CourseStatus, CourseStatus]> = [
    ['IN_PROGRESS', 'IN_REVIEW'],
    ['IN_REVIEW', 'APPROVED'],
    ['IN_REVIEW', 'REJECTED'],
    ['IN_REVIEW', 'IN_PROGRESS'],
    ['APPROVED', 'IN_PROGRESS'],
    ['REJECTED', 'IN_PROGRESS'],
    ['REJECTED', 'IN_REVIEW'],
  ]

  const invalid: Array<[CourseStatus, CourseStatus]> = [
    ['IN_PROGRESS', 'APPROVED'],
    ['IN_PROGRESS', 'REJECTED'],
    ['IN_PROGRESS', 'IN_PROGRESS'],
    ['APPROVED', 'REJECTED'],
    ['APPROVED', 'IN_REVIEW'],
    ['REJECTED', 'APPROVED'],
  ]

  it.each(valid)('permite %s → %s', (from, to) => {
    expect(isValidTransition(from, to)).toBe(true)
  })

  it.each(invalid)('recusa %s → %s', (from, to) => {
    expect(isValidTransition(from, to)).toBe(false)
  })
})

describe('PATCH /api/courses/[id]/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.$transaction.mockImplementation((ops: unknown) =>
      Promise.all(ops as Promise<unknown>[])
    )
  })

  it('rejects an unauthenticated request with 401', async () => {
    const res = await chamarPatch({
      newStatus: 'IN_REVIEW',
      currentStatus: 'IN_PROGRESS',
      authenticated: false,
    })

    expect(res.status).toBe(401)
  })

  it('rejects a status outside the enum with 400', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'CONTENT_AUTHOR',
      currentStatus: 'IN_PROGRESS',
      newStatus: 'PUBLICADO',
    })

    expect(res.status).toBe(400)
  })

  it('returns 404 when the course does not exist', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'CONTENT_AUTHOR',
      newStatus: 'IN_REVIEW',
    })

    expect(res.status).toBe(404)
  })

  it('returns 422 on an invalid transition, before checking permission', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'ADMIN',
      currentStatus: 'IN_PROGRESS',
      newStatus: 'APPROVED',
    })

    expect(res.status).toBe(422)
    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })

  it('lets a CONTENT_AUTHOR owner send their own course to review', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'CONTENT_AUTHOR',
      currentStatus: 'IN_PROGRESS',
      newStatus: 'IN_REVIEW',
    })

    expect(res.status).toBe(200)
    expect(mockPrisma.course.update).toHaveBeenCalled()
  })

  it('stops a non-owner CONTENT_AUTHOR from sending another course to review', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'CONTENT_AUTHOR',
      currentStatus: 'IN_PROGRESS',
      newStatus: 'IN_REVIEW',
    })

    expect(res.status).toBe(403)
    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })

  it('stops a CONTENT_AUTHOR from approving, even as the owner', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'CONTENT_AUTHOR',
      currentStatus: 'IN_REVIEW',
      newStatus: 'APPROVED',
    })

    expect(res.status).toBe(403)
    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })

  it('lets a REVIEWER approve and records who reviewed it', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'REVIEWER',
      currentStatus: 'IN_REVIEW',
      newStatus: 'APPROVED',
    })

    expect(res.status).toBe(200)

    const data = mockPrisma.course.update.mock.calls[0][0].data
    expect(data.status).toBe('APPROVED')
    expect(data.reviewedById).toBe(OTHER_ID)
    expect(data.reviewedAt).toBeInstanceOf(Date)
  })

  it('requires a comment when rejecting', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'REVIEWER',
      currentStatus: 'IN_REVIEW',
      newStatus: 'REJECTED',
    })

    expect(res.status).toBe(400)
    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })

  it('rejects with a comment and stores it in the same transaction', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'REVIEWER',
      currentStatus: 'IN_REVIEW',
      newStatus: 'REJECTED',
      comment: 'Faltou a bibliografia',
    })

    expect(res.status).toBe(200)
    expect(mockPrisma.courseComment.create).toHaveBeenCalledWith({
      data: {
        courseId: 'curso-1',
        authorId: OTHER_ID,
        text: 'Faltou a bibliografia',
      },
    })
  })

  it('treats a whitespace-only comment as missing when rejecting', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'REVIEWER',
      currentStatus: 'IN_REVIEW',
      newStatus: 'REJECTED',
      comment: '    ',
    })

    expect(res.status).toBe(400)
  })

  it('clears reviewedById when an approved course goes back to IN_PROGRESS', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'REVIEWER',
      currentStatus: 'APPROVED',
      newStatus: 'IN_PROGRESS',
    })

    expect(res.status).toBe(200)

    const data = mockPrisma.course.update.mock.calls[0][0].data
    expect(data.reviewedById).toBeNull()
    expect(data.reviewedAt).toBeNull()
  })
})
