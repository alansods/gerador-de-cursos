import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { getCoursePermissions } from '@/lib/permissions'
import { fetchCollaboration } from '@/lib/course-access'
import { Block, Course, Unit } from '@/types/course'
import { slugifyUnits } from '@/lib/slug'
import { mergeAdjacentFlipcards } from '@/lib/blocks'

/**
 * GET /api/cursos/[id]
 * Busca um curso por ID ou slug
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    // Tenta encontrar por ID primeiro; se não achar, tenta por slug
    const course = await prisma.curso.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { owner: { select: { id: true, nome: true } } },
    })

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    const collaboration = await fetchCollaboration(course.id, authResult.user.id)

    // Normalizar unidades: garantir IDs, slugs e estrutura correta
    const originalUnits = (course.unidades as Partial<Unit>[]) || []
    const mappedUnits = originalUnits.map((unit: Partial<Unit>, index: number) => {
      const unitId = unit.id || `unidade-${Date.now()}-${index}`
      const originalContent = unit.conteudo || (unit as { aulas?: Partial<Block>[] }).aulas || []
      const normalizedContent = mergeAdjacentFlipcards(
        originalContent
          .map((item: Partial<Block>, itemIndex: number) => ({
            ...item,
            id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
            ordem: item.ordem ?? itemIndex,
            tipo: item.tipo || 'paragrafo',
          }))
          .sort((a, b) => a.ordem - b.ordem) as Block[]
      )

      return {
        ...unit,
        id: unitId,
        ordem: unit.ordem ?? index,
        conteudo: normalizedContent,
      }
    })
    const normalizedUnits = slugifyUnits(mappedUnits)

    // Converter para formato CursoGerado
    const formattedCourse: Course = {
      id: course.id,
      slug: course.slug ?? undefined,
      titulo: course.titulo,
      descricao: course.descricao,
      cargaHoraria: course.cargaHoraria,
      modalidade: course.modalidade,
      categoria: course.categoria,
      layout: course.layout,
      bannerVideoUrl: course.bannerVideoUrl ?? undefined,
      unidades: normalizedUnits,
      status: course.status,
      version: course.version,
      ownerId: course.ownerId ?? undefined,
      ownerNome: course.owner?.nome ?? undefined,
      permissoes: getCoursePermissions(authResult.user, course, collaboration),
      dataCriacao: course.dataCriacao,
      dataModificacao: course.dataModificacao,
    }

    return createSuccessResponse({ curso: formattedCourse })
  } catch (error) {
    console.error('Erro ao buscar curso:', error)
    return createErrorResponse('Erro ao buscar curso', 500, error)
  }
}
