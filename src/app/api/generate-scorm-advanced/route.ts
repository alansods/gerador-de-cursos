import { NextRequest, NextResponse } from 'next/server'
import { generateAdvancedSCORMPackage } from '@/lib/scorm-advanced-service'

export async function POST(request: NextRequest) {
  try {
    const { curso } = await request.json()
    
    if (!curso) {
      return NextResponse.json(
        { error: 'Dados do curso são obrigatórios' },
        { status: 400 }
      )
    }

    const zipBuffer = await generateAdvancedSCORMPackage(curso)
    
    // Converter Buffer para Uint8Array para NextResponse
    const uint8Array = new Uint8Array(zipBuffer)
    
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${curso.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_SCORM_Advanced.zip"`
      }
    })
  } catch (error) {
    console.error('Erro ao gerar SCORM avançado:', error)
    
    // Extrair mensagem de erro mais específica
    let errorMessage = 'Erro ao gerar pacote SCORM avançado'
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message)
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
