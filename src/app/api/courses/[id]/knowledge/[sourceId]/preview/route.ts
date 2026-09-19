import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { MEDIA_POLICY } from '@/lib/media'
import { findCourseDocument } from '@/lib/tutor/document-access'
import { readPrivateDocument, signedDocumentUrl } from '@/lib/tutor/document-storage'

const withoutImages = mammoth.images.imgElement(async () => ({ src: '' }))

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id, sourceId } = await params
    const document = await findCourseDocument(id, sourceId)

    if (!document) {
      return createErrorResponse('Documento não encontrado', 404)
    }

    const isPdf =
      document.contentType === 'application/pdf' || document.name.toLowerCase().endsWith('.pdf')

    if (isPdf) {
      return createSuccessResponse({
        kind: 'pdf',
        url: await signedDocumentUrl(document.filePathname),
      })
    }

    const { buffer } = await readPrivateDocument(
      document.filePathname,
      MEDIA_POLICY.knowledge.hardLimitBytes
    )
    const { value } = await mammoth.convertToHtml({ buffer }, { convertImage: withoutImages })

    return createSuccessResponse({ kind: 'html', html: value })
  } catch (error) {
    console.error('Failed to preview the tutor document:', error)
    return createErrorResponse('Não foi possível visualizar o documento', 500, error)
  }
}
