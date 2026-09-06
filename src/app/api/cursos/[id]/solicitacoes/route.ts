import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { can, type PapelColaborador } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-logger'

const PAPEIS: PapelColaborador[] = ['EDITOR', 'LEITOR']

const solicitanteSelecionado = { select: { id: true, nome: true, usuario: true } }

/** Dono do curso, ADMIN e GESTOR enxergam as solicitações */
function podeVerSolicitacoes(role: string, ownerId: string | null, userId: string) {
  return role === 'ADMIN' || role === 'GESTOR' || ownerId === userId
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    const curso = await prisma.curso.findUnique({ where: { id }, select: { ownerId: true } })

    if (!curso) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!podeVerSolicitacoes(authResult.user.role, curso.ownerId, authResult.user.id)) {
      return createErrorResponse('Você não tem permissão para ver as solicitações', 403)
    }

    const solicitacoes = await prisma.cursoAccessRequest.findMany({
      where: { cursoId: id },
      orderBy: { createdAt: 'desc' },
      include: { solicitante: solicitanteSelecionado },
    })

    return createSuccessResponse({ solicitacoes })
  } catch (error) {
    console.error('Erro ao listar solicitações:', error)
    return createErrorResponse('Erro ao listar solicitações', 500, error)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const papelSolicitado: PapelColaborador = PAPEIS.includes(body.papelSolicitado)
      ? body.papelSolicitado
      : 'EDITOR'
    const mensagem = typeof body.mensagem === 'string' ? body.mensagem.trim().slice(0, 500) : null

    const curso = await prisma.curso.findUnique({
      where: { id },
      select: { id: true, titulo: true, ownerId: true, status: true },
    })

    if (!curso) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!can(authResult.user, 'curso:solicitarAcesso', { curso })) {
      return createErrorResponse('Você não pode solicitar acesso a este curso', 403)
    }

    const jaColabora = await prisma.cursoColaborador.findUnique({
      where: { cursoId_userId: { cursoId: id, userId: authResult.user.id } },
      select: { papel: true },
    })

    if (jaColabora) {
      return createErrorResponse('Você já tem acesso a este curso', 409)
    }

    // Uma solicitação por usuário e curso: um novo pedido reabre a mesma linha,
    // então nunca há duas pendências para o dono responder
    const solicitacao = await prisma.cursoAccessRequest.upsert({
      where: { cursoId_solicitanteId: { cursoId: id, solicitanteId: authResult.user.id } },
      create: {
        cursoId: id,
        solicitanteId: authResult.user.id,
        papelSolicitado,
        mensagem,
      },
      update: {
        papelSolicitado,
        mensagem,
        status: 'PENDENTE',
        respondidoPorId: null,
        respondidoEm: null,
      },
      include: { solicitante: solicitanteSelecionado },
    })

    await logActivity({
      tipo: 'acesso_solicitado',
      titulo: 'Acesso solicitado',
      descricao: `${authResult.user.nome} pediu acesso a "${curso.titulo}"`,
      entityId: id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    return createSuccessResponse({ solicitacao }, 201)
  } catch (error) {
    console.error('Erro ao solicitar acesso:', error)
    return createErrorResponse('Erro ao solicitar acesso', 500, error)
  }
}
