import React from 'react'
import { Button } from '@/components/ui/button'
import { UnidadeConteudo } from '@/components/UnidadeConteudo'
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react'
import type { CursoGerado } from '@/types/gerador-curso'
import { sidebarMeta } from './meta'

interface SidebarUnitProps {
  curso: CursoGerado
  unidadeId: string
  onNavigate: (unitId: string | null) => void
}

export function SidebarUnit({ curso, unidadeId, onNavigate }: SidebarUnitProps) {
  const unidade = curso.unidades?.find((u) => u.id === unidadeId)

  if (!unidade) {
    return (
      <div className="flex-1 flex items-center justify-center px-14 py-14">
        <div className="text-center max-w-sm">
          <div className="w-[72px] h-[72px] rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-6">
            <SearchX className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-50 mb-2.5">
            Unidade não encontrada
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
            A unidade que você tentou acessar não existe ou foi removida deste curso. Volte para o
            início e escolha outra unidade na lista.
          </p>
          <Button
            onClick={() => onNavigate(null)}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-full"
          >
            Voltar ao início do curso
          </Button>
        </div>
      </div>
    )
  }

  const unidadeIndex = curso.unidades.findIndex((u) => u.id === unidadeId)
  const unidadeAnterior = unidadeIndex > 0 ? curso.unidades[unidadeIndex - 1] : null
  const proximaUnidade =
    unidadeIndex < curso.unidades.length - 1 ? curso.unidades[unidadeIndex + 1] : null

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-14 pt-9 pb-5 border-b border-[#e6e4f0] dark:border-[#2c2839]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-extrabold tracking-wider uppercase text-violet-600 dark:text-violet-400 mb-2.5">
            <span className="w-[5px] h-[5px] rounded-full bg-violet-600 dark:bg-violet-400" />
            Unidade {unidadeIndex + 1} de {curso.unidades.length}
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
            {unidade.titulo}
          </h1>
        </div>
      </div>

      <div className="flex-1 px-14 py-8">
        <div className="max-w-5xl mx-auto">
          <UnidadeConteudo unidade={unidade} theme={sidebarMeta.blockTheme} />
        </div>
      </div>

      <div className="border-t border-[#e6e4f0] dark:border-[#2c2839] bg-white dark:bg-[#1a1725] px-14 py-4 flex items-center justify-between">
        <Button
          variant="outline"
          disabled={!unidadeAnterior}
          onClick={() => unidadeAnterior && onNavigate(unidadeAnterior.id)}
          className="rounded-full border-[#e6e4f0] dark:border-[#2c2839] gap-2 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Unidade anterior
        </Button>

        <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
          Unidade {unidadeIndex + 1} de {curso.unidades.length}
        </span>

        <Button
          disabled={!proximaUnidade}
          onClick={() => proximaUnidade && onNavigate(proximaUnidade.id)}
          className="rounded-full bg-violet-600 hover:bg-violet-700 text-white gap-2 disabled:opacity-40"
        >
          Próxima unidade
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
