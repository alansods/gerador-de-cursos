import { NextRequest, NextResponse } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse } from '@/lib/auth'
import { canEditCourse } from '@/lib/permissions'
import { fetchCourseWithCollaboration } from '@/lib/course-access'
import { MAX_CONCURRENT_COLLABORATORS, COURSE_ROOM, userColor } from '@/lib/collab-config'

const key = process.env.LIVEBLOCKS_SECRET_KEY

const liveblocks = key ? new Liveblocks({ secret: key }) : null

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
    const courseId = typeof room === 'string' ? room.replace(/^curso:/, '') : ''

    if (!courseId) {
      return createErrorResponse('Sala inválida', 400)
    }

    // A sala vem do segmento da URL do editor, que pode ser o id ou o slug
    const reference = await prisma.curso.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
      select: { id: true },
    })

    if (!reference) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    const { course, collaboration } = await fetchCourseWithCollaboration(
      reference.id,
      authResult.user.id
    )

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    // A sala é sempre ancorada no id canônico: slug muda ao renomear o curso e
    // dois clientes que chegaram por formatos de URL diferentes (id vs slug)
    // acabariam em salas distintas, sem se enxergar
    const roomId = COURSE_ROOM(reference.id)
    const canEdit = canEditCourse(authResult.user, course, collaboration)

    // Limite do plano gratuito: recusa o terceiro participante, mas quem já
    // está na sala pode reconectar sem ser barrado. A sala só passa a existir na
    // primeira conexão; até lá getActiveUsers responde 404, o que aqui significa
    // sala vazia
    const activeUsers = await liveblocks
      .getActiveUsers(roomId)
      .then(({ data }) => data)
      .catch((error) => {
        if ((error as { status?: number }).status === 404) return []
        throw error
      })
    const distinct = new Set(activeUsers.map((u) => u.id).filter(Boolean))
    const roomFull =
      distinct.size >= MAX_CONCURRENT_COLLABORATORS && !distinct.has(authResult.user.id)

    // Pré-check do CollabProvider: só resolve o id canônico da sala e diz se dá
    // pra entrar, sem emitir token do Liveblocks
    if (resolver) {
      if (roomFull) {
        return NextResponse.json(
          {
            success: false,
            error: `Já há ${MAX_CONCURRENT_COLLABORATORS} pessoas editando este curso`,
            salaCheia: true,
          },
          { status: 403 }
        )
      }
      return NextResponse.json({ success: true, cursoId: reference.id })
    }

    if (roomFull) {
      return NextResponse.json(
        {
          success: false,
          error: `Já há ${MAX_CONCURRENT_COLLABORATORS} pessoas editando este curso`,
          salaCheia: true,
        },
        { status: 403 }
      )
    }

    const session = liveblocks.prepareSession(authResult.user.id, {
      userInfo: {
        nome: authResult.user.nome,
        cor: userColor(authResult.user.id),
        role: authResult.user.role,
      },
    })

    session.allow(roomId, canEdit ? session.FULL_ACCESS : session.READ_ACCESS)

    const { status, body } = await session.authorize()
    return new Response(body, { status })
  } catch (error) {
    console.error('Erro na autenticação do Liveblocks:', error)
    return createErrorResponse('Erro ao autenticar colaboração', 500, error)
  }
}
