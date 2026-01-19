"use client";

// Esta página não deve ser exportada estaticamente (usa context e API)
export const dynamic = "error";

import { useGeradorCurso } from "@/context/GeradorCursoContext";
import { usePreview } from "@/hooks/usePreview";
import { usePDF } from "@/hooks/usePDF";
import { useSCORM } from "@/hooks/useSCORM";
import { ExportModal } from "@/components/ExportModal";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  BookOpen,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchInput } from "@/components/SearchInput";
import { PageHeader } from "@/components/PageHeader";

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
  const { generatePDF, isGenerating: isGeneratingPDF } = usePDF();
  const { generateSCORM, isGeneratingSCORM } = useSCORM();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [isDeletingCurso, setIsDeletingCurso] = useState(false);
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
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Debounce do searchTerm para evitar múltiplas requisições
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Ref para prevenir múltiplas requisições simultâneas
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestIdRef = useRef(0);
  const requestCacheRef = useRef<
    Map<
      string,
      {
        data: {
          cursos: CursoGerado[];
          pagination: { total: number; totalPages: number };
        };
        timestamp: number;
      }
    >
  >(new Map());
  const prevFiltersRef = useRef<string>("");

  // Cache duration: 5 seconds
  const CACHE_DURATION = 5000;

  // Resetar página quando filtros mudarem
  useEffect(() => {
    const currentFilters = `${debouncedSearchTerm}-${selectedCategory}-${selectedFormat}-${itemsPerPage}`;

    console.log("[CursosPage] 🔄 useEffect RESET disparado", {
      prevFilters: prevFiltersRef.current,
      currentFilters,
      currentPage,
    });

    // Se é a primeira vez ou filtros não mudaram, não faz nada
    if (
      prevFiltersRef.current === "" ||
      prevFiltersRef.current === currentFilters
    ) {
      prevFiltersRef.current = currentFilters;
      console.log("[CursosPage] ℹ️ Filtros não mudaram ou primeira carga");
      return;
    }

    prevFiltersRef.current = currentFilters;

    // Só reseta se a página não for 1 (evita requisição duplicada)
    if (currentPage !== 1) {
      console.log("[CursosPage] 🔁 Resetando página para 1");
      setCurrentPage(1);
    } else {
      console.log("[CursosPage] ℹ️ Página já é 1, não precisa resetar");
    }
  }, [
    debouncedSearchTerm,
    selectedCategory,
    selectedFormat,
    itemsPerPage,
    currentPage,
  ]);

  // Carregar cursos paginados do servidor
  useEffect(() => {
    // ✅ Verificar se estamos em build estático (SCORM)
    if (process.env.NEXT_OUTPUT_EXPORT === 'true' || process.env.NEXT_PUBLIC_IS_SCORM_BUILD === 'true') {
      console.log("[CursosPage] ⏭️ Build estático detectado, pulando requisição");
      return;
    }

    console.log("[CursosPage] 📡 useEffect FETCH disparado", {
      currentPage,
      itemsPerPage,
      debouncedSearchTerm,
      selectedCategory,
      selectedFormat,
      isLoadingRef: isLoadingRef.current,
    });

    // Prevenir múltiplas requisições simultâneas
    if (isLoadingRef.current) {
      console.log(
        "[CursosPage] 🚫 Requisição bloqueada - já existe uma requisição em andamento"
      );
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      console.log("[CursosPage] ⏹️ Cancelando requisição anterior");
      abortControllerRef.current.abort();
    }

    let cancelled = false;
    const requestId = ++lastRequestIdRef.current;
    console.log("[CursosPage] 🆕 Nova requisição #" + requestId);

    const carregarCursosPaginados = async () => {
      // Construir chave de cache
      const cacheKey = `${currentPage}-${itemsPerPage}-${debouncedSearchTerm}-${selectedCategory}-${selectedFormat}`;
      const cachedData = requestCacheRef.current.get(cacheKey);

      // Verificar se há cache válido
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        console.log("[CursosPage] ⚡ Usando cache para requisição:", cacheKey);
        setCursosPaginados(cachedData.data.cursos || []);
        setTotalCourses(cachedData.data.pagination?.total || 0);
        setTotalPages(cachedData.data.pagination?.totalPages || 1);
        return;
      }

      isLoadingRef.current = true;
      setLoadingCourses(true);

      // Criar novo AbortController para esta requisição
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      if (selectedCategory !== "Todas Categorias") {
        params.append("category", selectedCategory);
      }

      if (selectedFormat !== "Todas Modalidades") {
        params.append("modality", selectedFormat);
      }

      // Construir URL da API
      const apiUrl = `/api/cursos?${params.toString()}`;

      console.log(
        `[CursosPage] 🚀 Iniciando requisição #${requestId}:`,
        apiUrl
      );

      try {
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        });

        // Verificar se a requisição não foi cancelada
        if (cancelled || controller.signal.aborted) {
          console.log(`[CursosPage] ⏹️ Requisição #${requestId} cancelada`);
          return;
        }

        // Verificar se esta é a requisição mais recente
        if (requestId !== lastRequestIdRef.current) {
          console.log(
            `[CursosPage] 🚫 Requisição #${requestId} descartada (não é a mais recente)`
          );
          return;
        }

        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
          const errorText = await response
            .text()
            .catch(() => "Erro desconhecido");
          console.error(
            `[CursosPage] ❌ Requisição #${requestId} falhou:`,
            response.status,
            errorText
          );
          throw new Error(`Erro ao carregar cursos: ${response.status}`);
        }

        const data = await response.json();
        console.log(
          `[CursosPage] ✅ Requisição #${requestId} concluída com sucesso`,
          {
            cursos: data.cursos?.length || 0,
            total: data.pagination?.total || 0,
          }
        );

        // Verificar se a requisição não foi cancelada
        if (!cancelled && !controller.signal.aborted && data.success) {
          // Salvar no cache
          requestCacheRef.current.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });

          // Limpar cache antigo (mais de 1 minuto)
          for (const [key, value] of requestCacheRef.current.entries()) {
            if (Date.now() - value.timestamp > 60000) {
              requestCacheRef.current.delete(key);
            }
          }

          setCursosPaginados(data.cursos || []);
          setTotalCourses(data.pagination?.total || 0);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (error) {
        // Ignorar erros de abort
        if (error instanceof Error && error.name === "AbortError") {
          console.log(`[CursosPage] ⏹️ Requisição #${requestId} abortada`);
          return;
        }

        // Log de erro para debug
        console.error(
          `[CursosPage] ❌ Erro na requisição #${requestId}:`,
          error
        );

        // Não atualizar estado se a requisição foi cancelada
        if (!cancelled && !controller.signal.aborted) {
          // Manter estado anterior em caso de erro
          setCursosPaginados([]);
          setTotalCourses(0);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) {
          isLoadingRef.current = false;
          setLoadingCourses(false);
        }
        if (!controller.signal.aborted) {
          abortControllerRef.current = null;
        }
      }
    };

    carregarCursosPaginados();

    // Cleanup: cancelar requisição se o component desmontar ou effect rodar novamente
    return () => {
      cancelled = true;
      if (abortControllerRef.current) {
        console.log(
          `[CursosPage] 🧹 Cleanup: cancelando requisição #${requestId}`
        );
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isLoadingRef.current = false;
    };
  }, [
    currentPage,
    debouncedSearchTerm,
    selectedCategory,
    selectedFormat,
    itemsPerPage,
  ]);

  // Cursos exibidos (vêm do servidor já paginados)
  const paginatedCourses = cursosPaginados;

  // Verificar se há filtros ativos
  const hasActiveFilters =
    debouncedSearchTerm !== "" ||
    selectedCategory !== "Todas Categorias" ||
    selectedFormat !== "Todas Modalidades";

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Todas Categorias");
    setSelectedFormat("Todas Modalidades");
    setCurrentPage(1);
  };

  const handleCriarCurso = () => router.push("/cursos/novo");
  const handleEditarCurso = (id: string) => {
    selecionarCurso(id);
    router.push(`/cursos/${id}/editar`);
  };
  const handlePreviewCurso = (id: string) => {
    // Buscar o curso nos cursos paginados atuais
    const curso = cursosPaginados.find((c) => c.id === id);
    if (curso) {
      openPreview(curso);
    } else {
      // Fallback: abrir preview diretamente
      window.open(`/cursos/${id}/preview`, '_blank');
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
          {/* Header */}
          <PageHeader
            icon={BookOpen}
            title="Gerenciar Cursos"
            description="Crie e gerencie seus cursos online"
            actionLabel="Novo Curso"
            onAction={handleCriarCurso}
          />

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
              {/* Barra de Busca - Full width on mobile */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground pl-1">
                  Buscar
                </span>
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Título, descrição ou categoria..."
                />
              </div>

              {/* Filtros em linha */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Filtro por Categoria */}
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-xs text-muted-foreground pl-1">
                    Categoria
                  </span>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-full bg-card dark:bg-card border border-border">
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
                </div>

                {/* Filtro por Modalidade */}
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-xs text-muted-foreground pl-1">
                    Modalidade
                  </span>
                  <Select
                    value={selectedFormat}
                    onValueChange={setSelectedFormat}
                  >
                    <SelectTrigger className="w-full bg-card dark:bg-card border border-border">
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
                </div>

                {/* Botão Limpar Filtros */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="w-full sm:w-auto sm:self-end"
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
                    createdAt={curso.dataCriacao}
                    onPreview={() => handlePreviewCurso(curso.id)}
                    onEdit={() => handleEditarCurso(curso.id)}
                    onDelete={() => setShowDeleteConfirm(curso.id)}
                    onExport={() => handleOpenExportModal(curso)}
                  />
                ))}
              </div>

              {/* Paginação */}
              {totalCourses > 0 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Itens por página:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(parseInt(value));
                      }}
                    >
                      <SelectTrigger className="w-[70px] h-8 bg-card dark:bg-card border border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="48">48</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {(currentPage - 1) * itemsPerPage + 1}-
                      {Math.min(currentPage * itemsPerPage, totalCourses)} de{" "}
                      {totalCourses}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentPage(1);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        disabled={currentPage === 1}
                        className="h-8 w-8"
                        title="Primeira página"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentPage(currentPage - 1);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        disabled={currentPage === 1}
                        className="h-8 w-8"
                        title="Página anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentPage(currentPage + 1);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8"
                        title="Próxima página"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentPage(totalPages);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8"
                        title="Última página"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
                disabled={isDeletingCurso}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (showDeleteConfirm) {
                      setIsDeletingCurso(true);
                      await deletarCurso(showDeleteConfirm);

                      // Remover curso da lista local imediatamente
                      setCursosPaginados(prev =>
                        prev.filter(c => c.id !== showDeleteConfirm)
                      );
                      setTotalCourses(prev => Math.max(0, prev - 1));

                      toast.success("Curso excluído com sucesso");
                      setShowDeleteConfirm(null);
                    }
                  } catch (error) {
                    console.error("Erro ao deletar curso:", error);
                    toast.error("Erro ao excluir curso");
                  } finally {
                    setIsDeletingCurso(false);
                  }
                }}
                className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
                disabled={isDeletingCurso}
              >
                {isDeletingCurso && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isDeletingCurso ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Exportação */}
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          onExportPDF={handleExportPDF}
          onExportSCORM={async (filename) => {
            if (selectedCursoForExport) {
              try {
                await generateSCORM(selectedCursoForExport, filename);
                setExportModalOpen(false);
              } catch (error) {
                console.error("Erro ao gerar SCORM:", error);
              }
            }
          }}
          courseName={selectedCursoForExport?.titulo || "Curso"}
          courseId={selectedCursoForExport?.id}
          isGeneratingPDF={isGeneratingPDF}
          isGeneratingSCORM={isGeneratingSCORM}
        />
      </div>
    </PageTransition>
  );
}
