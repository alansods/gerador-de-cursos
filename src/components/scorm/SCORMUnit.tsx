import React from 'react';
import { Button } from '@/components/ui/button';
import { UnidadeConteudo } from '@/components/UnidadeConteudo';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CursoGerado } from '@/types/gerador-curso';

interface SCORMUnitProps {
  curso: CursoGerado;
  unidadeId: string;
  onNavigate: (unitId: string | null) => void;
}

export function SCORMUnit({ curso, unidadeId, onNavigate }: SCORMUnitProps) {
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
          <Button 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => onNavigate(null)}
          >
            Voltar para o início
          </Button>
        </div>
      </div>
    );
  }

  const unidadeIndex = curso.unidades.findIndex((u) => u.id === unidadeId);
  const unidadeAnterior = unidadeIndex > 0 ? curso.unidades[unidadeIndex - 1] : null;
  const proximaUnidade = unidadeIndex < curso.unidades.length - 1 ? curso.unidades[unidadeIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unit Content */}
        <UnidadeConteudo
          unidade={unidade}
          unidadeIndex={unidadeIndex}
        />

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 mt-8 pt-8 border-t-[1px] border-[#e5e7eb] dark:border-gray-700">
          {/* Previous Button */}
          <Button
            disabled={!unidadeAnterior}
            onClick={() => unidadeAnterior && onNavigate(unidadeAnterior.id)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Unidade Anterior
          </Button>

          {/* Unit Counter */}
          <div className="flex-1 text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {unidadeIndex + 1} de {curso.unidades.length}
            </span>
          </div>

          {/* Next Button */}
          <Button
            disabled={!proximaUnidade}
            onClick={() => proximaUnidade && onNavigate(proximaUnidade.id)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima Unidade
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
