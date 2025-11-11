import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, GraduationCap, Layers, ArrowRight } from 'lucide-react';
import type { CursoGerado } from '@/types/gerador-curso';
import { SCORMNavbar } from '@/components/SCORMNavbar';

// Esta página é usada para renderizar o preview standalone para SCORM
// Durante o build estático (export), ela lê o curso do arquivo temporário
export const dynamic = 'force-static';

export default async function SCORMPreviewPage() {
  // Durante o build estático para SCORM, ler do arquivo temporário
  // Este arquivo é criado antes do build e contém os dados do curso
  let curso: CursoGerado | null = null;

  // Durante o build SCORM, ler do arquivo temporário
  if (process.env.SCORM_BUILD_CURSO_FILE) {
    try {
      const fs = await import('fs/promises');
      const cursoFile = process.env.SCORM_BUILD_CURSO_FILE;
      const cursoData = await fs.readFile(cursoFile, 'utf-8');
      curso = JSON.parse(cursoData);
      if (curso) {
        console.log('[scorm-preview] Curso carregado do arquivo temporário:', curso.id);
      }
    } catch (error) {
      console.error('[scorm-preview] Erro ao ler curso do arquivo temporário:', error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Fixed Top with Menu and Student Name */}
      <SCORMNavbar curso={curso} showMenu={true} />

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section - Dark Background */}
        <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Category Badge */}
            <div className="mb-4">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                {curso.categoria}
              </Badge>
            </div>

            {/* Course Title */}
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {curso.titulo}
            </h1>

            {/* Course Description */}
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-3xl">
              {curso.descricao}
            </p>

            {/* Course Metadata */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-300" />
                <span className="text-blue-100">{curso.cargaHoraria}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-300" />
                <span className="text-blue-100">{curso.modalidade}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Units Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Unidades do Curso
          </h2>

          <div className="space-y-6">
            {curso.unidades && curso.unidades.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <p>Nenhuma unidade criada ainda.</p>
                </CardContent>
              </Card>
            ) : (
              curso.unidades.map((unidade, unidadeIndex) => (
                <Link
                  key={unidade.id}
                  href={`unidade/${unidade.id}.html`}
                  className="block"
                >
                  <Card className="overflow-hidden bg-white hover:border-orange-600 transition-all duration-200 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
                        {/* Icon Circle */}
                        <div className="shrink-0">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-600">
                            <Layers className="w-6 h-6 text-white" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-center sm:text-left">
                          {/* Unit Label */}
                          <div>
                            <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                              UNIDADE{' '}
                              {String(unidadeIndex + 1).padStart(2, '0')}
                            </span>
                          </div>

                          {/* Unit Title */}
                          <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                            {unidade.titulo}
                          </h3>

                          {/* Unit Description */}
                          <p className="text-gray-600 text-base leading-relaxed my-2">
                            {unidade.descricao}
                          </p>
                        </div>

                        {/* Access Icon */}
                        <div className="shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-10 w-10 pointer-events-none"
                          >
                            <ArrowRight className="w-6 h-6" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

