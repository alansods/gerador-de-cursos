import { NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { SAMPLE_DOCUMENT_LINES, SAMPLE_FILE_NAME } from '@/lib/sample-document'

/**
 * GET /api/sample-document
 * Gera o documento .docx de exemplo, com todos os marcadores suportados,
 * para o usuário usar como base na geração por IA.
 */
export async function GET() {
  const doc = new Document({
    sections: [
      {
        children: SAMPLE_DOCUMENT_LINES.map(buildParagraph),
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${SAMPLE_FILE_NAME}"`,
    },
  })
}

function buildParagraph(line: string): Paragraph {
  if (line.startsWith('CURSO:')) {
    return new Paragraph({ text: line, heading: HeadingLevel.HEADING_1 })
  }

  if (line.startsWith('UNIDADE')) {
    return new Paragraph({ text: line, heading: HeadingLevel.HEADING_2 })
  }

  if (isMarker(line)) {
    return new Paragraph({ children: [new TextRun({ text: line, bold: true })] })
  }

  return new Paragraph({ text: line })
}

function isMarker(line: string): boolean {
  return /_(INICIO|FIM)$/.test(line.trim())
}
