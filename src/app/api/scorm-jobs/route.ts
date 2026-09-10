import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse } from '@/lib/auth'

const PAGINA_PADRAO = 1
const LIMITE_PADRAO = 10
const LIMITE_MAXIMO = 50

function lerInteiroPositivo(valor: string | null, padrao: number, maximo?: number) {
  const numero = Number.parseInt(valor ?? '', 10)
  if (!Number.isFinite(numero) || numero < 1) return padrao
  return maximo ? Math.min(numero, maximo) : numero
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
    const page = lerInteiroPositivo(searchParams.get('page'), PAGINA_PADRAO)
    const limit = lerInteiroPositivo(searchParams.get('limit'), LIMITE_PADRAO, LIMITE_MAXIMO)

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
