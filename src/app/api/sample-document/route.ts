import { NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { LINHAS_DOCUMENTO_EXEMPLO, NOME_ARQUIVO_EXEMPLO } from '@/lib/documento-exemplo'

/**
 * GET /api/sample-document
 * Gera o documento .docx de exemplo, com todos os marcadores suportados,
 * para o usuário usar como base na geração por IA.
 */
export async function GET() {
  const doc = new Document({
    sections: [
      {
        children: LINHAS_DOCUMENTO_EXEMPLO.map(montarParagrafo),
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${NOME_ARQUIVO_EXEMPLO}"`,
    },
  })
}

function montarParagrafo(linha: string): Paragraph {
  if (linha.startsWith('CURSO:')) {
    return new Paragraph({ text: linha, heading: HeadingLevel.HEADING_1 })
  }

  if (linha.startsWith('UNIDADE')) {
    return new Paragraph({ text: linha, heading: HeadingLevel.HEADING_2 })
  }

  if (ehMarcador(linha)) {
    return new Paragraph({ children: [new TextRun({ text: linha, bold: true })] })
  }

  return new Paragraph({ text: linha })
}

function ehMarcador(linha: string): boolean {
  return /_(INICIO|FIM)$/.test(linha.trim())
}
