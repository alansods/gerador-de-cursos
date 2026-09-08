import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock, GraduationCap, Layers, ArrowRight } from 'lucide-react'
import type { CursoGerado } from '@/types/gerador-curso'

interface SidebarHomeProps {
  curso: CursoGerado
  onNavigate: (unitId: string) => void
}

export function SidebarHome({ curso, onNavigate }: SidebarHomeProps) {
  return (
    <div className="flex-1">
      <section className="px-7 lg:px-14 pt-7 lg:pt-14 pb-10 border-b border-[#e6e4f0] dark:border-[#2c2839] bg-gradient-to-br from-violet-50 dark:from-violet-950/20 to-transparent">
        <Badge className="mb-4 bg-white dark:bg-[#1a1725] border border-violet-200 dark:border-violet-900 text-violet-600 dark:text-violet-400 hover:bg-white dark:hover:bg-[#1a1725]">
          {curso.categoria}
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 max-w-2xl mb-3">
          {curso.titulo}
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed mb-6">
          {curso.descricao}
        </p>
        <div className="flex flex-wrap gap-7">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
            <Clock className="w-[17px] h-[17px] text-violet-600 dark:text-violet-400" />
            {curso.cargaHoraria}
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
            <GraduationCap className="w-[17px] h-[17px] text-violet-600 dark:text-violet-400" />
            {curso.modalidade}
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
            <Layers className="w-[17px] h-[17px] text-violet-600 dark:text-violet-400" />
            {curso.unidades.length} unidade{curso.unidades.length === 1 ? '' : 's'}
          </div>
        </div>
      </section>

      <section className="px-7 lg:px-14 py-9">
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-50 mb-5">
          Unidades do curso
        </h2>

        {curso.unidades.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
            Nenhuma unidade criada ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {curso.unidades.map((unidade, index) => (
              <button
                key={unidade.id}
                type="button"
                onClick={() => onNavigate(unidade.id)}
                className="flex flex-col gap-3.5 text-left rounded-[18px] border border-[#e6e4f0] dark:border-[#2c2839] bg-white dark:bg-[#1a1725] p-5 shadow-[0_1px_2px_rgba(28,24,48,.04),0_8px_24px_-12px_rgba(28,24,48,.10)] hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
              >
                <div className="flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 text-sm font-extrabold">
                  {index + 1}
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-50 leading-snug">
                  {unidade.titulo}
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
                  {unidade.descricao}
                </p>
                <span className="flex items-center gap-1.5 text-[13px] font-bold text-violet-600 dark:text-violet-400">
                  Iniciar unidade
                  <ArrowRight className="w-[15px] h-[15px]" />
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
