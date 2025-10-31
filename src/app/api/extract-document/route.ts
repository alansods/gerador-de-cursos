import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

// Configuração do tamanho máximo do body (10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Configuração para Vercel
export const maxDuration = 60; // 60s para plano Pro (10s para Hobby)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB em bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: 'Arquivo muito grande',
          message: 'O arquivo deve ter no máximo 10MB. Por favor, reduza o tamanho do documento.',
          size: file.size,
          maxSize: maxSize,
        },
        { status: 413 } // Payload Too Large
      );
    }

    // Validar tipo do arquivo
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Tipo de arquivo não suportado',
          message: 'Apenas arquivos PDF, DOCX e TXT são aceitos.',
          receivedType: file.type,
        },
        { status: 415 } // Unsupported Media Type
      );
    }

    // Log do tamanho para monitoramento
    console.log(`[Extract Document] Arquivo recebido: ${file.name}, Tamanho: ${(file.size / 1024).toFixed(2)}KB`);

    // Converter arquivo para buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    // Extrair texto baseado no tipo do arquivo
    if (file.type === 'application/pdf') {
      try {
        const data = await pdf(buffer);
        extractedText = data.text;
      } catch (error) {
        console.error('Erro ao processar PDF:', error);
        return NextResponse.json(
          { error: 'Erro ao processar PDF', message: 'Não foi possível extrair o texto do PDF. Verifique se o arquivo não está corrompido.' },
          { status: 500 }
        );
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } catch (error) {
        console.error('Erro ao processar DOCX:', error);
        return NextResponse.json(
          { error: 'Erro ao processar DOCX', message: 'Não foi possível extrair o texto do documento Word.' },
          { status: 500 }
        );
      }
    } else if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf-8');
    }

    // Validar se o texto foi extraído
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Documento vazio', message: 'Não foi possível extrair texto do documento. Verifique se o arquivo contém conteúdo.' },
        { status: 400 }
      );
    }

    // Estatísticas do texto extraído
    const stats = {
      characterCount: extractedText.length,
      wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
      estimatedTokens: Math.ceil(extractedText.length / 4), // Estimativa aproximada
    };

    console.log(`[Extract Document] Texto extraído: ${stats.characterCount} caracteres, ${stats.wordCount} palavras`);

    return NextResponse.json({
      success: true,
      text: extractedText,
      stats,
      filename: file.name,
    });
  } catch (error) {
    console.error('Erro no extract-document:', error);
    return NextResponse.json(
      {
        error: 'Erro interno ao processar documento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

