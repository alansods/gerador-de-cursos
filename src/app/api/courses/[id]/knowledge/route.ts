import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
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

const MAX_FILE_SIZE = 4 * 1024 * 1024
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

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

  try {
    const { id } = await params
    const { course, canManage } = await loadAccess(id, authResult.user)

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!canManage) {
      return createErrorResponse('Você não tem permissão para alterar o repositório do tutor', 403)
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return createErrorResponse('Arquivo não fornecido', 400)
    }

    if (file.type !== DOCX_TYPE && !file.name.toLowerCase().endsWith('.docx')) {
      return createErrorResponse('Tipo de arquivo não suportado. Envie um documento .docx.', 400)
    }

    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse('Arquivo muito grande. Tamanho máximo: 4 MB', 400)
    }

    let text: string
    try {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(await file.arrayBuffer()) })
      text = result.value
    } catch (extractError) {
      return createErrorResponse('Não foi possível ler o documento', 400, extractError)
    }

    const sections = [{ label: file.name, text }]
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

    const source = await indexSource({ courseId: id, kind: 'DOCUMENT', name: file.name, sections })

    return createSuccessResponse({ source }, 201)
  } catch (error) {
    console.error('Failed to index the document:', error)
    return createErrorResponse('Erro ao indexar o documento', 500, error)
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
      select: { courseId: true, kind: true },
    })

    if (!source || source.courseId !== id || source.kind !== 'DOCUMENT') {
      return createErrorResponse('Documento não encontrado', 404)
    }

    await prisma.knowledgeSource.delete({ where: { id: sourceId } })

    return createSuccessResponse({ id: sourceId })
  } catch (error) {
    console.error('Failed to delete the knowledge source:', error)
    return createErrorResponse('Erro ao excluir o documento', 500, error)
  }
}
