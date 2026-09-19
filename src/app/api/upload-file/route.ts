import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { requireAuth } from '@/lib/auth'
import { MEDIA_POLICY, isMediaCategory } from '@/lib/media'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody

  // The upload confirmation is a server-to-server call from Vercel Blob, without the
  // user cookie; handleUpload verifies its authenticity through the signature.
  if (body.type !== 'blob.upload-completed') {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (_pathname: string, clientPayload: string | null) => {
        const category = clientPayload ?? ''

        if (!isMediaCategory(category) || category === 'knowledge') {
          throw new Error('Categoria de mídia inválida')
        }

        const policy = MEDIA_POLICY[category]

        return {
          allowedContentTypes: policy.allowedTypes,
          maximumSizeInBytes: policy.hardLimitBytes,
          addRandomSuffix: true,
          tokenPayload: category,
        }
      },
      // No onUploadCompleted: nothing has to happen on the server after the upload, and
      // registering one would make Blob attempt a webhook against a URL unreachable in
      // local development.
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao preparar o upload'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
