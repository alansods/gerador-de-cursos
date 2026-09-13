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
  // With no key configured collaboration simply does not exist; the editor keeps
  // working because CollabProvider handles this 503
  if (!liveblocks) {
    return createErrorResponse('Colaboração em tempo real não está configurada', 503)
  }

  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { room, resolver } = await req.json()
    const courseId = typeof room === 'string' ? room.replace(/^course:/, '') : ''

    if (!courseId) {
      return createErrorResponse('Sala inválida', 400)
    }

    // The room comes from the editor URL segment, which may be the id or the slug
    const reference = await prisma.course.findFirst({
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

    // The room is always anchored to the canonical id: a slug changes when the course
    // is renamed, and two clients arriving through different URL shapes (id vs slug)
    // would end up in separate rooms, invisible to each other
    const roomId = COURSE_ROOM(reference.id)
    const canEdit = canEditCourse(authResult.user, course, collaboration)

    // Free plan limit: the third participant is refused, but whoever is already in
    // the room can reconnect freely. The room only exists after the first
    // connection; until then getActiveUsers answers 404, which here means an empty
    // room
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

    // CollabProvider pre-check: resolves the canonical room id and says whether
    // joining is possible, without issuing a Liveblocks token
    if (resolver) {
      if (roomFull) {
        return NextResponse.json(
          {
            success: false,
            error: `Já há ${MAX_CONCURRENT_COLLABORATORS} pessoas editando este curso`,
            roomFull: true,
          },
          { status: 403 }
        )
      }
      return NextResponse.json({ success: true, courseId: reference.id })
    }

    if (roomFull) {
      return NextResponse.json(
        {
          success: false,
          error: `Já há ${MAX_CONCURRENT_COLLABORATORS} pessoas editando este curso`,
          roomFull: true,
        },
        { status: 403 }
      )
    }

    const session = liveblocks.prepareSession(authResult.user.id, {
      userInfo: {
        name: authResult.user.name,
        color: userColor(authResult.user.id),
        role: authResult.user.role,
      },
    })

    session.allow(roomId, canEdit ? session.FULL_ACCESS : session.READ_ACCESS)

    const { status, body } = await session.authorize()
    return new Response(body, { status })
  } catch (error) {
    console.error('Liveblocks authentication failed:', error)
    return createErrorResponse('Erro ao autenticar colaboração', 500, error)
  }
}
