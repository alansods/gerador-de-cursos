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

// `jest.Mocked<typeof prisma>` não funciona aqui: os métodos do Prisma são
// genéricos e o utilitário não os reescreve como mocks. Declarar só o que
// este teste usa mantém o `tsc` limpo sem depender do tipo gerado.
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
    cargo: 'Usuário',
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
    cargo: 'Usuário',
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

describe('transicaoValida', () => {
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

  it('rejeita requisição sem autenticação com 401', async () => {
    const res = await chamarPatch({
      newStatus: 'IN_REVIEW',
      currentStatus: 'IN_PROGRESS',
      authenticated: false,
    })

    expect(res.status).toBe(401)
  })

  it('rejeita status fora do enum com 400', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'CONTENT_AUTHOR',
      currentStatus: 'IN_PROGRESS',
      newStatus: 'PUBLICADO',
    })

    expect(res.status).toBe(400)
  })

  it('retorna 404 quando o curso não existe', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'CONTENT_AUTHOR',
      newStatus: 'IN_REVIEW',
    })

    expect(res.status).toBe(404)
  })

  it('retorna 422 numa transição inválida, antes de checar permissão', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'ADMIN',
      currentStatus: 'IN_PROGRESS',
      newStatus: 'APPROVED',
    })

    expect(res.status).toBe(422)
    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })

  it('deixa o dono CONTENT_AUTHOR enviar o próprio curso para revisão', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'CONTENT_AUTHOR',
      currentStatus: 'IN_PROGRESS',
      newStatus: 'IN_REVIEW',
    })

    expect(res.status).toBe(200)
    expect(mockPrisma.course.update).toHaveBeenCalled()
  })

  it('impede um CONTENT_AUTHOR não-dono de enviar curso alheio para revisão', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'CONTENT_AUTHOR',
      currentStatus: 'IN_PROGRESS',
      newStatus: 'IN_REVIEW',
    })

    expect(res.status).toBe(403)
    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })

  it('impede um CONTENT_AUTHOR de aprovar, mesmo sendo o dono', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'CONTENT_AUTHOR',
      currentStatus: 'IN_REVIEW',
      newStatus: 'APPROVED',
    })

    expect(res.status).toBe(403)
    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })

  it('deixa o REVIEWER aprovar e grava quem revisou', async () => {
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

  it('exige comentário ao reprovar', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'REVIEWER',
      currentStatus: 'IN_REVIEW',
      newStatus: 'REJECTED',
    })

    expect(res.status).toBe(400)
    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })

  it('reprova com comentário e registra o comentário na mesma transação', async () => {
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

  it('trata comentário só de espaços como ausente ao reprovar', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'REVIEWER',
      currentStatus: 'IN_REVIEW',
      newStatus: 'REJECTED',
      comment: '    ',
    })

    expect(res.status).toBe(400)
  })

  it('limpa revisadoPorId ao voltar um curso aprovado para IN_PROGRESS', async () => {
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
