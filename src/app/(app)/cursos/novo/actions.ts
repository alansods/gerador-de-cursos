import type { GenerationSummary } from '@/lib/blocks'
import { SAMPLE_FILE_NAME } from '@/lib/sample-document'
import type { MarkerDetection } from '@/lib/markers'
import type { Course } from '@/types/course'

const GENERATION_TIMEOUT = 55_000

interface ExtractionResponse {
  text: string
  markers?: MarkerDetection
}

interface GenerationResponse {
  course: Course
  summary: GenerationSummary
}

export async function extractDocument(file: File): Promise<ExtractionResponse> {
  const body = new FormData()
  body.append('file', file)

  const response = await fetch('/api/extract-document', { method: 'POST', body })
  const data = await lerJson<ExtractionResponse>(response, 'Erro ao extrair texto do documento')

  if (!data.text) throw new Error('Não foi possível extrair texto do documento')

  return data
}

export async function createCourseWithAi(text: string): Promise<GenerationResponse> {
  const controller = new AbortController()
  const limit = setTimeout(() => controller.abort(), GENERATION_TIMEOUT)

  try {
    const response = await fetch('/api/generate-course-from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    })

    const data = await lerJson<Partial<GenerationResponse>>(response, 'Erro ao gerar curso com IA')

    if (!data.course) throw new Error('A IA não retornou um curso válido')

    return data as GenerationResponse
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(
        'O documento é grande demais para uma geração única. Divida o conteúdo em partes menores e tente novamente.'
      )
    }
    throw error
  } finally {
    clearTimeout(limit)
  }
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

async function lerJson<T>(response: Response, defaultMessage: string): Promise<T> {
  const type = response.headers.get('content-type')

  if (!type?.includes('application/json')) {
    const body = await response.text()
    console.error('Resposta não-JSON da API:', body.substring(0, 200))
    throw new Error(defaultMessage)
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || data.error || defaultMessage)
  }

  return data as T
}
