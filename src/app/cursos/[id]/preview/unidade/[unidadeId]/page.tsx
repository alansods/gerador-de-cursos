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
  Menu,
  Home,
  Book,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UnidadeConteudo } from "@/components/UnidadeConteudo";

export default function PreviewUnidadePage() {
  const params = useParams();
  const router = useRouter();
  const { state, selecionarCurso } = useGeradorCurso();
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Fixed Top */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 h-16 flex items-center px-4 shadow-sm">
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
                  {(curso.unidades || []).map((u) => (
                    <li key={u.id}>
                      <Link
                        href={`/cursos/${cursoId}/preview/unidade/${u.id}`}
                        onClick={() => setMenuOpen(false)}
                        className={`block text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-gray-100 ${
                          u.id === unidadeId ? "bg-blue-50 text-blue-600 font-semibold" : ""
                        }`}
                      >
                        {u.titulo}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Botão voltar para home do curso */}
        <Link
          href={`/cursos/${cursoId}/preview`}
          className="ml-4 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </Link>

        {/* Course Title in Navbar */}
        <div className="ml-4 flex-1">
          <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {curso.titulo}
          </h2>
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
        </div>
      </main>
    </div>
  );
}
