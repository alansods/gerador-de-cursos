import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-logger'

const TAMANHO_MAXIMO = 2000

const autorSelecionado = { select: { id: true, nome: true, usuario: true, role: true } }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    const comentarios = await prisma.cursoComentario.findMany({
      where: { cursoId: id },
      orderBy: { createdAt: 'asc' },
      include: { autor: autorSelecionado },
    })

    return createSuccessResponse({
      comentarios: comentarios.map((c) => ({
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
    const texto = typeof body.texto === 'string' ? body.texto.trim() : ''

    if (!texto) {
      return createErrorResponse('O comentário não pode ficar vazio', 400)
    }

    if (texto.length > TAMANHO_MAXIMO) {
      return createErrorResponse(
        `O comentário deve ter no máximo ${TAMANHO_MAXIMO} caracteres`,
        400
      )
    }

    const curso = await prisma.curso.findUnique({ where: { id }, select: { titulo: true } })

    if (!curso) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    const comentario = await prisma.cursoComentario.create({
      data: { cursoId: id, autorId: authResult.user.id, texto },
      include: { autor: autorSelecionado },
    })

    await logActivity({
      tipo: 'curso_comentado',
      titulo: 'Comentário em curso',
      descricao: curso.titulo,
      entityId: id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    return createSuccessResponse(
      {
        comentario: {
          id: comentario.id,
          texto: comentario.texto,
          createdAt: comentario.createdAt,
          autor: comentario.autor,
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
    const comentarioId = new URL(req.url).searchParams.get('comentarioId')

    if (!comentarioId) {
      return createErrorResponse('ID do comentário é obrigatório', 400)
    }

    const comentario = await prisma.cursoComentario.findUnique({
      where: { id: comentarioId },
      select: { autorId: true, cursoId: true },
    })

    if (!comentario || comentario.cursoId !== id) {
      return createErrorResponse('Comentário não encontrado', 404)
    }

    const ehAutor = comentario.autorId === authResult.user.id
    if (!ehAutor && authResult.user.role !== 'ADMIN') {
      return createErrorResponse('Você só pode excluir os seus próprios comentários', 403)
    }

    await prisma.cursoComentario.delete({ where: { id: comentarioId } })

    return createSuccessResponse({ id: comentarioId })
  } catch (error) {
    console.error('Erro ao excluir comentário:', error)
    return createErrorResponse('Erro ao excluir comentário', 500, error)
  }
}
