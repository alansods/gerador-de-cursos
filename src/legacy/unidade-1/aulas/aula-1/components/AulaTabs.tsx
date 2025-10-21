import { FileText, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Aula } from "@/types/modulo";

interface AulaTabsProps {
  aula: Aula;
}

export function AulaTabs({ aula }: AulaTabsProps) {
  const getMaterialIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "pdf":
        return <FileText className="h-5 w-5 text-orange-600" />;
      case "video":
        return <Play className="h-5 w-5 text-orange-600" />;
      case "url":
        return <ExternalLink className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-orange-600" />;
    }
  };

  return (
    <div className="p-3 sm:p-6">
      <Tabs defaultValue="sobre" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full justify-start">
            <TabsTrigger
              value="sobre"
              className="whitespace-nowrap text-sm px-4"
            >
              Sobre a aula
            </TabsTrigger>
            <TabsTrigger
              value="objetivos"
              className="whitespace-nowrap text-sm px-4"
            >
              Objetivos
            </TabsTrigger>
            <TabsTrigger
              value="material"
              className="whitespace-nowrap text-sm px-4"
            >
              Material complementar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sobre" className="mt-6">
          <div className="prose max-w-none">
            {aula.conteudo.texto && (
              <p className="text-foreground leading-relaxed mb-4">
                {aula.conteudo.texto}
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="objetivos" className="mt-6">
          {aula.objetivos && aula.objetivos.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Ao final deste módulo, você será capaz de:
              </h3>
              <ul className="space-y-3">
                {aula.objetivos.map((objetivo, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-orange-600 text-sm font-semibold">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-foreground">{objetivo}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                Objetivos não disponíveis para esta aula.
              </div>
              <div className="text-muted-foreground/70 text-sm mt-2">
                Consulte a primeira aula da unidade para ver os objetivos
                gerais.
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="material" className="mt-6">
          {aula.materialComplementar && aula.materialComplementar.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Material Complementar
              </h3>
              <div className="grid gap-4">
                {aula.materialComplementar.map((material) => (
                  <div
                    key={material.id}
                    className="p-3 sm:p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          {getMaterialIcon(material.tipo)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <h4 className="text-sm font-medium text-foreground">
                          {material.titulo}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {material.descricao}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        Acessar
                      </Button>
                    </div>
                  </div>
                ))}
                {/* Additional URL Material */}
                <div className="p-3 sm:p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        {getMaterialIcon("url")}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <h4 className="text-sm font-medium text-foreground">
                        Link Externo
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Acesse o material complementar online.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Acessar
                    </Button>
                  </div>
                </div>
                {/* Additional Video Material */}
                <div className="p-3 sm:p-4 border border-border rounded-lg hover:bg-muted transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        {getMaterialIcon("video")}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <h4 className="text-sm font-medium text-foreground">
                        Vídeo Tutorial
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Assista ao vídeo tutorial para mais detalhes.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Acessar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                Material complementar não disponível para esta aula.
              </div>
              <div className="text-muted-foreground/70 text-sm mt-2">
                Consulte a primeira aula da unidade para ver os materiais
                gerais.
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
