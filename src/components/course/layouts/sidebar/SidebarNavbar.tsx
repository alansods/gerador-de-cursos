'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Home, User, Moon, Sun, Menu } from 'lucide-react'
import type { CursoGerado } from '@/types/gerador-curso'
import type { ResumoProgresso } from '@/lib/scorm-progress'
import { useLMS } from '@/hooks/useLMS'
import { useTheme } from '@/hooks/useTheme'

interface SidebarNavbarProps {
  curso: CursoGerado
  currentUnidadeId?: string
  onNavigate: (unitId: string | null) => void
  progresso: ResumoProgresso
}

export function SidebarNavbar({
  curso,
  currentUnidadeId,
  onNavigate,
  progresso,
}: SidebarNavbarProps) {
  const { learnerName } = useLMS()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [open, setOpen] = React.useState(false)

  const handleNavigate = (unitId: string | null) => {
    onNavigate(unitId)
    setOpen(false)
  }

  const navContent = (
    <>
      <div className="px-2 pb-5">
        <h2 className="text-sm font-extrabold tracking-tight text-gray-900 dark:text-gray-50 line-clamp-2">
          {curso.titulo}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Curso · {curso.unidades.length} unidade{curso.unidades.length === 1 ? '' : 's'}
        </p>

        <div className="mt-3.5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Progresso</span>
            <span
              className={`font-semibold ${
                progresso.percentual >= 100
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-violet-600 dark:text-violet-400'
              }`}
            >
              {progresso.percentual}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progresso.percentual >= 100 ? 'bg-green-600' : 'bg-violet-600'
              }`}
              style={{ width: `${progresso.percentual}%` }}
            />
          </div>
        </div>
      </div>

      <p className="px-2.5 pt-2 pb-2 text-[11px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
        Navegação
      </p>
      <nav className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => handleNavigate(null)}
          className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm font-semibold text-left transition-colors ${
            !currentUnidadeId
              ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <Home className="w-[18px] h-[18px] shrink-0" />
          Início do curso
        </button>
      </nav>

      <p className="px-2.5 pt-4 pb-2 text-[11px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
        Unidades
      </p>
      <nav className="flex flex-col gap-0.5">
        {curso.unidades.map((unidade, index) => {
          const isActive = unidade.id === currentUnidadeId
          return (
            <button
              key={unidade.id}
              type="button"
              onClick={() => handleNavigate(unidade.id)}
              className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm font-semibold text-left transition-colors ${
                isActive
                  ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <span
                className={`flex items-center justify-center w-[22px] h-[22px] rounded-full text-[11px] font-extrabold shrink-0 ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-400'
                }`}
              >
                {index + 1}
              </span>
              <span className="line-clamp-2">{unidade.titulo}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex-1" />

      <div className="hidden md:flex border-t border-[#e6e4f0] dark:border-[#2c2839] pt-3.5 mt-3 items-center gap-2.5 pl-1 pr-1.5">
        <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
          <User className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate">
            {learnerName}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Aluno</p>
        </div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleDarkMode}
                className="w-8 h-8 border-[#e6e4f0] dark:border-[#2c2839] text-gray-600 dark:text-gray-300"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="sr-only">Alternar tema</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isDarkMode ? 'Modo claro' : 'Modo escuro'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  )

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 border-b border-[#e6e4f0] dark:border-[#2c2839] bg-white dark:bg-[#1a1725] px-3 h-16">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(320px,85vw)] p-4 flex flex-col bg-white dark:bg-[#1a1725]"
          >
            <SheetTitle className="sr-only">Navegação do curso</SheetTitle>
            {navContent}
          </SheetContent>
        </Sheet>
        <div className="flex-1" />
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleDarkMode}
                className="w-8 h-8 border-[#e6e4f0] dark:border-[#2c2839] text-gray-600 dark:text-gray-300"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="sr-only">Alternar tema</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isDarkMode ? 'Modo claro' : 'Modo escuro'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <aside className="hidden md:flex w-72 shrink-0 sticky top-0 h-screen overflow-y-auto flex-col border-r border-[#e6e4f0] dark:border-[#2c2839] bg-white dark:bg-[#1a1725] px-4 py-6">
        {navContent}
      </aside>
    </>
  )
}
