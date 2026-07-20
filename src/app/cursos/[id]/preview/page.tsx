'use client'

// Esta página não deve ser exportada estaticamente (usa context e hooks client-side)
// O Next.js deve ignorar esta página durante build estático
export const dynamic = 'error'

import { useEffect, useState } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Menu,
  Home,
  Clock,
  GraduationCap,
  ArrowRight,
  Loader2,
  Layers,
  User,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLMS } from '@/hooks/useLMS'
import { useTheme } from '@/hooks/useTheme'

export default function PreviewCursoPage() {
  const params = useParams()
  const router = useRouter()
  const { state, selecionarCurso } = useGeradorCurso()
  const [menuOpen, setMenuOpen] = useState(false)
  const { learnerName, isConnected } = useLMS()
  const { isDarkMode, toggleDarkMode } = useTheme()

  const pathname = usePathname()
  // Extrai o segmento do curso diretamente do pathname (sempre confiável)
  const cursoUrlSegment = pathname.split('/')[2]
  const cursoId = (params?.id as string | undefined) || cursoUrlSegment

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

  useEffect(() => {
    if (!state.loading && !curso && state.cursos.length > 0) {
      router.push('/cursos')
    }
  }, [curso, router, state.loading, state.cursos.length])

  // Loading state
  if (state.loading || (!curso && state.cursos.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando curso...</p>
        </div>
      </div>
    )
  }

  // Curso não encontrado (após loading)
  if (!curso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Curso não encontrado</h1>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
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
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] leading-tight transition-all duration-150 bg-[var(--brand-blue-soft)] dark:bg-[#1e3a8a] text-[var(--brand-blue)] font-medium"
                  style={{ marginBottom: '6px' }}
                >
                  <Home className="w-4 h-4 shrink-0" style={{ color: 'var(--brand-blue)' }} />
                  <span>Página inicial</span>
                </Link>

                {/* Units Section Header */}
                <div className="px-2.5 pt-3.5 pb-2 text-[11px] uppercase tracking-wider text-[var(--fg3)] font-medium">
                  Unidades
                </div>

                {/* Units List */}
                {(curso.unidades || []).map((unidade, index) => (
                  <Link
                    key={unidade.id || `unidade-${index}`}
                    href={`/cursos/${cursoUrlSegment}/preview/unidade-${index + 1}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] leading-tight transition-all duration-150 text-[var(--fg2)] hover:bg-[var(--neutral-150)] dark:hover:bg-[var(--surface-muted)] hover:text-[var(--fg1)]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4 shrink-0"
                      style={{ color: 'var(--fg3)' }}
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    <span className="line-clamp-2">
                      {index + 1}. {unidade.titulo}
                    </span>
                  </Link>
                ))}
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
                        typeof (window as { SCORM?: { terminate: () => void } }).SCORM
                          ?.terminate === 'function'
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
          {/* Hero Section - Dark Background */}
          <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white py-16">
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
              {/* Category Badge */}
              <div className="mb-4">
                <Badge className="bg-white/20 dark:bg-white/10 text-white border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-white/20">
                  {curso.categoria}
                </Badge>
              </div>

              {/* Course Title */}
              <h1 className="text-3xl md:text-5xl font-bold mb-4">{curso.titulo}</h1>

              {/* Course Description */}
              <p className="text-lg md:text-xl text-blue-100 dark:text-gray-300 mb-8 max-w-3xl">
                {curso.descricao}
              </p>

              {/* Course Metadata */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-300 dark:text-gray-400" />
                  <span className="text-blue-100 dark:text-gray-300">{curso.cargaHoraria}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-300 dark:text-gray-400" />
                  <span className="text-blue-100 dark:text-gray-300">{curso.modalidade}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Units Section */}
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
              Unidades do Curso
            </h2>

            <div className="space-y-6">
              {curso.unidades && curso.unidades.length === 0 ? (
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <p>Nenhuma unidade criada ainda.</p>
                  </CardContent>
                </Card>
              ) : (
                curso.unidades.map((unidade, unidadeIndex) => (
                  <Link
                    key={unidade.id || `unidade-${unidadeIndex}`}
                    href={`/cursos/${cursoUrlSegment}/preview/unidade-${unidadeIndex + 1}`}
                    className="block"
                  >
                    <Card className="overflow-hidden bg-white dark:bg-gray-800 hover:border-orange-600 dark:hover:border-orange-500 dark:border-gray-700 transition-all duration-200 cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
                          {/* Icon Circle */}
                          <div className="shrink-0">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-600 dark:bg-orange-700">
                              <Layers className="w-6 h-6 text-white" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 text-center sm:text-left">
                            {/* Unit Label */}
                            <div>
                              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                                UNIDADE {String(unidadeIndex + 1).padStart(2, '0')}
                              </span>
                            </div>

                            {/* Unit Title */}
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                              {unidade.titulo}
                            </h3>

                            {/* Unit Description */}
                            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed my-2">
                              {unidade.descricao}
                            </p>
                          </div>

                          {/* Access Icon */}
                          <div className="shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 h-10 w-10 pointer-events-none"
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
    </PageTransition>
  )
}
