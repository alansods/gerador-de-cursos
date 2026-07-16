'use client'

import React from 'react'
import { BookOpen, ChevronDown, Check, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface Unidade {
  id: string
  titulo: string
  descricao?: string
  conteudo?: unknown[]
}

interface UnidadesDropdownProps {
  unidades: Unidade[]
  unidadeAtivaIndex: number
  onSelectUnidade: (index: number) => void
  onOpenManageModal: () => void
}

export function UnidadesDropdown({
  unidades,
  unidadeAtivaIndex,
  onSelectUnidade,
  onOpenManageModal,
}: UnidadesDropdownProps) {
  const unidadeAtiva = unidades[unidadeAtivaIndex]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 px-4 py-2 h-auto min-w-[200px] justify-between bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium truncate max-w-[300px]">
              {unidadeAtiva
                ? `Unidade ${unidadeAtivaIndex + 1} - ${unidadeAtiva.titulo}`
                : 'Selecione uma unidade'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-[320px] max-h-[400px] overflow-y-auto">
        {unidades.map((unidade, index) => (
          <DropdownMenuItem
            key={unidade.id}
            onClick={() => onSelectUnidade(index)}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer"
          >
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                index === unidadeAtivaIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {index === unidadeAtivaIndex ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-xs font-semibold">{index + 1}</span>
              )}
            </div>
            <span
              className={`text-sm flex-1 truncate ${
                index === unidadeAtivaIndex
                  ? 'font-semibold text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {unidade.titulo}
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onOpenManageModal}
          className="flex items-center gap-2 px-3 py-2 cursor-pointer text-blue-600 dark:text-blue-400 font-medium"
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm">Gerenciar unidades...</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
