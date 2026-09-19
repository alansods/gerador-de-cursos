/**
 * @jest-environment node
 */
import { extractText, getDocumentProxy } from 'unpdf'
import { DocumentError, extractDocumentSections } from '@/lib/tutor/extract'

jest.mock('unpdf', () => ({ getDocumentProxy: jest.fn(), extractText: jest.fn() }))

const PDF = Buffer.from('%PDF-1.7')

function pdfPages(pages: string[]) {
  ;(getDocumentProxy as jest.Mock).mockResolvedValue({})
  ;(extractText as jest.Mock).mockResolvedValue({ totalPages: pages.length, text: pages })
}

describe('extractDocumentSections', () => {
  it('reads each PDF page as a section labeled with the page number', async () => {
    pdfPages(['EPI protege o trabalhador individualmente.', 'EPC protege o ambiente todo.'])

    const sections = await extractDocumentSections(PDF, 'application/pdf', 'apostila.pdf')

    expect(sections.map((section) => section.label)).toEqual([
      'apostila.pdf, p. 1',
      'apostila.pdf, p. 2',
    ])
    expect(sections[0].text).toContain('EPI protege o trabalhador')
    expect(sections[1].text).toContain('EPC protege o ambiente')
  })

  it('refuses a PDF without selectable text with a clear message', async () => {
    pdfPages(['', ' ', ''])

    await expect(
      extractDocumentSections(PDF, 'application/pdf', 'digitalizado.pdf')
    ).rejects.toThrow(/não tem texto selecionável/)
  })

  it('refuses a corrupted PDF', async () => {
    ;(getDocumentProxy as jest.Mock).mockRejectedValue(new Error('Invalid PDF structure'))

    await expect(
      extractDocumentSections(Buffer.from('não é um pdf'), 'application/pdf', 'quebrado.pdf')
    ).rejects.toBeInstanceOf(DocumentError)
  })

  it('refuses other file types', async () => {
    await expect(
      extractDocumentSections(Buffer.from('x'), 'application/zip', 'pacote.zip')
    ).rejects.toThrow(/\.docx ou \.pdf/)
  })
})
