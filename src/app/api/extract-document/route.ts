import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// Esta rota não pode ser exportada estaticamente
export const dynamic = 'error';

// Configuração para Vercel
export const maxDuration = 60; // 60s para plano Pro (10s para Hobby)
export const runtime = 'nodejs';

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

    // Validar tipo do arquivo - APENAS WORD
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Tipo de arquivo não suportado',
          message: 'Apenas arquivos Word (.doc ou .docx) são aceitos.',
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

    // Extrair texto do documento Word
    try {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } catch (error) {
      console.error('Erro ao processar documento Word:', error);
      return NextResponse.json(
        { 
          error: 'Erro ao processar documento', 
          message: 'Não foi possível extrair o texto do documento Word. Verifique se o arquivo não está corrompido ou protegido por senha.' 
        },
        { status: 500 }
      );
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

