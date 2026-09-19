import { del, get, issueSignedToken, presignUrl } from '@vercel/blob'

const SIGNED_URL_TTL_MS = 5 * 60 * 1000

export class DocumentStorageError extends Error {}

export function documentStorageToken(): string {
  const token = process.env.TUTOR_BLOB_READ_WRITE_TOKEN

  if (!token) {
    throw new DocumentStorageError('TUTOR_BLOB_READ_WRITE_TOKEN is not configured')
  }

  return token
}

export function courseDocumentPrefix(courseId: string): string {
  return `courses/${courseId}/`
}

export function isCourseDocumentPathname(pathname: unknown, courseId: string): pathname is string {
  return (
    typeof pathname === 'string' &&
    pathname.startsWith(courseDocumentPrefix(courseId)) &&
    !pathname.includes('..') &&
    pathname.length > courseDocumentPrefix(courseId).length
  )
}

export async function readPrivateDocument(
  pathname: string,
  maxBytes: number
): Promise<{ buffer: Buffer; contentType: string; size: number }> {
  const result = await get(pathname, {
    access: 'private',
    token: documentStorageToken(),
    useCache: false,
  })

  if (!result || result.statusCode !== 200) {
    throw new DocumentStorageError('Documento não encontrado no armazenamento')
  }

  if (result.blob.size > maxBytes) {
    throw new DocumentStorageError('Arquivo acima do limite permitido')
  }

  const buffer = Buffer.from(await new Response(result.stream).arrayBuffer())

  return { buffer, contentType: result.blob.contentType, size: result.blob.size }
}

export async function deletePrivateDocument(pathname: string | string[]): Promise<void> {
  await del(pathname, { token: documentStorageToken() })
}

export async function signedDocumentUrl(
  pathname: string,
  { download = false }: { download?: boolean } = {}
): Promise<string> {
  const validUntil = Date.now() + SIGNED_URL_TTL_MS
  const token = await issueSignedToken({
    token: documentStorageToken(),
    pathname,
    operations: ['get'],
    validUntil,
  })
  const { presignedUrl } = await presignUrl(token, {
    access: 'private',
    operation: 'get',
    pathname,
    validUntil,
  })

  if (!download) return presignedUrl

  const url = new URL(presignedUrl)
  url.searchParams.set('download', '1')
  return url.toString()
}
