import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { assertCan, ForbiddenError, permissoesDoCurso } from '@/lib/permissions'
import { buscarColaboracao } from '@/lib/curso-acesso'
import { CursoGerado, Unidade } from '@/types/gerador-curso'
import { logActivity } from '@/lib/activity-logger'
import { generateUniqueSlug, slugifyUnidades } from '@/lib/slug'
import { Prisma } from '@prisma/client'
import type { StatusCurso } from '@/lib/permissions'

/** Status cuja revisão deixa de valer assim que o conteúdo muda. */
const REVISAO_INVALIDADA_AO_EDITAR: StatusCurso[] = ['APROVADO', 'REPROVADO']

type UnidadeConteudo = {
  id?: string
  ordem?: number
  tipo?: string
  [key: string]: unknown
}

type UnidadeInput = {
  id?: string
  ordem?: number
  titulo?: string
  descricao?: string
  conteudo?: UnidadeConteudo[]
  aulas?: UnidadeConteudo[]
  [key: string]: unknown
}

/**
 * GET /api/cursos
 * Lista cursos com paginação e filtros
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const modality = searchParams.get('modality') || ''
    const escopo = searchParams.get('escopo') || 'todos'

    // Construir filtros
    const where: Prisma.CursoWhereInput = {}

    if (escopo === 'meus') {
      where.ownerId = authResult.user.id
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.categoria = category
    }

    if (modality) {
      where.modalidade = modality
    }

    // Contar total de cursos
    const total = await prisma.curso.count({ where })

    // Buscar cursos com paginação
    const cursos = await prisma.curso.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { dataCriacao: 'desc' },
      include: { owner: { select: { id: true, nome: true } } },
    })

    // Colaborações do usuário nos cursos listados, numa consulta só, para que
    // um colaborador não apareça sem permissão de edição na listagem
    const colaboracoes = await prisma.cursoColaborador.findMany({
      where: { userId: authResult.user.id, cursoId: { in: cursos.map((c) => c.id) } },
      select: { cursoId: true },
    })
    const colaboracaoPorCurso = new Map(
      colaboracoes.map((c) => [c.cursoId, { concedida: true as const }])
    )

    // Solicitações de acesso pendentes do usuário, para exibir "Aguardando acesso"
    const solicitacoesPendentes = await prisma.cursoAccessRequest.findMany({
      where: {
        solicitanteId: authResult.user.id,
        cursoId: { in: cursos.map((c) => c.id) },
        status: 'PENDENTE',
      },
      select: { cursoId: true },
    })
    const solicitacaoPendentePorCurso = new Set(solicitacoesPendentes.map((s) => s.cursoId))

    // Converter para formato CursoGerado com normalização de unidades
    const cursosFormatados: CursoGerado[] = cursos.map((curso) => {
      // Normalizar unidades: garantir IDs, slugs e estrutura correta
      const unidadesOriginais = (curso.unidades as UnidadeInput[]) || []
      const unidadesMapped = unidadesOriginais.map((unidade: UnidadeInput, index: number) => {
        const unidadeId = unidade.id || `unidade-${curso.id}-${index}`
        const conteudoOriginal = unidade.conteudo || unidade.aulas || []
        const conteudoNormalizado = conteudoOriginal.map(
          (item: UnidadeConteudo, itemIndex: number) => ({
            ...item,
            id: item.id || `conteudo-${curso.id}-${index}-${itemIndex}`,
            ordem: item.ordem ?? itemIndex,
            tipo: item.tipo || 'paragrafo',
          })
        )

        return {
          ...unidade,
          id: unidadeId,
          ordem: unidade.ordem ?? index,
          conteudo: conteudoNormalizado,
        }
      })
      const unidadesNormalizadas = slugifyUnidades(unidadesMapped)

      return {
        id: curso.id,
        slug: curso.slug ?? undefined,
        titulo: curso.titulo,
        descricao: curso.descricao,
        cargaHoraria: curso.cargaHoraria,
        modalidade: curso.modalidade,
        categoria: curso.categoria,
        layout: curso.layout,
        bannerVideoUrl: curso.bannerVideoUrl ?? undefined,
        unidades: unidadesNormalizadas,
        status: curso.status,
        version: curso.version,
        ownerId: curso.ownerId ?? undefined,
        ownerNome: curso.owner?.nome ?? undefined,
        permissoes: permissoesDoCurso(
          authResult.user,
          curso,
          colaboracaoPorCurso.get(curso.id) ?? null
        ),
        solicitacaoPendente: solicitacaoPendentePorCurso.has(curso.id),
        dataCriacao: curso.dataCriacao,
        dataModificacao: curso.dataModificacao,
      }
    })

    return createSuccessResponse({
      cursos: cursosFormatados,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao listar cursos:', error)
    return createErrorResponse('Erro ao listar cursos', 500, error)
  }
}

/**
 * POST /api/cursos
 * Cria um novo curso
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult // Retorna erro 401 se não autenticado
  }

  try {
    assertCan(authResult.user, 'curso:criar')

    const body = await req.json()
    const {
      titulo,
      descricao,
      cargaHoraria,
      modalidade,
      categoria,
      layout,
      bannerVideoUrl,
      unidades,
    } = body

    // Validar campos obrigatórios
    if (!titulo || !descricao || !cargaHoraria || !modalidade || !categoria) {
      return createErrorResponse('Missing required fields', 400)
    }

    // Normalizar unidades: garantir IDs, slugs e estrutura correta
    const unidadesMapped = (unidades || []).map((unidade: UnidadeInput, index: number) => {
      const unidadeId = unidade.id || `unidade-${Date.now()}-${index}`
      const conteudoOriginal = unidade.conteudo || unidade.aulas || []
      const conteudoNormalizado = conteudoOriginal.map(
        (item: UnidadeConteudo, itemIndex: number) => ({
          ...item,
          id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
          ordem: item.ordem ?? itemIndex,
          tipo: item.tipo || 'paragrafo',
        })
      )

      return {
        ...unidade,
        id: unidadeId,
        ordem: unidade.ordem ?? index,
        conteudo: conteudoNormalizado,
        aulas: undefined,
      }
    })
    const unidadesNormalizadas = slugifyUnidades(unidadesMapped)

    // Gerar slug único a partir do título
    const slug = await generateUniqueSlug(titulo)

    // Criar curso
    const curso = await prisma.curso.create({
      data: {
        titulo,
        slug,
        descricao,
        cargaHoraria,
        modalidade,
        categoria,
        layout: layout || 'classico',
        bannerVideoUrl: bannerVideoUrl || null,
        unidades: unidadesNormalizadas,
        ownerId: authResult.user.id,
      },
    })

    // Registrar atividade
    await logActivity({
      tipo: 'curso_criado',
      titulo: 'Novo curso criado',
      descricao: titulo,
      entityId: curso.id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    // Converter para formato CursoGerado
    const cursoFormatado: CursoGerado = {
      id: curso.id,
      slug: curso.slug ?? undefined,
      titulo: curso.titulo,
      descricao: curso.descricao,
      cargaHoraria: curso.cargaHoraria,
      modalidade: curso.modalidade,
      categoria: curso.categoria,
      layout: curso.layout,
      bannerVideoUrl: curso.bannerVideoUrl ?? undefined,
      unidades: (curso.unidades as unknown as Unidade[]) || [],
      status: curso.status,
      version: curso.version,
      ownerId: curso.ownerId ?? undefined,
      permissoes: permissoesDoCurso(authResult.user, curso),
      dataCriacao: curso.dataCriacao,
      dataModificacao: curso.dataModificacao,
    }

    return createSuccessResponse({ curso: cursoFormatado }, 201)
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return createErrorResponse(error.message, 403)
    }
    console.error('Erro ao criar curso:', error)
    return createErrorResponse('Erro ao criar curso', 500, error)
  }
}

/**
 * PUT /api/cursos
 * Atualiza um curso existente
 */
export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult // Retorna erro 401 se não autenticado
  }

  try {
    const body = await req.json()
    const {
      id,
      titulo,
      descricao,
      cargaHoraria,
      modalidade,
      categoria,
      layout,
      bannerVideoUrl,
      unidades,
      version,
    } = body

    if (!id) {
      return createErrorResponse('ID do curso é obrigatório', 400)
    }

    // Verificar se o curso existe
    const cursoExistente = await prisma.curso.findUnique({
      where: { id },
    })

    if (!cursoExistente) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    const colaboracao = await buscarColaboracao(id, authResult.user.id)

    assertCan(authResult.user, 'curso:editar', { curso: cursoExistente, colaboracao })

    // Guarda de concorrência: rejeita escrita baseada numa versão desatualizada
    if (typeof version === 'number' && version !== cursoExistente.version) {
      return NextResponse.json(
        {
          success: false,
          error:
            'O curso foi alterado por outra pessoa. Recarregue para ver a versão mais recente.',
          conflito: true,
          versaoAtual: cursoExistente.version,
        },
        { status: 409 }
      )
    }

    // Normalizar unidades se fornecidas
    let unidadesNormalizadas = undefined
    if (unidades !== undefined) {
      const unidadesMapped = unidades.map((unidade: UnidadeInput, index: number) => {
        const unidadeId = unidade.id || `unidade-${Date.now()}-${index}`
        const conteudoOriginal = unidade.conteudo || unidade.aulas || []
        const conteudoNormalizado = conteudoOriginal.map(
          (item: UnidadeConteudo, itemIndex: number) => ({
            ...item,
            id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
            ordem: item.ordem ?? itemIndex,
            tipo: item.tipo || 'paragrafo',
          })
        )

        return {
          ...unidade,
          id: unidadeId,
          ordem: unidade.ordem ?? index,
          conteudo: conteudoNormalizado,
          aulas: undefined,
        }
      })
      unidadesNormalizadas = slugifyUnidades(unidadesMapped)
    }

    // Regenerar slug se o título mudou
    let newSlug: string | undefined = undefined
    if (titulo && titulo !== cursoExistente.titulo) {
      newSlug = await generateUniqueSlug(titulo, id)
    } else if (!cursoExistente.slug && (titulo || cursoExistente.titulo)) {
      newSlug = await generateUniqueSlug(titulo || cursoExistente.titulo, id)
    }

    // Atualizar curso
    const curso = await prisma.curso.update({
      where: { id },
      data: {
        ...(titulo && { titulo }),
        ...(newSlug && { slug: newSlug }),
        ...(descricao && { descricao }),
        ...(cargaHoraria && { cargaHoraria }),
        ...(modalidade && { modalidade }),
        ...(categoria && { categoria }),
        ...(layout && { layout }),
        ...(bannerVideoUrl !== undefined && { bannerVideoUrl: bannerVideoUrl || null }),
        ...(unidadesNormalizadas !== undefined && { unidades: unidadesNormalizadas }),
        // Editar invalida a revisão: um curso aprovado cujo conteúdo mudou não
        // foi aprovado nesta versão, e o revisor registrado nunca a viu.
        // Vale para APROVADO e REPROVADO — os dois voltam a rascunho.
        ...(REVISAO_INVALIDADA_AO_EDITAR.includes(cursoExistente.status) && {
          status: 'EM_ANDAMENTO' as const,
          revisadoPorId: null,
          revisadoEm: null,
        }),
        version: { increment: 1 },
      },
    })

    // Registrar atividade
    await logActivity({
      tipo: 'curso_editado',
      titulo: 'Curso editado',
      descricao: curso.titulo,
      entityId: curso.id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    // Converter para formato CursoGerado
    const cursoFormatado: CursoGerado = {
      id: curso.id,
      slug: curso.slug ?? undefined,
      titulo: curso.titulo,
      descricao: curso.descricao,
      cargaHoraria: curso.cargaHoraria,
      modalidade: curso.modalidade,
      categoria: curso.categoria,
      layout: curso.layout,
      bannerVideoUrl: curso.bannerVideoUrl ?? undefined,
      unidades: (curso.unidades as unknown as Unidade[]) || [],
      status: curso.status,
      version: curso.version,
      ownerId: curso.ownerId ?? undefined,
      permissoes: permissoesDoCurso(authResult.user, curso, colaboracao),
      dataCriacao: curso.dataCriacao,
      dataModificacao: curso.dataModificacao,
    }

    return createSuccessResponse({ curso: cursoFormatado })
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return createErrorResponse(error.message, 403)
    }
    console.error('Erro ao atualizar curso:', error)
    return createErrorResponse('Erro ao atualizar curso', 500, error)
  }
}

/**
 * DELETE /api/cursos
 * Deleta um curso
 */
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult // Retorna erro 401 se não autenticado
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return createErrorResponse('ID do curso é obrigatório', 400)
    }

    // Verificar se o curso existe
    const cursoExistente = await prisma.curso.findUnique({
      where: { id },
    })

    if (!cursoExistente) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    assertCan(authResult.user, 'curso:excluir', { curso: cursoExistente })

    // Deletar curso
    await prisma.curso.delete({
      where: { id },
    })

    // Registrar atividade
    await logActivity({
      tipo: 'curso_deletado',
      titulo: 'Curso deletado',
      descricao: cursoExistente.titulo,
      entityId: id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    return createSuccessResponse({ message: 'Curso deletado com sucesso' })
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return createErrorResponse(error.message, 403)
    }
    console.error('Erro ao deletar curso:', error)
    return createErrorResponse('Erro ao deletar curso', 500, error)
  }
}
