"use client";

import { useGeradorCurso } from "@/context/GeradorCursoContext";
import { usePreview } from "@/hooks/usePreview";
import { useSCORM } from "@/hooks/useSCORM";
import { usePDF } from "@/hooks/usePDF";
import { ExportModal } from "@/components/ExportModal";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Download,
  BookOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CursosPage() {
  const { state, deletarCurso, selecionarCurso } = useGeradorCurso();
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
        // Erro já foi tratado no hook, modal permanece aberto
        console.error('Erro ao gerar PDF:', error);
      }
    }
  };
  const handleExportSCORM = async (filename: string) => {
    if (selectedCursoForExport) {
      try {
        await generateSCORMPackage(selectedCursoForExport, filename);
        setExportModalOpen(false);
      } catch (error) {
        // Erro já foi tratado no hook, modal permanece aberto
        console.error('Erro ao gerar SCORM:', error);
      }
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando cursos...</p>
        </div>
      </div>
    );
  }

  const showError = state.error && state.cursos.length === 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b-[1px] border-[#e5e7eb]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gerador de Cursos
                </h1>
                <p className="text-gray-600 mt-2">
                  Crie e gerencie seus cursos online
                </p>
              </div>
              <Button
                onClick={handleCriarCurso}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Curso
              </Button>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showError && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5 mr-3 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-blue-900 mb-2">
                    🔧 Configuração do Banco de Dados Necessária
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">{state.error}</p>
                  <div className="bg-white rounded border border-blue-200 p-4 mb-3">
                    <p className="text-xs font-semibold text-blue-900 mb-2">
                      📋 Passos para configurar:
                    </p>
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      <li>
                        Criar conta no{" "}
                        <a
                          href="https://neon.tech"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          Neon.tech
                        </a>
                      </li>
                      <li>Copiar a connection string do Neon</li>
                      <li>
                        Criar arquivo{" "}
                        <code className="bg-blue-100 px-1 rounded">
                          .env.local
                        </code>{" "}
                        com{" "}
                        <code className="bg-blue-100 px-1 rounded">
                          DATABASE_URL=&quot;...&quot;
                        </code>
                      </li>
                      <li>
                        Executar:{" "}
                        <code className="bg-blue-100 px-1 rounded">
                          npx prisma migrate dev
                        </code>
                      </li>
                      <li>
                        Executar:{" "}
                        <code className="bg-blue-100 px-1 rounded">
                          pnpm db:seed
                        </code>
                      </li>
                      <li>Reiniciar o servidor</li>
                    </ol>
                  </div>
                  <p className="text-xs text-blue-700">
                    📚 Veja o arquivo{" "}
                    <code className="bg-blue-100 px-1 rounded">
                      QUICK_START.md
                    </code>{" "}
                    para instruções detalhadas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!state.loading && !showError && state.cursos.length === 0 ? (
            <div className="text-center py-24">
              <div className="mx-auto w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center mb-8">
                <Plus className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Nenhum curso criado ainda
              </h3>
              <p className="text-gray-600 mb-8">
                Comece criando seu primeiro curso
              </p>
              <Button
                onClick={handleCriarCurso}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar Primeiro Curso
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
              {state.cursos.map((curso) => (
                <Card
                  key={curso.id}
                  className=""
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                          {curso.titulo}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {curso.categoria}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mb-6">
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {curso.descricao}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {curso.cargaHoraria}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {curso.modalidade}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {curso.unidades?.length || 0} unidade
                          {(curso.unidades?.length || 0) !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 my-4"></div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewCurso(curso.id)}
                        className="flex-1 min-w-[100px]"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Preview</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditarCurso(curso.id)}
                        className="flex-1 min-w-[100px]"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(curso.id)}
                        className="flex-1 min-w-[100px] text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Excluir</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenExportModal(curso)}
                        className="flex-1 min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Exportar</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
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
