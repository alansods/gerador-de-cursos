import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  Clock,
  Package,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

interface Objetivo {
  id: string;
  titulo: string;
  definicao: string;
  exemplos: string[];
  imagem?: string;
  icone: React.ComponentType<{ className?: string }>;
}

const objetivos: Objetivo[] = [
  {
    id: "proteger",
    titulo: "Proteger",
    definicao:
      "Garantir a integridade do produto contra danos físicos, contaminação e fatores ambientais.",
    exemplos: [
      "Produtos frágeis embalados em isopor",
      "Alimentos protegidos contra umidade",
      "Eletrônicos em embalagens anti-estática",
    ],
    icone: Shield,
  },
  {
    id: "conservar",
    titulo: "Conservar",
    definicao: "Prolongar a vida útil de produtos perecíveis.",
    exemplos: [
      "Embalagens a vácuo para carnes",
      "Garrafas de vidro para sucos",
      "Embalagens com atmosfera modificada para vegetais",
    ],
    icone: Clock,
  },
  {
    id: "facilitar",
    titulo: "Facilitar",
    definicao:
      "Otimizar o manuseio, transporte e armazenamento, além de facilitar o uso pelo consumidor final.",
    exemplos: [
      "Caixas com alças para transporte",
      "Embalagens com abertura fácil",
      "Paletes padronizados para armazenamento",
    ],
    icone: Package,
  },
  {
    id: "comunicar",
    titulo: "Comunicar",
    definicao:
      "Transmitir informações sobre o produto, como marca, ingredientes, instruções de uso e data de validade.",
    exemplos: [
      "Rótulos com informações nutricionais",
      "Códigos de barras para rastreamento",
      "Instruções de uso impressas na embalagem",
    ],
    icone: MessageSquare,
  },
];

export default function ObjetivosEmbalagem() {
  return (
    <div className="space-y-8 my-10">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Objetivos da Embalagem</h3>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Explore cada objetivo para entender como as embalagens contribuem para
          a eficiência logística
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {objetivos.map((objetivo) => (
          <Dialog key={objetivo.id}>
            <DialogTrigger asChild>
              <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border hover:border-primary/30 bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="pb-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <objetivo.icone className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-xl text-center text-primary group-hover:text-primary/80 transition-colors">
                      {objetivo.titulo}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="rounded-lg max-w-2xl w-[calc(100vw-2rem)] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] max-h-[90vh] overflow-y-auto [&>button]:p-2 [&>button]:hover:bg-gray-100 [&>button]:dark:hover:bg-gray-800 [&>button]:rounded-lg [&>button]:transition-colors [&>button]:border-0 [&>button]:bg-transparent [&>button]:shadow-none">
              <DialogHeader className="pb-4 border-b border-gray-200 -mx-6 px-6">
                <DialogTitle className="flex items-center space-x-3 text-2xl">
                  <div className="p-2 rounded-full bg-primary/10">
                    <objetivo.icone className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-primary">{objetivo.titulo}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold">Definição</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {objetivo.definicao}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-semibold">Exemplos Práticos</h4>
                  <div className="grid gap-3">
                    {objetivo.exemplos.map((exemplo, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50"
                      >
                        <Badge variant="secondary" className="mt-0.5">
                          {index + 1}
                        </Badge>
                        <span className="text-sm leading-relaxed">
                          {exemplo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
