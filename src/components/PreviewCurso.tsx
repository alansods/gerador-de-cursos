import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WelcomeMessage } from "@/components/WelcomeMessage";
import {
  BookOpen,
  Clock,
  User,
  GraduationCap,
  ArrowLeft,
  Download,
  Eye,
  Layers,
  Type,
} from "lucide-react";

interface Conteudo {
  id: string;
  tipo: "paragrafo" | "subtitulo" | "titulo" | "imagem";
  conteudo: string;
  tamanho?: "pequena" | "media" | "grande";
  legenda?: string;
  fonte?: string;
  corTexto?: string;
  alinhamento?: "esquerda" | "centro" | "direita" | "justificado";
  colunas?: 6 | 12;
}

interface Unidade {
  id: string;
  titulo: string;
  conteudo: Conteudo[];
}

interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  cargaHoraria: string;
  modalidade: string;
  categoria: string;
  unidades: Unidade[];
}

interface PreviewCursoProps {
  curso: Curso;
  onVoltar: () => void;
  onGerarSCORM: () => void;
}

export const PreviewCurso: React.FC<PreviewCursoProps> = ({
  curso,
  onVoltar,
  onGerarSCORM,
}) => {
  const renderConteudo = (item: Conteudo) => {
    const tamanhoClass = {
      pequena: "max-w-xs",
      media: "max-w-md",
      grande: "max-w-full",
    }[item.tamanho || "media"];

    const alinhamentoClass = {
      esquerda: "text-left",
      centro: "text-center",
      direita: "text-right",
      justificado: "text-justify",
    }[item.alinhamento || "esquerda"];

    switch (item.tipo) {
      case "titulo":
        return (
          <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8 first:mt-0">
            {item.conteudo}
          </h3>
        );

      case "subtitulo":
        return (
          <h4 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
            {item.conteudo}
          </h4>
        );

      case "imagem":
        return (
          <div className="mb-6">
            {item.fonte && (
              <p className="text-xs text-gray-500 mb-2 font-medium">
                Fonte: {item.fonte}
              </p>
            )}
            <div className="flex justify-center">
              <img
                src={item.conteudo}
                alt={item.legenda || "Imagem"}
                className={`${tamanhoClass} h-auto rounded-lg shadow-md border border-gray-200`}
              />
            </div>
            {item.legenda && (
              <p className="text-sm text-gray-600 italic text-center mt-2">
                {item.legenda}
              </p>
            )}
          </div>
        );

      case "paragrafo":
      default:
        return (
          <div
            className={`text-gray-700 mb-4 leading-relaxed ${alinhamentoClass}`}
            style={{ color: item.corTexto || "inherit" }}
            dangerouslySetInnerHTML={{ __html: item.conteudo }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onVoltar}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">
                  Preview
                </span>
              </div>
            </div>

            <Button
              onClick={onGerarSCORM}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar SCORM
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Mensagem de Boas-vindas */}
        <WelcomeMessage />
        
        {/* Course Header */}
        <Card className="mb-8 shadow-xl border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold mb-3 flex items-center gap-3">
                  <BookOpen className="h-8 w-8" />
                  {curso.titulo}
                </CardTitle>
                <p className="text-blue-100 text-lg leading-relaxed">
                  {curso.descricao}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                <Clock className="h-5 w-5 text-blue-200" />
                <div>
                  <p className="text-sm text-blue-200">Carga Horária</p>
                  <p className="font-semibold">{curso.cargaHoraria}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                <GraduationCap className="h-5 w-5 text-blue-200" />
                <div>
                  <p className="text-sm text-blue-200">Modalidade</p>
                  <p className="font-semibold">{curso.modalidade}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                {curso.categoria}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                {curso.unidades?.length || 0} Unidades
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Course Content */}
        <div className="space-y-8">
          {(curso.unidades || []).map((unidade) => (
            <Card
              key={unidade.id}
              className="shadow-lg border-0 bg-white/80 backdrop-blur-sm"
            >
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Layers className="h-6 w-6 text-blue-600" />
                  {unidade.titulo}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {unidade.conteudo.map((item) => (
                    <div
                      key={item.id}
                      className={`${
                        item.colunas === 6 ? "md:col-span-6" : "md:col-span-12"
                      }`}
                    >
                      {renderConteudo(item)}
                    </div>
                  ))}

                  {unidade.conteudo.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Type className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum conteúdo adicionado ainda</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {(!curso.unidades || curso.unidades.length === 0) && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Layers className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Nenhuma unidade criada
                </h3>
                <p className="text-gray-500">
                  Adicione unidades e conteúdo para ver o preview completo do
                  curso
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
