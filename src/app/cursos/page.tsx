"use client";

import { useGeradorCurso } from "@/context/GeradorCursoContext";
import { usePreview } from "@/hooks/usePreview";
import { useSCORM } from "@/hooks/useSCORM";
import { usePDF } from "@/hooks/usePDF";
import { ExportModal } from "@/components/ExportModal";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CourseCard } from "@/components/CourseCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import type { CursoGerado } from "@/types/gerador-curso";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2, AlertCircle, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ITEMS_PER_PAGE = 6;

const CATEGORIES = [
  "Todas Categorias",
  "Gastronomia",
  "Tecnologia",
  "Marketing",
  "Design",
  "Gestão",
  "Arte",
  "Idiomas",
];

const MODALIDADES = ["Todas Modalidades", "Presencial", "Online", "Híbrido"];

export default function CursosPage() {
  const { state, deletarCurso, selecionarCurso } = useGeradorCurso();
  const [cursosPaginados, setCursosPaginados] = useState<CursoGerado[]>([]);
  const { openPreview } = usePreview();
  const { generateSCORMPackage, isGenerating: isGeneratingSCORM } = useSCORM();
  const { generatePDF, isGenerating: isGeneratingPDF } = usePDF();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedCursoForExport, setSelectedCursoForExport] =
    useState<CursoGerado | null>(null);

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("Todas Categorias");
  const [selectedFormat, setSelectedFormat] =
    useState<string>("Todas Modalidades");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedFormat]);

  // Carregar cursos paginados do servidor
  useEffect(() => {
    const carregarCursosPaginados = async () => {
      setLoadingCourses(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        });

        if (searchTerm) {
          params.append("search", searchTerm);
        }

        if (selectedCategory !== "Todas Categorias") {
          params.append("category", selectedCategory);
        }

        if (selectedFormat !== "Todas Modalidades") {
          params.append("modality", selectedFormat);
        }

        const response = await fetch(`/api/cursos?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setCursosPaginados(data.cursos || []);
          setTotalCourses(data.pagination?.total || 0);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error("Erro ao carregar cursos:", error);
      } finally {
        setLoadingCourses(false);
      }
    };

    carregarCursosPaginados();
  }, [currentPage, searchTerm, selectedCategory, selectedFormat]);

  // Cursos exibidos (vêm do servidor já paginados)
  const paginatedCourses = cursosPaginados;

  // Verificar se há filtros ativos
  const hasActiveFilters =
    searchTerm !== "" ||
    selectedCategory !== "Todas Categorias" ||
    selectedFormat !== "Todas Modalidades";

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Todas Categorias");
    setSelectedFormat("Todas Modalidades");
    setCurrentPage(1);
  };

  // Gerar números de página para exibir
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleCriarCurso = () => router.push("/cursos/novo");
  const handleEditarCurso = (id: string) => {
    selecionarCurso(id);
    router.push(`/cursos/${id}/editar`);
  };
  const handlePreviewCurso = (id: string) => {
    const curso = state.cursos.find((c) => c.id === id);
    if (curso) {
      openPreview(curso);
    }
  };
  const handleOpenExportModal = (curso: CursoGerado) => {
    setSelectedCursoForExport(curso);
    setExportModalOpen(true);
  };
  const handleExportPDF = async (filename: string) => {
    if (selectedCursoForExport) {
      try {
        await generatePDF(selectedCursoForExport, filename);
        setExportModalOpen(false);
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
      }
    }
  };
  const handleExportSCORM = async (filename: string) => {
    if (selectedCursoForExport) {
      try {
        await generateSCORMPackage(selectedCursoForExport, filename);
        setExportModalOpen(false);
      } catch (error) {
        console.error("Erro ao gerar SCORM:", error);
      }
    }
  };

  if (state.loading || loadingCourses) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando cursos...</p>
        </div>
      </div>
    );
  }

  const showError = state.error && state.cursos.length === 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Conteúdo Principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header - Integrado na página */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gerador de Cursos
              </h1>
              <p className="text-muted-foreground mt-2">
                Crie e gerencie seus cursos online
              </p>
            </div>
            <Button
              onClick={handleCriarCurso}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Curso
            </Button>
          </div>
          {showError && (
            <div className="mb-6 bg-secondary border border-border rounded-lg p-6">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-primary mt-0.5 mr-3 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    🔧 Configuração do Banco de Dados Necessária
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {state.error}
                  </p>
                  <div className="bg-card rounded border border-border p-4 mb-3">
                    <p className="text-xs font-semibold text-foreground mb-2">
                      📋 Passos para configurar:
                    </p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>
                        Criar conta no{" "}
                        <a
                          href="https://neon.tech"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium text-primary"
                        >
                          Neon.tech
                        </a>
                      </li>
                      <li>Copiar a connection string do Neon</li>
                      <li>
                        Criar arquivo{" "}
                        <code className="bg-muted px-1 rounded">
                          .env.local
                        </code>{" "}
                        com{" "}
                        <code className="bg-muted px-1 rounded">
                          DATABASE_URL=&quot;...&quot;
                        </code>
                      </li>
                      <li>
                        Executar:{" "}
                        <code className="bg-muted px-1 rounded">
                          npx prisma migrate dev
                        </code>
                      </li>
                      <li>
                        Executar:{" "}
                        <code className="bg-muted px-1 rounded">
                          pnpm db:seed
                        </code>
                      </li>
                      <li>Reiniciar o servidor</li>
                    </ol>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📚 Veja o arquivo{" "}
                    <code className="bg-muted px-1 rounded">
                      QUICK_START.md
                    </code>{" "}
                    para instruções detalhadas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Busca e Filtros */}
          {!showError && (
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Barra de Busca */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    type="text"
                    placeholder="Buscar cursos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-card dark:bg-card border border-border"
                  />
                </div>

                {/* Filtro por Categoria */}
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-[180px] bg-card dark:bg-card border border-border">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro por Modalidade */}
                <Select
                  value={selectedFormat}
                  onValueChange={setSelectedFormat}
                >
                  <SelectTrigger className="w-[180px] bg-card dark:bg-card border border-border">
                    <SelectValue placeholder="Modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALIDADES.map((modalidade) => (
                      <SelectItem key={modalidade} value={modalidade}>
                        {modalidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Botão Limpar Filtros */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="w-full sm:w-auto"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Seção Seus Cursos */}
          {!showError && (
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-foreground">
                Seus Cursos
              </h2>
              <div className="text-sm text-muted-foreground">
                {totalCourses === 1
                  ? "1 curso encontrado"
                  : `${totalCourses} cursos encontrados`}
              </div>
            </div>
          )}

          {/* Grid de Cursos */}
          {!state.loading &&
          !loadingCourses &&
          !showError &&
          paginatedCourses.length === 0 ? (
            <div className="text-center py-24">
              <div className="mx-auto w-40 h-40 bg-muted rounded-full flex items-center justify-center mb-8">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                {hasActiveFilters
                  ? "Nenhum curso encontrado"
                  : "Nenhum curso criado ainda"}
              </h3>
              <p className="text-muted-foreground mb-8">
                {hasActiveFilters
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando seu primeiro curso"}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={handleCriarCurso}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeiro Curso
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCourses.map((curso) => (
                  <CourseCard
                    key={curso.id}
                    title={curso.titulo}
                    description={curso.descricao}
                    category={curso.categoria}
                    duration={curso.cargaHoraria}
                    units={curso.unidades?.length || 0}
                    format={curso.modalidade}
                    onPreview={() => handlePreviewCurso(curso.id)}
                    onEdit={() => handleEditarCurso(curso.id)}
                    onDelete={() => setShowDeleteConfirm(curso.id)}
                    onExport={() => handleOpenExportModal(curso)}
                  />
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          }}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {getPageNumbers().map((page, index) => {
                        if (page === "ellipsis") {
                          return (
                            <PaginationItem key={`ellipsis-${index}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }

                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          }}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de Confirmação de Exclusão */}
        <Dialog
          open={!!showDeleteConfirm}
          onOpenChange={() => setShowDeleteConfirm(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja deletar este curso? Esta ação não pode
                ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (showDeleteConfirm) {
                      await deletarCurso(showDeleteConfirm);
                      toast.success("Curso excluído");
                    }
                  } catch (error) {
                    console.error("Erro ao deletar curso:", error);
                    toast.error("Erro ao excluir");
                  } finally {
                    setShowDeleteConfirm(null);
                  }
                }}
                className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Exportação */}
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          onExportPDF={handleExportPDF}
          onExportSCORM={handleExportSCORM}
          courseName={selectedCursoForExport?.titulo || "Curso"}
          isGeneratingPDF={isGeneratingPDF}
          isGeneratingSCORM={isGeneratingSCORM}
        />
      </div>
    </PageTransition>
  );
}
