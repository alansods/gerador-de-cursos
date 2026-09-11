import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-logger'

const MAX_SIZE = 2000

const selectedAuthor = { select: { id: true, nome: true, email: true, role: true } }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    const comments = await prisma.cursoComentario.findMany({
      where: { cursoId: id },
      orderBy: { createdAt: 'asc' },
      include: { autor: selectedAuthor },
    })

    return createSuccessResponse({
      comentarios: comments.map((c) => ({
        id: c.id,
        texto: c.texto,
        createdAt: c.createdAt,
        autor: c.autor,
        podeExcluir: c.autorId === authResult.user.id || authResult.user.role === 'ADMIN',
      })),
    })
  } catch (error) {
    console.error('Erro ao listar comentários:', error)
    return createErrorResponse('Erro ao listar comentários', 500, error)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    if (!can(authResult.user, 'curso:comentar')) {
      return createErrorResponse('Você não tem permissão para comentar', 403)
    }

    const body = await req.json()
    const text = typeof body.texto === 'string' ? body.texto.trim() : ''

    if (!text) {
      return createErrorResponse('O comentário não pode ficar vazio', 400)
    }

    if (text.length > MAX_SIZE) {
      return createErrorResponse(`O comentário deve ter no máximo ${MAX_SIZE} caracteres`, 400)
    }

    const course = await prisma.curso.findUnique({ where: { id }, select: { titulo: true } })

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    const comment = await prisma.cursoComentario.create({
      data: { cursoId: id, autorId: authResult.user.id, texto: text },
      include: { autor: selectedAuthor },
    })

    await logActivity({
      tipo: 'curso_comentado',
      titulo: 'Comentário em curso',
      descricao: course.titulo,
      entityId: id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    return createSuccessResponse(
      {
        comentario: {
          id: comment.id,
          texto: comment.texto,
          createdAt: comment.createdAt,
          autor: comment.autor,
          podeExcluir: true,
        },
      },
      201
    )
  } catch (error) {
    console.error('Erro ao criar comentário:', error)
    return createErrorResponse('Erro ao criar comentário', 500, error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const commentId = new URL(req.url).searchParams.get('comentarioId')

    if (!commentId) {
      return createErrorResponse('ID do comentário é obrigatório', 400)
    }

    const comment = await prisma.cursoComentario.findUnique({
      where: { id: commentId },
      select: { autorId: true, cursoId: true },
    })

    if (!comment || comment.cursoId !== id) {
      return createErrorResponse('Comentário não encontrado', 404)
    }

    const isAuthor = comment.autorId === authResult.user.id
    if (!isAuthor && authResult.user.role !== 'ADMIN') {
      return createErrorResponse('Você só pode excluir os seus próprios comentários', 403)
    }

    await prisma.cursoComentario.delete({ where: { id: commentId } })

    return createSuccessResponse({ id: commentId })
  } catch (error) {
    console.error('Erro ao excluir comentário:', error)
    return createErrorResponse('Erro ao excluir comentário', 500, error)
  }
}
