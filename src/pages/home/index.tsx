import { useGeradorCurso } from "@/context/GeradorCursoContext";
import { usePreview } from "@/hooks/usePreview";
import { useSCORM } from "@/hooks/useSCORM";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  User,
  Download,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GeradorHome() {
  const { state, deletarCurso, selecionarCurso } = useGeradorCurso();
  const { openPreview } = usePreview();
  const { generateSCORMPackage } = useSCORM();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  const handleCriarCurso = () => {
    navigate("/cursos/novo");
  };

  const handleEditarCurso = (cursoId: string) => {
    selecionarCurso(cursoId);
    navigate(`/cursos/${cursoId}`);
  };

  const handleDeletarCurso = (cursoId: string) => {
    deletarCurso(cursoId);
    setShowDeleteConfirm(null);
  };

  // Função SCORM removida - usando useSCORM hook

  const handlePreviewCurso = (cursoId: string) => {
    const curso = state.cursos.find((c) => c.id === cursoId);
    if (curso) {
      // Expor função SCORM globalmente antes de abrir preview
      (window as any).handleGerarSCORM = () => generateSCORMPackage(curso);
      openPreview(curso);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
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
        {state.cursos.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.cursos.map((curso) => (
              <Card
                key={curso.id}
                className="hover:shadow-lg transition-shadow"
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
                        <User className="h-4 w-4 mr-2" />
                        {curso.instrutor}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {curso.modalidade}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {curso.unidades?.length || 0} unidade
                        {curso.unidades?.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 my-4"></div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewCurso(curso.id)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditarCurso(curso.id)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(curso.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => generateSCORMPackage(curso)}
                      className="bg-purple-600 hover:bg-purple-700 text-white scorm-button"
                      data-curso-id={curso.id}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      SCORM
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja deletar esse elemento?
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDeletarCurso(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
