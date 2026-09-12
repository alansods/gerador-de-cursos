import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { detectMarkers } from '@/lib/markers'

/**
 * POST /api/extract-document
 * Extrai texto de documentos Word (.docx ou .doc)
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult // 401 when not authenticated
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return createErrorResponse('Arquivo não fornecido', 400)
    }

    // Validate the file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ]

    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse(
        'Tipo de arquivo não suportado. Use apenas documentos Word (.doc ou .docx).',
        400
      )
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return createErrorResponse('Arquivo muito grande. Tamanho máximo: 10MB', 400)
    }

    // Turn the file into a buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extrair texto usando mammoth
    let text: string
    try {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } catch (mammothError) {
      console.error('mammoth failed to extract the text:', mammothError)
      return createErrorResponse(
        'Erro ao processar documento. Certifique-se de que é um arquivo Word válido.',
        400,
        mammothError
      )
    }

    if (!text || text.trim().length === 0) {
      return createErrorResponse(
        'Não foi possível extrair texto do documento. Verifique se o arquivo contém texto.',
        400
      )
    }

    return createSuccessResponse({ text, markers: detectMarkers(text) })
  } catch (error) {
    console.error('Document extraction failed:', error)
    return createErrorResponse('Erro ao processar documento', 500, error)
  }
}
