import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// Configuração para Vercel
export const runtime = 'nodejs';
export const maxDuration = 60; // 60s para plano Pro (10s para Hobby)

export async function POST(req: NextRequest) {
  try {
    // Verificar token do Vercel Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[Upload Image] BLOB_READ_WRITE_TOKEN não configurada!');
      return NextResponse.json(
        {
          error: 'Token não configurado',
          message: 'Por favor, configure BLOB_READ_WRITE_TOKEN no Vercel. Acesse: https://vercel.com/docs/storage/vercel-blob',
        },
        { status: 500 }
      );
    }

    // Obter FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG, PNG, GIF, WEBP ou SVG.' },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 10MB' },
        { status: 400 }
      );
    }

    console.log(`[Upload Image] Fazendo upload de: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);

    // Criar nome único para o arquivo
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `cursos/${timestamp}-${sanitizedName}`;

    // Upload para Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`[Upload Image] Upload concluído: ${blob.url}`);

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('[Upload Image] Erro no upload:', error);
    
    return NextResponse.json(
      {
        error: 'Erro interno ao fazer upload',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

