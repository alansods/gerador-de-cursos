import { NextRequest, NextResponse } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse } from '@/lib/auth'
import { podeEditarCurso } from '@/lib/permissions'
import { buscarCursoComColaboracao } from '@/lib/curso-acesso'
import { MAX_COLAB_SIMULTANEOS, SALA_DO_CURSO, corDoUsuario } from '@/lib/collab-config'

const chave = process.env.LIVEBLOCKS_SECRET_KEY

const liveblocks = chave ? new Liveblocks({ secret: chave }) : null

export async function POST(req: NextRequest) {
  // Sem chave configurada a colaboração simplesmente não existe; o editor
  // continua funcionando porque o CollabProvider trata este 503
  if (!liveblocks) {
    return createErrorResponse('Colaboração em tempo real não está configurada', 503)
  }

  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { room } = await req.json()
    const cursoId = typeof room === 'string' ? room.replace(/^curso:/, '') : ''

    if (!cursoId) {
      return createErrorResponse('Sala inválida', 400)
    }

    // A sala vem do segmento da URL do editor, que pode ser o id ou o slug
    const referencia = await prisma.curso.findFirst({
      where: { OR: [{ id: cursoId }, { slug: cursoId }] },
      select: { id: true },
    })

    if (!referencia) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    const { curso, colaboracao } = await buscarCursoComColaboracao(
      referencia.id,
      authResult.user.id
    )

    if (!curso) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    const roomId = SALA_DO_CURSO(cursoId)
    const podeEditar = podeEditarCurso(authResult.user, curso, colaboracao)

    // Limite do plano gratuito: recusa o terceiro participante, mas quem já
    // está na sala pode reconectar sem ser barrado
    const { data: ativos } = await liveblocks.getActiveUsers(roomId)
    const distintos = new Set(ativos.map((u) => u.id).filter(Boolean))

    if (distintos.size >= MAX_COLAB_SIMULTANEOS && !distintos.has(authResult.user.id)) {
      return NextResponse.json(
        {
          success: false,
          error: `Já há ${MAX_COLAB_SIMULTANEOS} pessoas editando este curso`,
          salaCheia: true,
        },
        { status: 403 }
      )
    }

    const session = liveblocks.prepareSession(authResult.user.id, {
      userInfo: {
        nome: authResult.user.nome,
        cor: corDoUsuario(authResult.user.id),
        role: authResult.user.role,
      },
    })

    session.allow(roomId, podeEditar ? session.FULL_ACCESS : session.READ_ACCESS)

    const { status, body } = await session.authorize()
    return new Response(body, { status })
  } catch (error) {
    console.error('Erro na autenticação do Liveblocks:', error)
    return createErrorResponse('Erro ao autenticar colaboração', 500, error)
  }
}
