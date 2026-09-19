import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
  type JWTPayload,
} from '@/lib/auth'
import { canManageKnowledge } from '@/lib/permissions'
import { fetchCourseWithCollaboration } from '@/lib/course-access'
import { indexSource, listSources, prepareChunks, chunksHash } from '@/lib/tutor/knowledge'
import { DocumentError, extractDocumentSections } from '@/lib/tutor/extract'
import { MEDIA_POLICY } from '@/lib/media'
import {
  DocumentStorageError,
  deletePrivateDocument,
  isCourseDocumentPathname,
  readPrivateDocument,
} from '@/lib/tutor/document-storage'

async function discardUpload(pathname: string) {
  await deletePrivateDocument(pathname).catch((error) =>
    console.error('Failed to delete the tutor document from storage:', error)
  )
}

async function loadAccess(courseId: string, user: JWTPayload) {
  const { course, collaboration } = await fetchCourseWithCollaboration(courseId, user.id)
  return { course, canManage: Boolean(course) && canManageKnowledge(user, course, collaboration) }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const { course, canManage } = await loadAccess(id, authResult.user)

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    return createSuccessResponse({ sources: await listSources(id), canManage })
  } catch (error) {
    console.error('Failed to list the knowledge sources:', error)
    return createErrorResponse('Erro ao listar o repositório do tutor', 500, error)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  let uploadedPathname: string | null = null
  let keepUpload = false

  try {
    const { id } = await params
    const { course, canManage } = await loadAccess(id, authResult.user)

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!canManage) {
      return createErrorResponse('Você não tem permissão para alterar o repositório do tutor', 403)
    }

    const body = await req.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : ''

    if (!isCourseDocumentPathname(body.pathname, id) || !name) {
      return createErrorResponse('Envie o documento antes de indexar', 400)
    }

    uploadedPathname = body.pathname
    const file = await readPrivateDocument(body.pathname, MEDIA_POLICY.knowledge.hardLimitBytes)
    const sections = await extractDocumentSections(file.buffer, file.contentType, name)
    const chunks = prepareChunks(sections)

    if (chunks.length === 0) {
      return createErrorResponse('O documento não tem texto para indexar', 400)
    }

    const duplicate = await prisma.knowledgeSource.findFirst({
      where: {
        courseId: id,
        kind: 'DOCUMENT',
        contentHash: chunksHash(chunks),
      },
      select: { name: true },
    })

    if (duplicate) {
      return createErrorResponse(`Este conteúdo já está no repositório (${duplicate.name})`, 409)
    }

    const source = await indexSource({
      courseId: id,
      kind: 'DOCUMENT',
      name,
      sections,
      file: { pathname: body.pathname, contentType: file.contentType, size: file.size },
    })
    keepUpload = true

    return createSuccessResponse({ source }, 201)
  } catch (error) {
    if (error instanceof DocumentError || error instanceof DocumentStorageError) {
      return createErrorResponse(error.message, 400)
    }
    console.error('Failed to index the document:', error)
    return createErrorResponse('Erro ao indexar o documento', 500, error)
  } finally {
    if (uploadedPathname && !keepUpload) {
      await discardUpload(uploadedPathname)
    }
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const sourceId = new URL(req.url).searchParams.get('sourceId')

    if (!sourceId) {
      return createErrorResponse('ID da fonte é obrigatório', 400)
    }

    const { course, canManage } = await loadAccess(id, authResult.user)

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!canManage) {
      return createErrorResponse('Você não tem permissão para alterar o repositório do tutor', 403)
    }

    const source = await prisma.knowledgeSource.findUnique({
      where: { id: sourceId },
      select: { courseId: true, kind: true, filePathname: true },
    })

    if (!source || source.courseId !== id || source.kind !== 'DOCUMENT') {
      return createErrorResponse('Documento não encontrado', 404)
    }

    await prisma.knowledgeSource.delete({ where: { id: sourceId } })

    if (source.filePathname) {
      await discardUpload(source.filePathname)
    }

    return createSuccessResponse({ id: sourceId })
  } catch (error) {
    console.error('Failed to delete the knowledge source:', error)
    return createErrorResponse('Erro ao excluir o documento', 500, error)
  }
}
