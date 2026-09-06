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
    const { room, resolver } = await req.json()
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

    // A sala é sempre ancorada no id canônico: slug muda ao renomear o curso e
    // dois clientes que chegaram por formatos de URL diferentes (id vs slug)
    // acabariam em salas distintas, sem se enxergar
    const roomId = SALA_DO_CURSO(referencia.id)
    const podeEditar = podeEditarCurso(authResult.user, curso, colaboracao)

    // Limite do plano gratuito: recusa o terceiro participante, mas quem já
    // está na sala pode reconectar sem ser barrado. A sala só passa a existir na
    // primeira conexão; até lá getActiveUsers responde 404, o que aqui significa
    // sala vazia
    const ativos = await liveblocks
      .getActiveUsers(roomId)
      .then(({ data }) => data)
      .catch((erro) => {
        if ((erro as { status?: number }).status === 404) return []
        throw erro
      })
    const distintos = new Set(ativos.map((u) => u.id).filter(Boolean))
    const salaCheia = distintos.size >= MAX_COLAB_SIMULTANEOS && !distintos.has(authResult.user.id)

    // Pré-check do CollabProvider: só resolve o id canônico da sala e diz se dá
    // pra entrar, sem emitir token do Liveblocks
    if (resolver) {
      if (salaCheia) {
        return NextResponse.json(
          {
            success: false,
            error: `Já há ${MAX_COLAB_SIMULTANEOS} pessoas editando este curso`,
            salaCheia: true,
          },
          { status: 403 }
        )
      }
      return NextResponse.json({ success: true, cursoId: referencia.id })
    }

    if (salaCheia) {
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
