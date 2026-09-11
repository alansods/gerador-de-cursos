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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Unit {
  id: string
  titulo: string
  descricao?: string
  conteudo?: unknown[]
}

interface UnitsDropdownProps {
  units: Unit[]
  activeUnitIndex: number
  onSelectUnit: (index: number) => void
  onOpenManageModal: () => void
}

export function UnitsDropdown({
  units,
  activeUnitIndex,
  onSelectUnit,
  onOpenManageModal,
}: UnitsDropdownProps) {
  const activeUnit = units[activeUnitIndex]

  const fullActiveTitle = activeUnit
    ? `Unidade ${activeUnitIndex + 1} - ${activeUnit.titulo}`
    : 'Selecione uma unidade'

  return (
    <DropdownMenu>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 px-4 py-2 h-auto w-full sm:min-w-[200px] sm:w-auto justify-between bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]">
                    {fullActiveTitle}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{fullActiveTitle}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent
        align="center"
        className="w-[calc(100vw-2rem)] sm:w-[320px] max-h-[400px] overflow-y-auto"
      >
        {units.map((unit, index) => (
          <TooltipProvider key={unit.id} delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  onClick={() => onSelectUnit(index)}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                >
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
                      index === activeUnitIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {index === activeUnitIndex ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-sm flex-1 truncate ${
                      index === activeUnitIndex
                        ? 'font-semibold text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {unit.titulo}
                  </span>
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right">{unit.titulo}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
