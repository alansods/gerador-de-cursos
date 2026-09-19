import mammoth from 'mammoth'
import { DOCX_TYPE, MEDIA_POLICY } from '@/lib/media'

const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com'
export const KNOWLEDGE_BLOB_PREFIX = `cursos/${MEDIA_POLICY.knowledge.category}/`

export class DocumentError extends Error {}

export function isKnowledgeBlobUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false

  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      url.hostname.endsWith(BLOB_HOST_SUFFIX) &&
      url.pathname.startsWith(`/${KNOWLEDGE_BLOB_PREFIX}`)
    )
  } catch {
    return false
  }
}

export async function downloadKnowledgeBlob(
  url: string
): Promise<{ buffer: Buffer; type: string }> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new DocumentError('Não foi possível baixar o documento enviado')
  }

  const buffer = Buffer.from(await response.arrayBuffer())

  if (buffer.length > MEDIA_POLICY.knowledge.hardLimitBytes) {
    throw new DocumentError('Arquivo acima do limite permitido')
  }

  return { buffer, type: response.headers.get('content-type')?.split(';')[0] ?? '' }
}

export async function extractDocumentText(buffer: Buffer, type: string, name: string) {
  const isDocx = type === DOCX_TYPE || name.toLowerCase().endsWith('.docx')

  if (!isDocx) {
    throw new DocumentError('Tipo de arquivo não suportado. Envie um documento .docx.')
  }

  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch {
    throw new DocumentError('Não foi possível ler o documento')
  }
}
