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
import { transicaoValida } from '@/lib/status-curso'
import type { StatusCurso } from '@/lib/permissions'
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

const DONO_ID = 'user-dono'
const OUTRO_ID = 'user-outro'

async function cookieDe(userId: string, role: string) {
  const segredo = new TextEncoder().encode(process.env.JWT_SECRET)
  const token = await new SignJWT({
    id: userId,
    email: 'testuser@senai.br',
    nome: 'Test User',
    cargo: 'Usuário',
    role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(segredo)

  return `auth-token=${token}`
}

function usuarioNoBanco(id: string, role: string) {
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

function cursoComStatus(status: StatusCurso, ownerId: string | null = DONO_ID) {
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
  statusAtual,
  novoStatus,
  comentario,
  ownerId = DONO_ID,
  autenticado = true,
}: {
  userId?: string
  role?: string
  statusAtual?: StatusCurso
  novoStatus: string
  comentario?: string
  ownerId?: string | null
  autenticado?: boolean
}) {
  if (autenticado && userId && role) {
    mockPrisma.user.findUnique.mockResolvedValue(usuarioNoBanco(userId, role) as never)
  }

  if (statusAtual) {
    mockPrisma.curso.findUnique.mockResolvedValue(cursoComStatus(statusAtual, ownerId) as never)
    mockPrisma.curso.update.mockResolvedValue({
      ...cursoComStatus(statusAtual, ownerId),
      status: novoStatus,
      revisadoPorId: userId ?? null,
      revisadoEm: new Date(),
    } as never)
  } else {
    mockPrisma.curso.findUnique.mockResolvedValue(null as never)
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (autenticado && userId && role) {
    headers.Cookie = await cookieDe(userId, role)
  }

  const req = new NextRequest('http://localhost:3000/api/cursos/curso-1/status', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: novoStatus, ...(comentario ? { comentario } : {}) }),
  })

  return patchStatusHandler(req, { params: Promise.resolve({ id: 'curso-1' }) })
}

describe('transicaoValida', () => {
  const validas: Array<[StatusCurso, StatusCurso]> = [
    ['EM_ANDAMENTO', 'EM_REVISAO'],
    ['EM_REVISAO', 'APROVADO'],
    ['EM_REVISAO', 'REPROVADO'],
    ['EM_REVISAO', 'EM_ANDAMENTO'],
    ['APROVADO', 'EM_ANDAMENTO'],
    ['REPROVADO', 'EM_ANDAMENTO'],
    ['REPROVADO', 'EM_REVISAO'],
  ]

  const invalidas: Array<[StatusCurso, StatusCurso]> = [
    ['EM_ANDAMENTO', 'APROVADO'],
    ['EM_ANDAMENTO', 'REPROVADO'],
    ['EM_ANDAMENTO', 'EM_ANDAMENTO'],
    ['APROVADO', 'REPROVADO'],
    ['APROVADO', 'EM_REVISAO'],
    ['REPROVADO', 'APROVADO'],
  ]

  it.each(validas)('permite %s → %s', (de, para) => {
    expect(transicaoValida(de, para)).toBe(true)
  })

  it.each(invalidas)('recusa %s → %s', (de, para) => {
    expect(transicaoValida(de, para)).toBe(false)
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
      novoStatus: 'EM_REVISAO',
      statusAtual: 'EM_ANDAMENTO',
      autenticado: false,
    })

    expect(res.status).toBe(401)
  })

  it('rejeita status fora do enum com 400', async () => {
    const res = await chamarPatch({
      userId: DONO_ID,
      role: 'CONTEUDISTA',
      statusAtual: 'EM_ANDAMENTO',
      novoStatus: 'PUBLICADO',
    })

    expect(res.status).toBe(400)
  })

  it('retorna 404 quando o curso não existe', async () => {
    const res = await chamarPatch({
      userId: DONO_ID,
      role: 'CONTEUDISTA',
      novoStatus: 'EM_REVISAO',
    })

    expect(res.status).toBe(404)
  })

  it('retorna 422 numa transição inválida, antes de checar permissão', async () => {
    const res = await chamarPatch({
      userId: DONO_ID,
      role: 'ADMIN',
      statusAtual: 'EM_ANDAMENTO',
      novoStatus: 'APROVADO',
    })

    expect(res.status).toBe(422)
    expect(mockPrisma.curso.update).not.toHaveBeenCalled()
  })

  it('deixa o dono CONTEUDISTA enviar o próprio curso para revisão', async () => {
    const res = await chamarPatch({
      userId: DONO_ID,
      role: 'CONTEUDISTA',
      statusAtual: 'EM_ANDAMENTO',
      novoStatus: 'EM_REVISAO',
    })

    expect(res.status).toBe(200)
    expect(mockPrisma.curso.update).toHaveBeenCalled()
  })

  it('impede um CONTEUDISTA não-dono de enviar curso alheio para revisão', async () => {
    const res = await chamarPatch({
      userId: OUTRO_ID,
      role: 'CONTEUDISTA',
      statusAtual: 'EM_ANDAMENTO',
      novoStatus: 'EM_REVISAO',
    })

    expect(res.status).toBe(403)
    expect(mockPrisma.curso.update).not.toHaveBeenCalled()
  })

  it('impede um CONTEUDISTA de aprovar, mesmo sendo o dono', async () => {
    const res = await chamarPatch({
      userId: DONO_ID,
      role: 'CONTEUDISTA',
      statusAtual: 'EM_REVISAO',
      novoStatus: 'APROVADO',
    })

    expect(res.status).toBe(403)
    expect(mockPrisma.curso.update).not.toHaveBeenCalled()
  })

  it('deixa o REVISOR aprovar e grava quem revisou', async () => {
    const res = await chamarPatch({
      userId: OUTRO_ID,
      role: 'REVISOR',
      statusAtual: 'EM_REVISAO',
      novoStatus: 'APROVADO',
    })

    expect(res.status).toBe(200)

    const dados = mockPrisma.curso.update.mock.calls[0][0].data
    expect(dados.status).toBe('APROVADO')
    expect(dados.revisadoPorId).toBe(OUTRO_ID)
    expect(dados.revisadoEm).toBeInstanceOf(Date)
  })

  it('exige comentário ao reprovar', async () => {
    const res = await chamarPatch({
      userId: OUTRO_ID,
      role: 'REVISOR',
      statusAtual: 'EM_REVISAO',
      novoStatus: 'REPROVADO',
    })

    expect(res.status).toBe(400)
    expect(mockPrisma.curso.update).not.toHaveBeenCalled()
  })

  it('reprova com comentário e registra o comentário na mesma transação', async () => {
    const res = await chamarPatch({
      userId: OUTRO_ID,
      role: 'REVISOR',
      statusAtual: 'EM_REVISAO',
      novoStatus: 'REPROVADO',
      comentario: 'Faltou a bibliografia',
    })

    expect(res.status).toBe(200)
    expect(mockPrisma.cursoComentario.create).toHaveBeenCalledWith({
      data: {
        cursoId: 'curso-1',
        autorId: OUTRO_ID,
        texto: 'Faltou a bibliografia',
      },
    })
  })

  it('trata comentário só de espaços como ausente ao reprovar', async () => {
    const res = await chamarPatch({
      userId: OUTRO_ID,
      role: 'REVISOR',
      statusAtual: 'EM_REVISAO',
      novoStatus: 'REPROVADO',
      comentario: '    ',
    })

    expect(res.status).toBe(400)
  })

  it('limpa revisadoPorId ao voltar um curso aprovado para EM_ANDAMENTO', async () => {
    const res = await chamarPatch({
      userId: OUTRO_ID,
      role: 'REVISOR',
      statusAtual: 'APROVADO',
      novoStatus: 'EM_ANDAMENTO',
    })

    expect(res.status).toBe(200)

    const dados = mockPrisma.curso.update.mock.calls[0][0].data
    expect(dados.revisadoPorId).toBeNull()
    expect(dados.revisadoEm).toBeNull()
  })
})
