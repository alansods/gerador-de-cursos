"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PDFTemplate } from '@/components/PDFTemplate';
import type { CursoGerado } from '@/types/gerador-curso';

// Esta página não deve ser exportada estaticamente (usada apenas para PDF)
export const dynamic = 'error';

// Esta página é usada apenas para renderizar o PDF via Puppeteer
export default function PDFPreviewPage() {
  const searchParams = useSearchParams();
  const [curso, setCurso] = useState<CursoGerado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ler searchParams no lado do cliente
    const cursoParam = searchParams.get('curso');
    
    if (cursoParam) {
      try {
        const cursoData = JSON.parse(decodeURIComponent(cursoParam));
        setCurso(cursoData);
      } catch (error) {
        console.error('Erro ao parsear curso:', error);
      }
    }
    
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Carregando preview...</p>
      </div>
    );
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
