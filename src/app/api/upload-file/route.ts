import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { requireAuth } from '@/lib/auth'
import { POLITICA_MIDIAS, ehCategoriaMidia } from '@/lib/midias'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody

  // A confirmação de upload é uma chamada servidor-a-servidor do Vercel Blob, sem o
  // cookie do usuário; sua autenticidade é verificada pela assinatura em handleUpload.
  if (body.type !== 'blob.upload-completed') {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
  }

  try {
    const resultado = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (_pathname: string, clientPayload: string | null) => {
        const categoria = clientPayload ?? ''

        if (!ehCategoriaMidia(categoria)) {
          throw new Error('Categoria de mídia inválida')
        }

        const politica = POLITICA_MIDIAS[categoria]

        return {
          allowedContentTypes: politica.tiposPermitidos,
          maximumSizeInBytes: politica.limiteRigidoBytes,
          addRandomSuffix: true,
          tokenPayload: categoria,
        }
      },
      // Sem onUploadCompleted: nada precisa acontecer no servidor após o upload, e
      // registrá-lo faria o Blob tentar um webhook para uma URL inalcançável em
      // desenvolvimento local.
    })

    return NextResponse.json(resultado)
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : 'Erro ao preparar o upload'
    return NextResponse.json({ success: false, error: mensagem }, { status: 400 })
  }
}
