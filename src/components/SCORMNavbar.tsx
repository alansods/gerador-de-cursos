'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Menu, Home, BookOpen, X, User, LogOut, Moon, Sun } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { CursoGerado } from '@/types/gerador-curso'
import { useLMS } from '@/hooks/useLMS'
import { useTheme } from '@/hooks/useTheme'

interface SCORMNavbarProps {
  curso: CursoGerado
  currentUnidadeId?: string
  showMenu?: boolean
  onNavigate?: (unitId: string | null) => void
}

export function SCORMNavbar({
  curso,
  currentUnidadeId,
  showMenu = true,
  onNavigate,
}: SCORMNavbarProps) {
  const { learnerName, isConnected } = useLMS()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [open, setOpen] = React.useState(false)

  // Helper to handle navigation
  const handleNavClick = (e: React.MouseEvent, unitId: string | null) => {
    if (onNavigate) {
      e.preventDefault()
      onNavigate(unitId)
      setOpen(false) // Close menu after navigation
    }
  }

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
            className="w-[min(380px,90vw)] p-0 bg-white dark:bg-[#1a202c]"
            hideClose
            style={{
              boxShadow: '0 20px 50px rgba(0,0,0,.18)',
            }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-[var(--border)] flex flex-row items-start gap-3">
              <div className="flex-1">
                <SheetTitle className="text-[15px] font-medium text-[var(--fg1)] mb-0.5">
                  Conteúdo do curso
                </SheetTitle>
                <p className="text-xs text-[var(--fg2)] m-0">{curso.titulo}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-md hover:bg-[var(--neutral-150)] text-[var(--fg2)] hover:text-[var(--fg1)]"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Menu Body */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              {/* Home Button */}
              <a
                href={
                  onNavigate
                    ? '#'
                    : process.env.NEXT_PUBLIC_IS_SCORM_BUILD === 'true'
                      ? currentUnidadeId
                        ? '../../index.html'
                        : '#'
                      : currentUnidadeId
                        ? '../index.html'
                        : '#'
                }
                onClick={(e) => handleNavClick(e, null)}
                target={onNavigate ? undefined : '_top'}
                data-scorm-nav="true"
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] leading-tight transition-all duration-150 ${
                  !currentUnidadeId
                    ? 'bg-[var(--brand-blue-soft)] dark:bg-[#1e3a8a] text-[var(--brand-blue)] font-medium'
                    : 'text-[var(--fg2)] hover:bg-[var(--neutral-150)] dark:hover:bg-[var(--surface-muted)] hover:text-[var(--fg1)]'
                }`}
                style={{ marginBottom: '6px' }}
              >
                <Home
                  className="w-4 h-4 shrink-0"
                  style={{ color: !currentUnidadeId ? 'var(--brand-blue)' : 'var(--fg3)' }}
                />
                <span>Página inicial</span>
              </a>

              {/* Units Section Header */}
              <div className="px-2.5 pt-3.5 pb-2 text-[11px] uppercase tracking-wider text-[var(--fg3)] font-medium">
                Unidades
              </div>

              {/* Units List */}
              {(curso.unidades || []).map((u, index) => {
                const isActive = currentUnidadeId ? u.id === currentUnidadeId : false

                // Generate href based on context
                let href: string

                if (onNavigate) {
                  href = '#'
                } else if (process.env.NEXT_PUBLIC_IS_SCORM_BUILD === 'true') {
                  if (currentUnidadeId) {
                    href = u.id === currentUnidadeId ? '#' : `./${u.id}.html`
                  } else {
                    href = `./scorm-preview/unidade/${u.id}.html`
                  }
                } else {
                  if (currentUnidadeId) {
                    href = u.id === currentUnidadeId ? '#' : `${u.id}.html`
                  } else {
                    href = `unidade/${u.id}.html`
                  }
                }

                return (
                  <a
                    key={u.id}
                    href={href}
                    onClick={(e) => handleNavClick(e, u.id)}
                    target={onNavigate ? undefined : '_top'}
                    data-scorm-nav="true"
                    data-unit-id={u.id}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] leading-tight transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--brand-blue-soft)] dark:bg-[#1e3a8a] text-[var(--brand-blue)] font-medium'
                        : 'text-[var(--fg2)] hover:bg-[var(--neutral-150)] dark:hover:bg-[var(--surface-muted)] hover:text-[var(--fg1)]'
                    }`}
                  >
                    <BookOpen
                      className="w-4 h-4 shrink-0"
                      style={{ color: isActive ? 'var(--brand-blue)' : 'var(--fg3)' }}
                    />
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

      {/* Course Title in Navbar */}
      <div className="ml-4 flex-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
          {curso.titulo}
        </h2>
      </div>

      {/* User Info, Dark Mode Toggle and Logout */}
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <User className="h-5 w-5" />
            <span className="text-sm font-medium">{learnerName}</span>
          </div>

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

          {/* Logout Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (
                    isConnected &&
                    typeof window !== 'undefined' &&
                    'SCORM' in window &&
                    typeof (window as { SCORM?: { terminate: () => void } }).SCORM?.terminate ===
                      'function'
                  ) {
                    try {
                      ;(window as { SCORM: { terminate: () => void } }).SCORM.terminate()
                    } catch (error) {
                      console.error('[LMS] Erro ao sair:', error)
                    }
                  }
                  // Close window or redirect
                  if (window.parent !== window) {
                    window.close()
                  } else {
                    window.close()
                  }
                }}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sair</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sair</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </nav>
  )
}
