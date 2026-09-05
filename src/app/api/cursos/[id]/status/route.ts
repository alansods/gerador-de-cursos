import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { can, type StatusCurso } from '@/lib/permissions'
import { STATUS_CURSO, STATUS_CURSO_LABELS, transicaoValida } from '@/lib/status-curso'
import { buscarCursoComColaboracao } from '@/lib/curso-acesso'
import { logActivity, type ActivityType } from '@/lib/activity-logger'

const ATIVIDADE_POR_STATUS: Partial<Record<StatusCurso, ActivityType>> = {
  EM_REVISAO: 'curso_enviado_revisao',
  APROVADO: 'curso_aprovado',
  REPROVADO: 'curso_reprovado',
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await req.json()
    const novoStatus = body.status as StatusCurso
    const comentario = typeof body.comentario === 'string' ? body.comentario.trim() : ''

    if (!STATUS_CURSO.includes(novoStatus)) {
      return createErrorResponse('Status inválido', 400)
    }

    const { curso, colaboracao } = await buscarCursoComColaboracao(id, authResult.user.id)

    if (!curso) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!transicaoValida(curso.status, novoStatus)) {
      return createErrorResponse(
        `Não é possível mudar de "${STATUS_CURSO_LABELS[curso.status]}" para "${STATUS_CURSO_LABELS[novoStatus]}"`,
        422
      )
    }

    // Enviar para revisão é de quem edita; aprovar e reprovar são do revisor
    const acao = novoStatus === 'EM_REVISAO' ? 'curso:enviarRevisao' : 'curso:aprovar'
    const ctx = novoStatus === 'EM_REVISAO' ? { curso, colaboracao } : {}

    if (!can(authResult.user, acao, ctx)) {
      return createErrorResponse('Você não tem permissão para alterar o status deste curso', 403)
    }

    if (novoStatus === 'REPROVADO' && !comentario) {
      return createErrorResponse('Um comentário é obrigatório ao reprovar um curso', 400)
    }

    const revisou = novoStatus === 'APROVADO' || novoStatus === 'REPROVADO'

    const [cursoAtualizado] = await prisma.$transaction([
      prisma.curso.update({
        where: { id },
        data: {
          status: novoStatus,
          ...(revisou
            ? { revisadoPorId: authResult.user.id, revisadoEm: new Date() }
            : { revisadoPorId: null, revisadoEm: null }),
        },
        include: { owner: { select: { id: true, nome: true } } },
      }),
      ...(comentario
        ? [
            prisma.cursoComentario.create({
              data: { cursoId: id, autorId: authResult.user.id, texto: comentario },
            }),
          ]
        : []),
    ])

    const tipo = ATIVIDADE_POR_STATUS[novoStatus]
    if (tipo) {
      await logActivity({
        tipo,
        titulo: `Curso ${STATUS_CURSO_LABELS[novoStatus].toLowerCase()}`,
        descricao: curso.titulo,
        entityId: id,
        entityType: 'curso',
        userId: authResult.user.id,
      })
    }

    return createSuccessResponse({
      curso: {
        id: cursoAtualizado.id,
        status: cursoAtualizado.status,
        revisadoPorId: cursoAtualizado.revisadoPorId,
        revisadoEm: cursoAtualizado.revisadoEm,
      },
    })
  } catch (error) {
    console.error('Erro ao alterar status do curso:', error)
    return createErrorResponse('Erro ao alterar status do curso', 500, error)
  }
}
