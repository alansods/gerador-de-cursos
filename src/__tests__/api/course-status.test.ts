/**
 * @jest-environment node
 */
/**
 * Testes da máquina de status editorial:
 * - transicaoValida (tabela pura)
 * - PATCH /api/cursos/[id]/status (transição, permissão e efeitos colaterais)
 */

import { NextRequest } from 'next/server'
import { PATCH as patchStatusHandler } from '@/app/api/cursos/[id]/status/route'
import { isValidTransition } from '@/lib/course-status'
import type { CourseStatus } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

// `jest.Mocked<typeof prisma>` não funciona aqui: os métodos do Prisma são
// genéricos e o utilitário não os reescreve como mocks. Declarar só o que
// este teste usa mantém o `tsc` limpo sem depender do tipo gerado.
const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock }
  curso: { findUnique: jest.Mock; update: jest.Mock }
  cursoColaborador: { findUnique: jest.Mock }
  cursoComentario: { create: jest.Mock }
  $transaction: jest.Mock
}

const OWNER_ID = 'user-dono'
const OTHER_ID = 'user-outro'

async function cookieFrom(userId: string, role: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const token = await new SignJWT({
    id: userId,
    email: 'testuser@senai.br',
    nome: 'Test User',
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
    senha: 'hashed',
    nome: 'Test User',
    cargo: 'Usuário',
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function courseWithStatus(status: CourseStatus, ownerId: string | null = OWNER_ID) {
  return {
    id: 'curso-1',
    titulo: 'Curso de Teste',
    ownerId,
    status,
    version: 0,
    revisadoPorId: null,
    revisadoEm: null,
    owner: ownerId ? { id: ownerId, nome: 'Dono', email: 'dono' } : null,
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
    mockPrisma.curso.findUnique.mockResolvedValue(courseWithStatus(currentStatus, ownerId) as never)
    mockPrisma.curso.update.mockResolvedValue({
      ...courseWithStatus(currentStatus, ownerId),
      status: newStatus,
      revisadoPorId: userId ?? null,
      revisadoEm: new Date(),
    } as never)
  } else {
    mockPrisma.curso.findUnique.mockResolvedValue(null as never)
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authenticated && userId && role) {
    headers.Cookie = await cookieFrom(userId, role)
  }

  const req = new NextRequest('http://localhost:3000/api/cursos/curso-1/status', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: newStatus, ...(comment ? { comentario: comment } : {}) }),
  })

  return patchStatusHandler(req, { params: Promise.resolve({ id: 'curso-1' }) })
}

describe('transicaoValida', () => {
  const valid: Array<[CourseStatus, CourseStatus]> = [
    ['EM_ANDAMENTO', 'EM_REVISAO'],
    ['EM_REVISAO', 'APROVADO'],
    ['EM_REVISAO', 'REPROVADO'],
    ['EM_REVISAO', 'EM_ANDAMENTO'],
    ['APROVADO', 'EM_ANDAMENTO'],
    ['REPROVADO', 'EM_ANDAMENTO'],
    ['REPROVADO', 'EM_REVISAO'],
  ]

  const invalid: Array<[CourseStatus, CourseStatus]> = [
    ['EM_ANDAMENTO', 'APROVADO'],
    ['EM_ANDAMENTO', 'REPROVADO'],
    ['EM_ANDAMENTO', 'EM_ANDAMENTO'],
    ['APROVADO', 'REPROVADO'],
    ['APROVADO', 'EM_REVISAO'],
    ['REPROVADO', 'APROVADO'],
  ]

  it.each(valid)('permite %s → %s', (from, to) => {
    expect(isValidTransition(from, to)).toBe(true)
  })

  it.each(invalid)('recusa %s → %s', (from, to) => {
    expect(isValidTransition(from, to)).toBe(false)
  })
})

describe('PATCH /api/cursos/[id]/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.$transaction.mockImplementation((ops: unknown) =>
      Promise.all(ops as Promise<unknown>[])
    )
  })

  it('rejeita requisição sem autenticação com 401', async () => {
    const res = await chamarPatch({
      newStatus: 'EM_REVISAO',
      currentStatus: 'EM_ANDAMENTO',
      authenticated: false,
    })

    expect(res.status).toBe(401)
  })

  it('rejeita status fora do enum com 400', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'CONTEUDISTA',
      currentStatus: 'EM_ANDAMENTO',
      newStatus: 'PUBLICADO',
    })

    expect(res.status).toBe(400)
  })

  it('retorna 404 quando o curso não existe', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'CONTEUDISTA',
      newStatus: 'EM_REVISAO',
    })

    expect(res.status).toBe(404)
  })

  it('retorna 422 numa transição inválida, antes de checar permissão', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'ADMIN',
      currentStatus: 'EM_ANDAMENTO',
      newStatus: 'APROVADO',
    })

    expect(res.status).toBe(422)
    expect(mockPrisma.curso.update).not.toHaveBeenCalled()
  })

  it('deixa o dono CONTEUDISTA enviar o próprio curso para revisão', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'CONTEUDISTA',
      currentStatus: 'EM_ANDAMENTO',
      newStatus: 'EM_REVISAO',
    })

    expect(res.status).toBe(200)
    expect(mockPrisma.curso.update).toHaveBeenCalled()
  })

  it('impede um CONTEUDISTA não-dono de enviar curso alheio para revisão', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'CONTEUDISTA',
      currentStatus: 'EM_ANDAMENTO',
      newStatus: 'EM_REVISAO',
    })

    expect(res.status).toBe(403)
    expect(mockPrisma.curso.update).not.toHaveBeenCalled()
  })

  it('impede um CONTEUDISTA de aprovar, mesmo sendo o dono', async () => {
    const res = await chamarPatch({
      userId: OWNER_ID,
      role: 'CONTEUDISTA',
      currentStatus: 'EM_REVISAO',
      newStatus: 'APROVADO',
    })

    expect(res.status).toBe(403)
    expect(mockPrisma.curso.update).not.toHaveBeenCalled()
  })

  it('deixa o REVISOR aprovar e grava quem revisou', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'REVISOR',
      currentStatus: 'EM_REVISAO',
      newStatus: 'APROVADO',
    })

    expect(res.status).toBe(200)

    const data = mockPrisma.curso.update.mock.calls[0][0].data
    expect(data.status).toBe('APROVADO')
    expect(data.revisadoPorId).toBe(OTHER_ID)
    expect(data.revisadoEm).toBeInstanceOf(Date)
  })

  it('exige comentário ao reprovar', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'REVISOR',
      currentStatus: 'EM_REVISAO',
      newStatus: 'REPROVADO',
    })

    expect(res.status).toBe(400)
    expect(mockPrisma.curso.update).not.toHaveBeenCalled()
  })

  it('reprova com comentário e registra o comentário na mesma transação', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'REVISOR',
      currentStatus: 'EM_REVISAO',
      newStatus: 'REPROVADO',
      comment: 'Faltou a bibliografia',
    })

    expect(res.status).toBe(200)
    expect(mockPrisma.cursoComentario.create).toHaveBeenCalledWith({
      data: {
        cursoId: 'curso-1',
        autorId: OTHER_ID,
        texto: 'Faltou a bibliografia',
      },
    })
  })

  it('trata comentário só de espaços como ausente ao reprovar', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'REVISOR',
      currentStatus: 'EM_REVISAO',
      newStatus: 'REPROVADO',
      comment: '    ',
    })

    expect(res.status).toBe(400)
  })

  it('limpa revisadoPorId ao voltar um curso aprovado para EM_ANDAMENTO', async () => {
    const res = await chamarPatch({
      userId: OTHER_ID,
      role: 'REVISOR',
      currentStatus: 'APROVADO',
      newStatus: 'EM_ANDAMENTO',
    })

    expect(res.status).toBe(200)

    const data = mockPrisma.curso.update.mock.calls[0][0].data
    expect(data.revisadoPorId).toBeNull()
    expect(data.revisadoEm).toBeNull()
  })
})
