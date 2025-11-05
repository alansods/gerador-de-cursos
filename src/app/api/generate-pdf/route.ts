import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  let browser;
  
  try {
    const { curso } = await request.json();
    
    if (!curso) {
      return NextResponse.json(
        { error: 'Dados do curso são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('[PDF] Iniciando geração de PDF para curso:', curso.titulo);

    // Criar URL para a página de preview do PDF
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000';
    const cursoJson = encodeURIComponent(JSON.stringify(curso));
    const previewUrl = `${baseUrl}/pdf-preview?curso=${cursoJson}`;

    console.log('[PDF] URL de preview:', previewUrl.substring(0, 100) + '...');

    // Lançar o browser Puppeteer
    console.log('[PDF] Lançando Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Configurar o viewport para A4
    await page.setViewport({
      width: 794, // A4 width em pixels (210mm ≈ 794px a 96dpi)
      height: 1123, // A4 height em pixels (297mm ≈ 1123px a 96dpi)
    });

    // Navegar para a página de preview
    console.log('[PDF] Navegando para página de preview...');
    await page.goto(previewUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000 // 30 segundos de timeout
    });

    console.log('[PDF] Página carregada, aguardando renderização...');
    // Aguardar um pouco para garantir que tudo está renderizado
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Gerar PDF
    console.log('[PDF] Gerando PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    console.log('[PDF] PDF gerado com sucesso, tamanho:', pdf.length, 'bytes');
    await browser.close();

    // Retornar o PDF como resposta
    const pdfBuffer = Buffer.from(pdf);
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(curso.titulo || 'curso').replace(/[^a-z0-9]/gi, '_')}.pdf"`
      }
    });

  } catch (error) {
    console.error('[PDF] Erro ao gerar PDF:', error);
    console.error('[PDF] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('[PDF] Erro ao fechar browser:', closeError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao gerar PDF',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}