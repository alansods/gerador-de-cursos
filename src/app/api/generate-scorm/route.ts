import { NextRequest, NextResponse } from 'next/server'
import { generateSCORMPackage } from '@/lib/scorm-service'

export async function POST(request: NextRequest) {
  try {
    const { curso } = await request.json()
    
    if (!curso) {
      return NextResponse.json(
        { error: 'Dados do curso são obrigatórios' },
        { status: 400 }
      )
    }

    const zipBuffer = await generateSCORMPackage(curso)
    
    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${curso.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_SCORM.zip"`
      }
    })
  } catch (error) {
    console.error('Erro ao gerar SCORM:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar pacote SCORM' },
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
