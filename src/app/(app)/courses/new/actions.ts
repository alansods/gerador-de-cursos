import { SAMPLE_FILE_NAME } from '@/lib/sample-document'
import type { MarkerDetection } from '@/lib/markers'

interface ExtractionResponse {
  text: string
  markers?: MarkerDetection
}

export async function extractDocument(file: File): Promise<ExtractionResponse> {
  const body = new FormData()
  body.append('file', file)

  const response = await fetch('/api/extract-document', { method: 'POST', body })
  const data = await readJson<ExtractionResponse>(response, 'Erro ao extrair texto do documento')

  if (!data.text) throw new Error('Não foi possível extrair texto do documento')

  return data
}

export async function downloadSampleDocument(): Promise<void> {
  const response = await fetch('/api/sample-document')
  if (!response.ok) throw new Error('Erro ao baixar o documento de exemplo')

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = SAMPLE_FILE_NAME
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function readJson<T>(response: Response, defaultMessage: string): Promise<T> {
  const type = response.headers.get('content-type')

  if (!type?.includes('application/json')) {
    const body = await response.text()
    console.error('Non-JSON response from the API:', body.substring(0, 200))
    throw new Error(defaultMessage)
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || data.error || defaultMessage)
  }

  return data as T
}
