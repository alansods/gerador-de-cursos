import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse } from '@/lib/auth'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

function readPositiveInt(value: string | null, fallback: number, max?: number) {
  const numero = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(numero) || numero < 1) return fallback
  return max ? Math.min(numero, max) : numero
}

/**
 * GET /api/scorm-jobs
 * Retorna a página solicitada de jobs SCORM (ordenados por data de criação)
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult // Retorna erro 401 se não autenticado
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const page = readPositiveInt(searchParams.get('page'), DEFAULT_PAGE)
    const limit = readPositiveInt(searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT)

    const [total, jobs] = await Promise.all([
      prisma.sCORMJob.count(),
      prisma.sCORMJob.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          cursoId: true,
          cursoTitulo: true,
          status: true,
          progress: true,
          error: true,
          createdAt: true,
          completedAt: true,
          // Não retornar zipData para economizar largura de banda
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        ...job,
        createdAt: job.createdAt.toISOString(),
        completedAt: job.completedAt?.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('❌ [API scorm-jobs] Erro:', error)
    return createErrorResponse(
      `Erro ao buscar jobs: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      500,
      error
    )
  }
}
