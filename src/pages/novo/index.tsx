import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGeradorCurso } from "@/context/GeradorCursoContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";

export default function GeradorNovo() {
  const { criarCurso } = useGeradorCurso();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    cargaHoraria: "",
    modalidade: "",
    instrutor: "",
    categoria: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro quando o usuário começar a digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = "Título é obrigatório";
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = "Descrição é obrigatória";
    }

    if (!formData.cargaHoraria.trim()) {
      newErrors.cargaHoraria = "Carga horária é obrigatória";
    }

    if (!formData.modalidade.trim()) {
      newErrors.modalidade = "Modalidade é obrigatória";
    }

    if (!formData.instrutor.trim()) {
      newErrors.instrutor = "Instrutor é obrigatório";
    }

    if (!formData.categoria.trim()) {
      newErrors.categoria = "Categoria é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const cursoId = criarCurso({
        ...formData,
        unidades: [],
      });
      navigate(`/cursos/${cursoId}`);
    }
  };

  const handleVoltar = () => {
    navigate("/cursos");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="outline" onClick={handleVoltar} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Novo Curso</h1>
              <p className="text-gray-600 mt-2">
                Preencha as informações básicas do curso
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="titulo"
                    className="text-sm font-medium text-gray-700"
                  >
                    Título do Curso *
                  </label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) =>
                      handleInputChange("titulo", e.target.value)
                    }
                    placeholder="Ex: Introdução ao React"
                    className={errors.titulo ? "border-red-500" : ""}
                  />
                  {errors.titulo && (
                    <p className="text-sm text-red-600">{errors.titulo}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="categoria"
                    className="text-sm font-medium text-gray-700"
                  >
                    Categoria *
                  </label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) =>
                      handleInputChange("categoria", e.target.value)
                    }
                    placeholder="Ex: Programação, Design, Marketing"
                    className={errors.categoria ? "border-red-500" : ""}
                  />
                  {errors.categoria && (
                    <p className="text-sm text-red-600">{errors.categoria}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="descricao"
                  className="text-sm font-medium text-gray-700"
                >
                  Descrição *
                </label>
                <textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    handleInputChange("descricao", e.target.value)
                  }
                  placeholder="Descreva o que os alunos aprenderão neste curso..."
                  rows={4}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.descricao ? "border-red-500" : ""
                  }`}
                />
                {errors.descricao && (
                  <p className="text-sm text-red-600">{errors.descricao}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="cargaHoraria"
                    className="text-sm font-medium text-gray-700"
                  >
                    Carga Horária *
                  </label>
                  <Input
                    id="cargaHoraria"
                    value={formData.cargaHoraria}
                    onChange={(e) =>
                      handleInputChange("cargaHoraria", e.target.value)
                    }
                    placeholder="Ex: 40 horas"
                    className={errors.cargaHoraria ? "border-red-500" : ""}
                  />
                  {errors.cargaHoraria && (
                    <p className="text-sm text-red-600">
                      {errors.cargaHoraria}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="modalidade"
                    className="text-sm font-medium text-gray-700"
                  >
                    Modalidade *
                  </label>
                  <Input
                    id="modalidade"
                    value={formData.modalidade}
                    onChange={(e) =>
                      handleInputChange("modalidade", e.target.value)
                    }
                    placeholder="Ex: Online, Presencial, Híbrido"
                    className={errors.modalidade ? "border-red-500" : ""}
                  />
                  {errors.modalidade && (
                    <p className="text-sm text-red-600">{errors.modalidade}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="instrutor"
                    className="text-sm font-medium text-gray-700"
                  >
                    Instrutor *
                  </label>
                  <Input
                    id="instrutor"
                    value={formData.instrutor}
                    onChange={(e) =>
                      handleInputChange("instrutor", e.target.value)
                    }
                    placeholder="Nome do instrutor"
                    className={errors.instrutor ? "border-red-500" : ""}
                  />
                  {errors.instrutor && (
                    <p className="text-sm text-red-600">{errors.instrutor}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={handleVoltar}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  Criar Curso
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
