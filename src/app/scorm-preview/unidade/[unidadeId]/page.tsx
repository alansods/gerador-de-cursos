'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UnidadeConteudo } from '@/components/UnidadeConteudo';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CursoGerado } from '@/types/gerador-curso';
import { SCORMNavbar } from '@/components/SCORMNavbar';

// Dados do curso serão injetados no HTML durante o build
declare global {
  interface Window {
    __SCORM_CURSO_DATA__?: CursoGerado;
  }
}

// IMPORTANTE: Mesmo sendo Client Component, precisamos de generateStaticParams
// para export estático funcionar com rotas dinâmicas
export const dynamicParams = false;

export async function generateStaticParams() {
  // Durante o build, ler o curso do arquivo temporário e gerar rotas para todas as unidades
  if (process.env.SCORM_BUILD_CURSO_FILE) {
    try {
      const fs = await import('fs/promises');
      const cursoFile = process.env.SCORM_BUILD_CURSO_FILE;
      const cursoData = await fs.readFile(cursoFile, 'utf-8');
      const curso = JSON.parse(cursoData) as CursoGerado;

      console.log(
        `[scorm-preview/unidade] Gerando rotas estáticas para ${curso.unidades?.length || 0} unidades`
      );

      // Retornar todas as unidades do curso
      return (
        curso.unidades?.map((unidade) => ({
          unidadeId: unidade.id,
        })) || []
      );
    } catch (error) {
      console.error('[scorm-preview/unidade] Erro ao gerar rotas estáticas:', error);
    }
  }

  // Se não estiver em modo de build, retornar array vazio
  return [];
}

export default function SCORMPreviewUnidadePage() {
  const params = useParams();
  const unidadeId = params.unidadeId as string;

  const [curso, setCurso] = useState<CursoGerado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar dados do curso injetados no HTML
    if (typeof window !== 'undefined' && window.__SCORM_CURSO_DATA__) {
      console.log(`[scorm-preview/unidade] Carregando curso dos dados injetados, buscando unidade: ${unidadeId}`);
      setCurso(window.__SCORM_CURSO_DATA__);
      setLoading(false);
    } else {
      console.error('[scorm-preview/unidade] Dados do curso não encontrados');
      setLoading(false);
    }
  }, [unidadeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando unidade...</p>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Curso não encontrado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            O curso não foi fornecido ou houve um erro ao carregá-lo.
          </p>
        </div>
      </div>
    );
  }

  const unidade = curso.unidades?.find((u) => u.id === unidadeId);

  if (!unidade) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Unidade não encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            A unidade solicitada não existe neste curso.
          </p>
          <Link href="../index.html">
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
              Voltar para o início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const unidadeIndex = curso.unidades.findIndex((u) => u.id === unidadeId);
  const unidadeAnterior = unidadeIndex > 0 ? curso.unidades[unidadeIndex - 1] : null;
  const proximaUnidade = unidadeIndex < curso.unidades.length - 1 ? curso.unidades[unidadeIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar Fixed Top with Menu and Student Name */}
      <SCORMNavbar curso={curso} currentUnidadeId={unidadeId} showMenu={true} />

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Unit Content */}
          <UnidadeConteudo
            unidade={unidade}
            unidadeIndex={unidadeIndex}
          />

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-8 border-t-[1px] border-[#e5e7eb] dark:border-gray-700">
            {/* Previous Button */}
            <Link
              href={unidadeAnterior ? `${unidadeAnterior.id}.html` : '#'}
              className={unidadeAnterior ? '' : 'pointer-events-none'}
            >
              <Button
                disabled={!unidadeAnterior}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Unidade Anterior
              </Button>
            </Link>

            {/* Unit Counter */}
            <div className="flex-1 text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {unidadeIndex + 1} de {curso.unidades.length}
              </span>
            </div>

            {/* Next Button */}
            <Link
              href={proximaUnidade ? `${proximaUnidade.id}.html` : '#'}
              className={proximaUnidade ? '' : 'pointer-events-none'}
            >
              <Button
                disabled={!proximaUnidade}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima Unidade
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
