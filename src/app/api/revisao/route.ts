import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { can, type StatusCurso } from '@/lib/permissions'
import { STATUS_CURSO } from '@/lib/status-curso'
import type { Prisma } from '@prisma/client'

/**
 * GET /api/revisao
 * Alimenta a tabela da página de revisão: status, datas, criador, revisor e
 * número de comentários de cada curso.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!can(authResult.user, 'revisao:ver')) {
    return createErrorResponse('Você não tem permissão para ver a revisão de cursos', 403)
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const ownerId = searchParams.get('ownerId')

    const where: Prisma.CursoWhereInput = {}

    if (status && STATUS_CURSO.includes(status as StatusCurso)) {
      where.status = status as StatusCurso
    }

    if (ownerId) {
      where.ownerId = ownerId
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { categoria: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [total, cursos] = await Promise.all([
      prisma.curso.count({ where }),
      prisma.curso.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ status: 'asc' }, { dataModificacao: 'desc' }],
        select: {
          id: true,
          titulo: true,
          categoria: true,
          status: true,
          dataCriacao: true,
          dataModificacao: true,
          revisadoEm: true,
          owner: { select: { id: true, nome: true } },
          revisadoPor: { select: { id: true, nome: true } },
          _count: { select: { comentarios: true } },
        },
      }),
    ])

    const criadores = await prisma.user.findMany({
      where: { cursos: { some: {} } },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    })

    return createSuccessResponse({
      cursos: cursos.map((curso) => ({
        id: curso.id,
        titulo: curso.titulo,
        categoria: curso.categoria,
        status: curso.status,
        criadoEm: curso.dataCriacao,
        modificadoEm: curso.dataModificacao,
        revisadoEm: curso.revisadoEm,
        criador: curso.owner,
        revisor: curso.revisadoPor,
        comentarios: curso._count.comentarios,
      })),
      criadores,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Erro ao listar cursos para revisão:', error)
    return createErrorResponse('Erro ao listar cursos para revisão', 500, error)
  }
}
