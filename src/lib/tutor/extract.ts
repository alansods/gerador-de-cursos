import mammoth from 'mammoth'
import { extractText, getDocumentProxy } from 'unpdf'
import type { LabeledSection } from '@/lib/tutor/knowledge'
import { DOCX_TYPE } from '@/lib/media'

export class DocumentError extends Error {}

const PDF_TYPE = 'application/pdf'
const MIN_PDF_CHARS_PER_PAGE = 20

function isDocx(type: string, name: string) {
  return type === DOCX_TYPE || name.toLowerCase().endsWith('.docx')
}

function isPdf(type: string, name: string) {
  return type === PDF_TYPE || name.toLowerCase().endsWith('.pdf')
}

async function docxSections(buffer: Buffer, name: string): Promise<LabeledSection[]> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return [{ label: name, text: result.value }]
  } catch {
    throw new DocumentError('Não foi possível ler o documento')
  }
}

async function pdfSections(buffer: Buffer, name: string): Promise<LabeledSection[]> {
  let pages: string[]

  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    pages = (await extractText(pdf, { mergePages: false })).text
  } catch {
    throw new DocumentError('Não foi possível ler o PDF. Ele pode estar corrompido ou protegido.')
  }

  const totalChars = pages.reduce((total, page) => total + page.trim().length, 0)

  if (totalChars < MIN_PDF_CHARS_PER_PAGE * Math.max(pages.length, 1)) {
    throw new DocumentError(
      'Este PDF não tem texto selecionável (parece digitalizado). Envie um PDF com texto ou um .docx.'
    )
  }

  return pages.map((text, index) => ({ label: `${name}, p. ${index + 1}`, text }))
}

export async function extractDocumentSections(
  buffer: Buffer,
  type: string,
  name: string
): Promise<LabeledSection[]> {
  if (isPdf(type, name)) return pdfSections(buffer, name)
  if (isDocx(type, name)) return docxSections(buffer, name)

  throw new DocumentError('Tipo de arquivo não suportado. Envie um documento .docx ou .pdf.')
}
