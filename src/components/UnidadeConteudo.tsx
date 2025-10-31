'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Unidade } from "@/types/gerador-curso";

interface UnidadeConteudoProps {
  unidade: Unidade;
  unidadeIndex: number;
}

export function UnidadeConteudo({ unidade, unidadeIndex }: UnidadeConteudoProps) {
  return (
    <Card key={unidade.id} id={unidade.id} className="overflow-hidden scroll-mt-20">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold shrink-0">
            {unidadeIndex + 1}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {unidade.titulo}
            </h2>
            <p className="mt-2 text-gray-600 text-sm">
              {unidade.descricao}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {unidade.conteudo.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum conteúdo adicionado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {unidade.conteudo.map((item) => (
              <div
                key={item.id}
                className={`${
                  item.colunas === 6
                    ? "md:col-span-6"
                    : "md:col-span-12"
                }`}
              >
                {item.tipo === "titulo" ? (
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {item.conteudo}
                  </h3>
                ) : item.tipo === "subtitulo" ? (
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">
                    {item.conteudo}
                  </h4>
                ) : item.tipo === "imagem" ? (
                  <div className="space-y-2">
                    {item.fonte && (
                      <p className="text-xs text-gray-500">
                        Fonte: {item.fonte}
                      </p>
                    )}
                    <img
                      src={item.conteudo}
                      alt={item.legenda || "Imagem"}
                      className={`h-auto object-contain border border-gray-200 rounded-lg shadow-sm ${
                        item.tamanho === "pequena"
                          ? "max-w-xs"
                          : item.tamanho === "media"
                          ? "max-w-md"
                          : "max-w-full"
                      }`}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    {item.legenda && (
                      <p className="text-sm text-gray-600 italic mt-2">
                        {item.legenda}
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    className={`text-gray-700 leading-relaxed ${
                      item.alinhamento === "centro"
                        ? "text-center"
                        : item.alinhamento === "direita"
                        ? "text-right"
                        : item.alinhamento === "justificado"
                        ? "text-justify"
                        : "text-left"
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: item.conteudo,
                    }}
                    style={{
                      color: item.corTexto || "inherit",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

