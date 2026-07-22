import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo não suportado' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Arquivo excede o tamanho máximo de 10MB' },
        { status: 400 }
      )
    }

    const extension = file.name.split('.').pop() || 'png'
    const filename = `cursos/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    })

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error('Erro no upload de imagem:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao fazer upload da imagem' },
      { status: 500 }
    )
  }
}
