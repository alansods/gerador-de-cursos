'use client'

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
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UnidadeConteudo } from "@/components/UnidadeConteudo";
import { useLMS } from "@/hooks/useLMS";

export default function PreviewUnidadePage() {
  const params = useParams();
  const router = useRouter();
  const { state, selecionarCurso } = useGeradorCurso();
  const [menuOpen, setMenuOpen] = useState(false);
  const { learnerName, isConnected } = useLMS();

  const cursoId = params.id as string;
  const unidadeId = params.unidadeId as string;
  
  // Selecionar o curso ao carregar a página
  useEffect(() => {
    if (cursoId) {
      selecionarCurso(cursoId);
    }
  }, [cursoId, selecionarCurso]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Fixed Top */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b-[1px] border-[#e5e7eb] z-50 h-16 flex items-center px-4">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] sm:w-[400px] p-0 bg-linear-to-b from-gray-50 to-white">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
              <SheetTitle className="text-left text-xl font-bold text-gray-900">
                Unidades do curso
              </SheetTitle>
            </SheetHeader>
            <nav className="px-4 py-6 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
              {/* Home Button */}
              <Link
                href={`/cursos/${cursoId}/preview`}
                onClick={() => setMenuOpen(false)}
                className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white">
                  <Home className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 text-sm leading-snug">
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
                        ? "border-orange-500 bg-orange-50/50"
                        : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                    }`}
                  >
                    {/* Badge with number */}
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 text-sm leading-snug">
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
          <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {curso.titulo}
          </h2>
        </div>

        {/* User Info and Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-700">
            <User className="h-5 w-5" />
            <span className="text-sm font-medium">{learnerName}</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (isConnected && typeof window !== 'undefined' && (window as any).SCORM) {
                      try {
                        (window as any).SCORM.terminate();
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
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Sair</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
          <div className="flex items-center justify-between gap-4 mt-8 pt-8 border-t-[1px] border-[#e5e7eb]">
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
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Unidade Anterior
              </Button>
            </Link>

            {/* Unit Counter */}
            <div className="flex-1 text-center">
              <span className="text-sm text-gray-600">
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
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
