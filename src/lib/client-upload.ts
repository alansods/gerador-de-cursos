'use client'

import { upload } from '@vercel/blob/client'
import { MEDIA_POLICY, validateFile, type MediaCategory } from './media'

export interface UploadResult {
  url: string
  warning: string | null
}

/**
 * Envia o arquivo direto do browser para o Vercel Blob. A rota só emite um token
 * assinado — o corpo do arquivo nunca passa pela função serverless, que na Vercel
 * rejeita requisições acima de 4,5 MB.
 */
export async function uploadFile(file: File, category: MediaCategory): Promise<UploadResult> {
  const { error, warning } = validateFile(file, category)
  if (error) throw new Error(error)

  const policy = MEDIA_POLICY[category]
  const name = file.name.replace(/[^\w.-]+/g, '-').slice(-80)

  const blob = await upload(`cursos/${policy.category}/${name}`, file, {
    access: 'public',
    handleUploadUrl: '/api/upload-file',
    clientPayload: category,
    contentType: file.type,
  })

  return { url: blob.url, warning }
}
