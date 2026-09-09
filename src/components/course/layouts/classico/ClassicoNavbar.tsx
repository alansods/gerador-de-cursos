'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Menu, Home, BookOpen, X, Moon, Sun, Check } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { CursoGerado } from '@/types/gerador-curso'
import type { ResumoProgresso } from '@/lib/scorm-progress'
import { useTheme } from '@/hooks/useTheme'

interface ClassicoNavbarProps {
  curso: CursoGerado
  currentUnidadeId?: string
  showMenu?: boolean
  onNavigate: (unitId: string | null) => void
  progresso: ResumoProgresso
  concluidas?: boolean[]
}

export function ClassicoNavbar({
  curso,
  currentUnidadeId,
  showMenu = true,
  onNavigate,
  progresso,
  concluidas,
}: ClassicoNavbarProps) {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [open, setOpen] = React.useState(false)

  // Helper to handle navigation
  const handleNavClick = (e: React.MouseEvent, unitId: string | null) => {
    e.preventDefault()
    onNavigate(unitId)
    setOpen(false) // Close menu after navigation
  }

  const progressoCompleto = progresso.percentual >= 100
  const progressoTextColor = progressoCompleto
    ? 'text-green-600 dark:text-green-400'
    : 'text-blue-600 dark:text-blue-400'
  const progressoBarColor = progressoCompleto ? 'bg-green-600' : 'bg-blue-600'

  const progressBar = (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">Progresso</span>
        <span className={`font-semibold ${progressoTextColor}`}>{progresso.percentual}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressoBarColor}`}
          style={{ width: `${progresso.percentual}%` }}
        />
      </div>
    </div>
  )

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-[#e5e7eb] dark:border-gray-700 z-50 h-16 flex items-center px-4">
      {showMenu && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(380px,90vw)] p-0 bg-card"
            hideClose
            style={{
              boxShadow: '0 20px 50px rgba(0,0,0,.18)',
            }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border">
              <div className="flex flex-row items-start gap-3">
                <div className="flex-1">
                  <SheetTitle className="text-[15px] font-semibold text-foreground line-clamp-2">
                    {curso.titulo}
                  </SheetTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3.5">{progressBar}</div>
            </div>

            {/* Menu Body */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              {/* Home Button */}
              <a
                href="#"
                onClick={(e) => handleNavClick(e, null)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] leading-tight transition-all duration-150 ${
                  !currentUnidadeId
                    ? 'bg-secondary text-secondary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                style={{ marginBottom: '6px' }}
              >
                <Home
                  className={`w-4 h-4 shrink-0 ${
                    !currentUnidadeId ? 'text-secondary-foreground' : 'text-muted-foreground/70'
                  }`}
                />
                <span>Página inicial</span>
              </a>

              {/* Units Section Header */}
              <div className="px-2.5 pt-3.5 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                Unidades
              </div>

              {/* Units List */}
              {(curso.unidades || []).map((u, index) => {
                const isActive = currentUnidadeId ? u.id === currentUnidadeId : false
                const concluida = concluidas?.[index] ?? false

                const estiloItem = isActive
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : concluida
                    ? 'text-green-700 dark:text-green-400 hover:bg-muted'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'

                return (
                  <a
                    key={u.id}
                    href="#"
                    onClick={(e) => handleNavClick(e, u.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] leading-tight transition-all duration-150 ${estiloItem}`}
                  >
                    {concluida && !isActive ? (
                      <Check
                        className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400"
                        strokeWidth={3}
                      />
                    ) : (
                      <BookOpen
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-secondary-foreground' : 'text-muted-foreground/70'
                        }`}
                      />
                    )}
                    <span className="line-clamp-2">
                      {index + 1}. {u.titulo}
                    </span>
                  </a>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
      )}

      {/* Course Title in Navbar (desktop only) */}
      <div className="hidden sm:block ml-4 flex-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
          {curso.titulo}
        </h2>
      </div>

      <div className="flex-1 sm:hidden" />

      {/* Progress and Dark Mode Toggle */}
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block w-60">{progressBar}</div>

          {/* Dark Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">Alternar tema</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </nav>
  )
}
