import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UnidadeConteudo } from '@/components/UnidadeConteudo';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CursoGerado } from '@/types/gerador-curso';
import { SCORMNavbar } from '@/components/SCORMNavbar';

// Durante o build estático, esta página será gerada para todas as unidades
export const dynamic = 'force-static';
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ unidadeId: string }>;
}

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

export default async function SCORMPreviewUnidadePage({ params }: PageProps) {
  // No Next.js 16, params é uma Promise
  const { unidadeId } = await params;

  // Durante o build SCORM, ler do arquivo temporário
  // Este arquivo contém os dados completos do curso
  let curso: CursoGerado | null = null;

  if (process.env.SCORM_BUILD_CURSO_FILE) {
    try {
      const fs = await import('fs/promises');
      const cursoFile = process.env.SCORM_BUILD_CURSO_FILE;
      const cursoData = await fs.readFile(cursoFile, 'utf-8');
      curso = JSON.parse(cursoData);
      if (curso) {
        console.log(`[scorm-preview/unidade] Curso carregado: ${curso.id}, buscando unidade: ${unidadeId}`);
      }
    } catch (error) {
      console.error('[scorm-preview/unidade] Erro ao ler curso do arquivo temporário:', error);
    }
  }

  if (!curso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Curso não encontrado
          </h1>
          <p className="text-gray-600">
            O curso não foi fornecido ou houve um erro ao carregá-lo.
          </p>
        </div>
      </div>
    );
  }

  const unidade = curso.unidades?.find((u) => u.id === unidadeId);

  if (!unidade) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Unidade não encontrada
          </h1>
          <p className="text-gray-600">
            A unidade solicitada não existe neste curso.
          </p>
          <Link href={`../index.html?curso=${encodeURIComponent(JSON.stringify(curso))}`}>
            <Button className="mt-4">Voltar para o início</Button>
          </Link>
        </div>
      </div>
    );
  }

  const unidadeIndex = curso.unidades.findIndex((u) => u.id === unidadeId);
  const unidadeAnterior = unidadeIndex > 0 ? curso.unidades[unidadeIndex - 1] : null;
  const proximaUnidade = unidadeIndex < curso.unidades.length - 1 ? curso.unidades[unidadeIndex + 1] : null;

  const cursoQueryParam = encodeURIComponent(JSON.stringify(curso));

  return (
    <div className="min-h-screen bg-gray-50">
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
          <div className="flex items-center justify-between gap-4 mt-8 pt-8 border-t-[1px] border-[#e5e7eb]">
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
              <span className="text-sm text-gray-600">
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

