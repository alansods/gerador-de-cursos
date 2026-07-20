'use client'

// Esta página não deve ser exportada estaticamente (usa context e hooks client-side)
// O Next.js deve ignorar esta página durante build estático
export const dynamic = 'error'

import { useEffect, useState } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Menu, Home, User, LogOut, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UnidadeConteudo } from '@/components/UnidadeConteudo'
import { useLMS } from '@/hooks/useLMS'
import { useTheme } from '@/hooks/useTheme'

export default function PreviewUnidadePage() {
  const params = useParams()
  const router = useRouter()
  const { state, selecionarCurso } = useGeradorCurso()
  const [menuOpen, setMenuOpen] = useState(false)
  const { learnerName, isConnected } = useLMS()
  const { isDarkMode, toggleDarkMode } = useTheme()

  const pathname = usePathname()
  const pathParts = pathname.split('/')
  // pathname = /cursos/[slug]/preview/unidade-N
  const cursoUrlSegment = pathParts[2]
  const unidadeSegment = pathParts[4] // 'unidade-1', 'unidade-2', etc.

  const cursoId = (params?.id as string | undefined) || cursoUrlSegment
  const unidadeId = (params?.unidadeId as string | undefined) || unidadeSegment

  // Índice numérico da unidade a partir do segmento 'unidade-N'
  const unidadeIndexFromUrl = unidadeSegment
    ? parseInt(unidadeSegment.replace('unidade-', ''), 10) - 1
    : -1

  // Selecionar o curso ao carregar a página
  // SEMPRE força refresh para garantir dados atualizados
  useEffect(() => {
    if (cursoId) {
      selecionarCurso(cursoId, true) // forceRefresh = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId]) // Remove selecionarCurso das deps para evitar loop infinito

  // Usar cursoAtual do state (que é selecionado) ou buscar na lista
  const curso = state.cursoAtual || state.cursos.find((c) => c.id === cursoId || c.slug === cursoId)

  // Buscar unidade: primeiro pelo índice da URL (confiável), depois por slug/id como fallback
  const unidade =
    curso?.unidades && unidadeIndexFromUrl >= 0
      ? curso.unidades[unidadeIndexFromUrl]
      : curso?.unidades?.find((u) => u.slug === unidadeId || u.id === unidadeId)

  useEffect(() => {
    if (!state.loading && (!curso || !unidade)) {
      if (!curso) {
        router.push('/cursos')
      } else {
        router.push(`/cursos/${cursoUrlSegment}/preview`)
      }
    }
  }, [curso, unidade, router, state.loading, cursoUrlSegment])

  if (!curso || !unidade) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {!curso ? 'Curso não encontrado' : 'Unidade não encontrada'}
          </h1>
        </div>
      </div>
    )
  }

  // Índice da unidade atual (baseado na URL)
  const unidadeIndex =
    unidadeIndexFromUrl >= 0
      ? unidadeIndexFromUrl
      : curso.unidades.findIndex((u) => u.slug === unidadeId || u.id === unidadeId)
  const anteriorId = unidadeIndex > 0 ? `unidade-${unidadeIndex}` : null
  const proximaId = unidadeIndex < curso.unidades.length - 1 ? `unidade-${unidadeIndex + 2}` : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar Fixed Top */}
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b-[1px] border-[#e5e7eb] dark:border-gray-700 z-50 h-16 flex items-center px-4">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
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
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 rounded-md hover:bg-[var(--neutral-150)] text-[var(--fg2)] hover:text-[var(--fg1)]"
                aria-label="Fechar"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Menu Body */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              {/* Home Button */}
              <Link
                href={`/cursos/${cursoUrlSegment}/preview`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] leading-tight transition-all duration-150 text-[var(--fg2)] hover:bg-[var(--neutral-150)] dark:hover:bg-[var(--surface-muted)] hover:text-[var(--fg1)]"
                style={{ marginBottom: '6px' }}
              >
                <Home className="w-4 h-4 shrink-0" style={{ color: 'var(--fg3)' }} />
                <span>Página inicial</span>
              </Link>

              {/* Units Section Header */}
              <div className="px-2.5 pt-3.5 pb-2 text-[11px] uppercase tracking-wider text-[var(--fg3)] font-medium">
                Unidades
              </div>

              {/* Units List */}
              {(curso.unidades || []).map((u, index) => {
                const isActive = `unidade-${index + 1}` === unidadeSegment
                return (
                  <Link
                    key={u.id || `unidade-${index}`}
                    href={`/cursos/${cursoUrlSegment}/preview/unidade-${index + 1}`}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] leading-tight transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--brand-blue-soft)] dark:bg-[#1e3a8a] text-[var(--brand-blue)] font-medium'
                        : 'text-[var(--fg2)] hover:bg-[var(--neutral-150)] dark:hover:bg-[var(--surface-muted)] hover:text-[var(--fg1)]'
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4 shrink-0"
                      style={{ color: isActive ? 'var(--brand-blue)' : 'var(--fg3)' }}
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    <span className="line-clamp-2">
                      {index + 1}. {u.titulo}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Course Title in Navbar */}
        <div className="ml-4 flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
            {curso.titulo}
          </h2>
        </div>

        {/* User Info and Logout */}
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
                    // Fechar a janela ou redirecionar
                    if (window.parent !== window) {
                      window.close()
                    } else {
                      router.push('/cursos')
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

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Banner - full width, fora do container */}
        <div
          style={{
            background: 'linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #1e40af 100%)',
            color: 'white',
            padding: '2.5rem 2rem',
          }}
        >
          <div className="max-w-[900px] mx-auto flex items-center justify-between gap-6">
            <h1 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
              {unidade.titulo.replace(/^UNIDADE\s+\d+[:\s]*/i, '').trim()}
            </h1>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: 'rgba(255,255,255,0.9)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  opacity: 0.8,
                }}
              >
                Unidade
              </span>
              <span style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1 }}>
                {String(unidadeIndex + 1).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Unit Content */}
          <div className="space-y-6">
            <UnidadeConteudo unidade={unidade} />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-8 border-t-[1px] border-[#e5e7eb] dark:border-gray-700">
            {/* Previous Button */}
            <Link
              href={anteriorId !== null ? `/cursos/${cursoUrlSegment}/preview/${anteriorId}` : '#'}
              className={anteriorId !== null ? '' : 'pointer-events-none'}
            >
              <Button
                disabled={anteriorId === null}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Unidade Anterior
              </Button>
            </Link>

            {/* Unit Counter */}
            <div className="flex-1 text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {unidadeIndex + 1} de {curso.unidades.length}
              </span>
            </div>

            {/* Next Button */}
            <Link
              href={proximaId !== null ? `/cursos/${cursoUrlSegment}/preview/${proximaId}` : '#'}
              className={proximaId !== null ? '' : 'pointer-events-none'}
            >
              <Button
                disabled={proximaId === null}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima Unidade
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
