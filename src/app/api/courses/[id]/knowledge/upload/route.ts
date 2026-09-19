import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { requireAuth } from '@/lib/auth'
import { canManageKnowledge } from '@/lib/permissions'
import { fetchCourseWithCollaboration } from '@/lib/course-access'
import { MEDIA_POLICY } from '@/lib/media'
import { documentStorageToken, isCourseDocumentPathname } from '@/lib/tutor/document-storage'

function refuse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { id } = await params
  const { course, collaboration } = await fetchCourseWithCollaboration(id, authResult.user.id)

  if (!course) {
    return refuse('Curso não encontrado', 404)
  }

  if (!canManageKnowledge(authResult.user, course, collaboration)) {
    return refuse('Você não tem permissão para alterar o repositório do tutor', 403)
  }

  try {
    const body = (await request.json()) as HandleUploadBody

    if (body.type !== 'blob.generate-client-token') {
      return refuse('Requisição de upload inválida', 400)
    }

    const result = await handleUpload({
      request,
      body,
      token: documentStorageToken(),
      onBeforeGenerateToken: async (pathname) => {
        if (!isCourseDocumentPathname(pathname, id)) {
          throw new Error('Destino de upload inválido')
        }

        return {
          allowedContentTypes: MEDIA_POLICY.knowledge.allowedTypes,
          maximumSizeInBytes: MEDIA_POLICY.knowledge.hardLimitBytes,
          addRandomSuffix: true,
        }
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao preparar o upload'
    return refuse(message, 400)
  }
}
