import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-logger'

const MAX_SIZE = 2000

const selectedAuthor = { select: { id: true, name: true, email: true, role: true } }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    const comments = await prisma.courseComment.findMany({
      where: { courseId: id },
      orderBy: { createdAt: 'asc' },
      include: { author: selectedAuthor },
    })

    return createSuccessResponse({
      comments: comments.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt,
        author: c.author,
        canDelete: c.authorId === authResult.user.id || authResult.user.role === 'ADMIN',
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

    if (!can(authResult.user, 'course:comment')) {
      return createErrorResponse('Você não tem permissão para comentar', 403)
    }

    const body = await req.json()
    const text = typeof body.text === 'string' ? body.text.trim() : ''

    if (!text) {
      return createErrorResponse('O comentário não pode ficar vazio', 400)
    }

    if (text.length > MAX_SIZE) {
      return createErrorResponse(`O comentário deve ter no máximo ${MAX_SIZE} caracteres`, 400)
    }

    const course = await prisma.course.findUnique({ where: { id }, select: { title: true } })

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    const comment = await prisma.courseComment.create({
      data: { courseId: id, authorId: authResult.user.id, text },
      include: { author: selectedAuthor },
    })

    await logActivity({
      type: 'curso_comentado',
      title: 'Comentário em curso',
      description: course.title,
      entityId: id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    return createSuccessResponse(
      {
        comment: {
          id: comment.id,
          text: comment.text,
          createdAt: comment.createdAt,
          author: comment.author,
          canDelete: true,
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
    const commentId = new URL(req.url).searchParams.get('commentId')

    if (!commentId) {
      return createErrorResponse('ID do comentário é obrigatório', 400)
    }

    const comment = await prisma.courseComment.findUnique({
      where: { id: commentId },
      select: { authorId: true, courseId: true },
    })

    if (!comment || comment.courseId !== id) {
      return createErrorResponse('Comentário não encontrado', 404)
    }

    const isAuthor = comment.authorId === authResult.user.id
    if (!isAuthor && authResult.user.role !== 'ADMIN') {
      return createErrorResponse('Você só pode excluir os seus próprios comentários', 403)
    }

    await prisma.courseComment.delete({ where: { id: commentId } })

    return createSuccessResponse({ id: commentId })
  } catch (error) {
    console.error('Erro ao excluir comentário:', error)
    return createErrorResponse('Erro ao excluir comentário', 500, error)
  }
}
