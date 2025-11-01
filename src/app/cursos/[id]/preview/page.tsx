"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGeradorCurso } from "@/context/GeradorCursoContext";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Menu,
  Home,
  Book,
  Clock,
  GraduationCap,
  Play,
  ChevronRight,
  Loader2,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WelcomeMessage } from "@/components/WelcomeMessage";

export default function PreviewCursoPage() {
  const params = useParams();
  const router = useRouter();
  const { state, selecionarCurso } = useGeradorCurso();
  const [menuOpen, setMenuOpen] = useState(false);

  const cursoId = params.id as string;

  // Selecionar o curso ao carregar a página
  useEffect(() => {
    if (cursoId) {
      selecionarCurso(cursoId);
    }
  }, [cursoId, selecionarCurso]);

  // Usar cursoAtual do state (que é selecionado) ou buscar na lista
  const curso = state.cursoAtual || state.cursos.find((c) => c.id === cursoId);

  useEffect(() => {
    if (!state.loading && !curso && state.cursos.length > 0) {
      router.push("/cursos");
    }
  }, [curso, router, state.loading, state.cursos.length]);

  // Loading state
  if (state.loading || (!curso && state.cursos.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando curso...</p>
        </div>
      </div>
    );
  }

  // Curso não encontrado (após loading)
  if (!curso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Curso não encontrado
          </h1>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
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
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left">Navegação</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 space-y-4">
                <Link
                  href={`/cursos/${cursoId}/preview`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-gray-100"
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </Link>
                <div>
                  <h3 className="flex items-center gap-3 text-lg font-semibold text-gray-700 mb-3 px-2">
                    <Book className="w-5 h-5" />
                    <span>Unidades</span>
                  </h3>
                  <ul className="space-y-2 pl-4 border-l-2 border-gray-200">
                    {(curso.unidades || []).map((unidade) => (
                      <li key={unidade.id}>
                        <Link
                          href={`/cursos/${cursoId}/preview/unidade/${unidade.id}`}
                          onClick={() => setMenuOpen(false)}
                          className="block text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-gray-100"
                        >
                          {unidade.titulo}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Course Title in Navbar */}
          <div className="ml-4">
            <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {curso.titulo}
            </h2>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-16">
          {/* Hero Section - Dark Background */}
          <div className="bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
              {/* Category Badge */}
              <div className="mb-4">
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {curso.categoria}
                </Badge>
              </div>

              {/* Course Title */}
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                {curso.titulo}
              </h1>

              {/* Course Description */}
              <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-3xl">
                {curso.descricao}
              </p>

              {/* Course Metadata */}
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-300" />
                  <span className="text-blue-100">{curso.cargaHoraria}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-300" />
                  <span className="text-blue-100">{curso.modalidade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-100">
                    Instrutor: {curso.instrutor}
                  </span>
                </div>
              </div>

              {/* Continue Button */}
              {curso.unidades && curso.unidades.length > 0 && (
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-gray-100 font-semibold"
                  onClick={() => {
                    const primeiraUnidade = curso.unidades?.[0];
                    if (primeiraUnidade) {
                      router.push(
                        `/cursos/${cursoId}/preview/unidade/${primeiraUnidade.id}`
                      );
                    }
                  }}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Começar Curso
                </Button>
              )}
            </div>
          </div>

          {/* Units Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Welcome Message */}
            <WelcomeMessage className="mb-8" />

            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Unidades do Curso
            </h2>

            <div className="space-y-6">
              {curso.unidades && curso.unidades.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <p>Nenhuma unidade criada ainda.</p>
                  </CardContent>
                </Card>
              ) : (
                curso.unidades.map((unidade, unidadeIndex) => (
                  <Card
                    key={unidade.id}
                    className="overflow-hidden bg-white"
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-5">
                        {/* Icon Circle */}
                        <div className="shrink-0">
                          <div className="flex items-center justify-center w-14 h-14 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl text-white">
                            <Layers className="w-7 h-7" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 ">
                          {/* Unit Label */}
                          <div>
                            <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                              UNIDADE{" "}
                              {String(unidadeIndex + 1).padStart(2, "0")}
                            </span>
                          </div>

                          {/* Unit Title */}
                          <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                            {unidade.titulo}
                          </h3>

                          {/* Unit Description */}
                          <p className="text-gray-600 text-base leading-relaxed my-2">
                            {unidade.descricao}
                          </p>

                          {/* View Full Content Button */}
                          <div className="pt-2">
                            <Link
                              href={`/cursos/${cursoId}/preview/unidade/${unidade.id}`}
                            >
                              <Button
                                variant="outline"
                                className="border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600 hover:text-orange-700 font-medium"
                              >
                                Ver Conteúdo Completo
                                <ChevronRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
