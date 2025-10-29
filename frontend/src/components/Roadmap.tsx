import React from "react";
import { useFeatures } from "../hooks/useFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle, Clock, Star } from "lucide-react";

/**
 * 🚀 Componente Roadmap
 *
 * Mostra as funcionalidades atuais e planejadas
 * do sistema.
 */
export const Roadmap: React.FC = () => {
  const { getEnabled, getPlanned, hasPlannedFeatures } = useFeatures();

  const enabledFeatures = getEnabled();
  const plannedFeatures = getPlanned();

  const featureLabels: Record<string, string> = {
    SCORM_EXPORT: "Exportação SCORM",
    COURSE_PREVIEW: "Preview de Cursos",
    CONTENT_MANAGEMENT: "Gerenciamento de Conteúdo",
    PDF_EXPORT: "Exportação PDF",
    ACCORDION_COMPONENT: "Componente Accordion",
    SLIDESHOW_COMPONENT: "Componente Slideshow",
    TIMELINE_COMPONENT: "Componente Timeline",
    QUIZ_COMPONENT: "Componente Quiz",
    ANALYTICS: "Analytics",
    THEMES: "Temas Personalizáveis",
    TEMPLATES: "Templates Pré-definidos",
  };

  const getFeatureIcon = (feature: string) => {
    if (enabledFeatures.includes(feature as any)) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getFeatureBadge = (feature: string) => {
    if (enabledFeatures.includes(feature as any)) {
      return (
        <Badge variant="default" className="bg-green-500">
          Ativo
        </Badge>
      );
    }
    return <Badge variant="outline">Planejado</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🚀 Roadmap do Sistema
        </h2>
        <p className="text-gray-600">
          Funcionalidades atuais e planejadas para o Gerador de Cursos
        </p>
      </div>

      {/* Funcionalidades Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Funcionalidades Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enabledFeatures.map((feature) => (
              <div
                key={feature}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {getFeatureIcon(feature)}
                  <span className="font-medium">{featureLabels[feature]}</span>
                </div>
                {getFeatureBadge(feature)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades Planejadas */}
      {hasPlannedFeatures() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Funcionalidades Planejadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plannedFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {getFeatureIcon(feature)}
                    <span className="font-medium">
                      {featureLabels[feature]}
                    </span>
                  </div>
                  {getFeatureBadge(feature)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximos Passos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Próximos Passos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100">
                1
              </Badge>
              <span>Implementar exportação PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100">
                2
              </Badge>
              <span>Adicionar componente Accordion</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100">
                3
              </Badge>
              <span>Criar sistema de Templates</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
