'use client'

// Esta página não deve ser exportada estaticamente (usa context e hooks client-side)
// O Next.js deve ignorar esta página durante build estático
export const dynamic = 'error';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGeradorCurso } from "@/context/GeradorCursoContext";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Menu,
  Home,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UnidadeConteudo } from "@/components/UnidadeConteudo";
import { useLMS } from "@/hooks/useLMS";
import { useTheme } from "@/hooks/useTheme";

export default function PreviewUnidadePage() {
  const params = useParams();
  const router = useRouter();
  const { state, selecionarCurso } = useGeradorCurso();
  const [menuOpen, setMenuOpen] = useState(false);
  const { learnerName, isConnected } = useLMS();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const cursoId = params.id as string;
  const unidadeId = params.unidadeId as string;
  
  // Selecionar o curso ao carregar a página
  // SEMPRE força refresh para garantir dados atualizados
  useEffect(() => {
    if (cursoId) {
      selecionarCurso(cursoId, true); // forceRefresh = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId]); // Remove selecionarCurso das deps para evitar loop infinito

  // Usar cursoAtual do state (que é selecionado) ou buscar na lista
  const curso = state.cursoAtual || state.cursos.find((c) => c.id === cursoId);
  const unidade = curso?.unidades?.find((u) => u.id === unidadeId);

  useEffect(() => {
    if (!state.loading && (!curso || !unidade)) {
      if (!curso) {
        router.push("/cursos");
      } else {
        router.push(`/cursos/${cursoId}/preview`);
      }
    }
  }, [curso, unidade, router, state.loading, cursoId]);

  if (!curso || !unidade) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {!curso ? "Curso não encontrado" : "Unidade não encontrada"}
          </h1>
        </div>
      </div>
    );
  }

  const unidadeIndex = curso.unidades.findIndex((u) => u.id === unidadeId);
  const unidadeAnterior = unidadeIndex > 0 ? curso.unidades[unidadeIndex - 1] : null;
  const proximaUnidade = unidadeIndex < curso.unidades.length - 1 ? curso.unidades[unidadeIndex + 1] : null;

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
          <SheetContent side="left" className="w-[320px] sm:w-[400px] p-0 bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <SheetTitle className="text-left text-xl font-bold text-gray-900 dark:text-gray-100">
                Unidades do curso
              </SheetTitle>
            </SheetHeader>
            <nav className="px-4 py-6 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
              {/* Home Button */}
              <Link
                href={`/cursos/${cursoId}/preview`}
                onClick={() => setMenuOpen(false)}
                className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-900/30 transition-all duration-200"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 flex items-center justify-center text-white">
                  <Home className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 text-sm leading-snug">
                    Página inicial
                  </span>
                </div>
              </Link>

              {/* Units Section */}
              {(curso.unidades || []).map((u, index) => {
                const isActive = u.id === unidadeId;
                return (
                  <Link
                    key={u.id}
                    href={`/cursos/${cursoId}/preview/unidade/${u.id}`}
                    onClick={() => setMenuOpen(false)}
                    className={`group flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                      isActive
                        ? "border-orange-500 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-900/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-900/30"
                    }`}
                  >
                    {/* Badge with number */}
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 flex items-center justify-center text-white font-bold text-sm">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 text-sm leading-snug">
                        {u.titulo}
                      </p>
                    </div>
                  </Link>
                );
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
        <TooltipProvider>
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
                    if (isConnected && typeof window !== 'undefined' && 'SCORM' in window && typeof (window as { SCORM?: { terminate: () => void } }).SCORM?.terminate === 'function') {
                      try {
                        (window as { SCORM: { terminate: () => void } }).SCORM.terminate();
                      } catch (error) {
                        console.error('[LMS] Erro ao sair:', error);
                      }
                    }
                    // Fechar a janela ou redirecionar
                    if (window.parent !== window) {
                      window.close();
                    } else {
                      router.push('/cursos');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Unit Content */}
          <UnidadeConteudo
            unidade={unidade}
            unidadeIndex={unidadeIndex}
          />

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-8 border-t-[1px] border-[#e5e7eb] dark:border-gray-700">
            {/* Previous Button */}
            <Link
              href={
                unidadeAnterior
                  ? `/cursos/${cursoId}/preview/unidade/${unidadeAnterior.id}`
                  : '#'
              }
              className={unidadeAnterior ? '' : 'pointer-events-none'}
            >
              <Button
                disabled={!unidadeAnterior}
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
              href={
                proximaUnidade
                  ? `/cursos/${cursoId}/preview/unidade/${proximaUnidade.id}`
                  : '#'
              }
              className={proximaUnidade ? '' : 'pointer-events-none'}
            >
              <Button
                disabled={!proximaUnidade}
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
  );
}
