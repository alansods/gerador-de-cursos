import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/lib/auth'
import { findCourseDocument } from '@/lib/tutor/document-access'
import { signedDocumentUrl } from '@/lib/tutor/document-storage'

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

    const download = new URL(req.url).searchParams.get('mode') === 'download'
    const url = await signedDocumentUrl(document.filePathname, { download })

    return NextResponse.redirect(url, { status: 302, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Failed to sign the tutor document URL:', error)
    return createErrorResponse('Não foi possível abrir o documento', 500, error)
  }
}
