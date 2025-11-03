import React from 'react';
import { PDFTemplate } from '@/components/PDFTemplate';
import type { CursoGerado } from '@/types/gerador-curso';

// Esta página é usada apenas para renderizar o PDF via Puppeteer
export default async function PDFPreviewPage({
  searchParams,
}: {
  searchParams: { curso?: string };
}) {
  // Se houver curso nos searchParams, usar ele (vem como JSON string)
  let curso: CursoGerado | null = null;
  
  if (searchParams.curso) {
    try {
      curso = JSON.parse(decodeURIComponent(searchParams.curso));
    } catch (error) {
      console.error('Erro ao parsear curso:', error);
    }
  }

  if (!curso) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Curso não encontrado</p>
      </div>
    );
  }

  return <PDFTemplate curso={curso} />;
}
