"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FlipCard } from "@/components/flipcard";
import { QuizConteudo } from "@/components/QuizConteudo";
import { InfoBox } from "@/components/info-box";
import { Unidade } from "@/types/gerador-curso";

interface UnidadeConteudoProps {
  unidade: Unidade;
  unidadeIndex: number;
}

export function UnidadeConteudo({
  unidade,
  unidadeIndex,
}: UnidadeConteudoProps) {
  return (
    <Card
      key={unidade.id}
      id={unidade.id}
      className="overflow-hidden scroll-mt-20"
    >
      <CardHeader className="bg-linear-to-r from-gray-50 to-gray-100 border-b px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold shrink-0 text-lg">
            {unidadeIndex + 1}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {unidade.titulo}
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              {unidade.descricao}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-8">
        {unidade.conteudo.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhum conteúdo adicionado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {unidade.conteudo.map((item) => (
              <div
                key={item.id}
                className={`${
                  item.colunas === 6 ? "md:col-span-6" : "md:col-span-12"
                }`}
              >
                {item.tipo === "titulo" ? (
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 mt-4 first:mt-0">
                    {item.conteudo}
                  </h3>
                ) : item.tipo === "subtitulo" ? (
                  <h4 className="text-xl font-semibold text-gray-800 mb-2 mt-3">
                    {item.conteudo}
                  </h4>
                ) : item.tipo === "imagem" ? (
                  <div className="space-y-3">
                    {item.fonte && (
                      <p className="text-xs text-gray-500 mb-2">
                        Fonte: {item.fonte}
                      </p>
                    )}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <img
                        src={item.conteudo}
                        alt={item.legenda || "Imagem"}
                        className={`h-auto object-contain rounded-lg ${
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
                    </div>
                    {item.legenda && (
                      <p className="text-sm text-gray-600 italic mt-2">
                        {item.legenda}
                      </p>
                    )}
                  </div>
                ) : item.tipo === "accordion" ? (
                  <div className="mb-4">
                    {item.items && item.items.length > 0 ? (
                      <Accordion type="single" collapsible className="w-full">
                        {item.items.map((accordionItem, idx) => (
                          <AccordionItem
                            key={accordionItem.id || idx}
                            value={`item-${idx}`}
                          >
                            <AccordionTrigger className="text-left font-semibold">
                              {accordionItem.titulo}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div
                                className="text-gray-700 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: accordionItem.conteudo,
                                }}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-gray-500 text-sm italic">
                        Accordion vazio
                      </div>
                    )}
                  </div>
                ) : item.tipo === "flipcard" ? (
                  <div className="mb-4">
                    {item.tipoFrente && item.conteudoVerso ? (
                      <FlipCard
                        tipoFrente={item.tipoFrente}
                        imagemFrente={item.imagemFrente}
                        tituloFrente={item.tituloFrente}
                        conteudoVerso={item.conteudoVerso}
                        alturaCard={item.alturaCard}
                      />
                    ) : (
                      <div className="text-gray-500 text-sm italic p-4 border border-gray-300 rounded-lg">
                        FlipCard vazio ou incompleto
                      </div>
                    )}
                  </div>
                ) : item.tipo === "lista" ? (
                  <div className="mb-4">
                    {item.itensLista && item.itensLista.length > 0 ? (
                      item.tipoLista === "ordenada" ? (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
                          <ol className="space-y-3">
                            {item.itensLista.map((listaItem, idx) => (
                              <li
                                key={listaItem.id || idx}
                                className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 border-blue-500"
                              >
                                <span className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-semibold text-sm shrink-0">
                                  {idx + 1}
                                </span>
                                <span
                                  className="flex-1 text-gray-700 leading-relaxed pt-1"
                                  dangerouslySetInnerHTML={{
                                    __html: listaItem.texto,
                                  }}
                                />
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : item.tipoLista === "check" ? (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-sm">
                          <ul className="space-y-3">
                            {item.itensLista.map((listaItem, idx) => (
                              <li
                                key={listaItem.id || idx}
                                className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 border-green-500"
                              >
                                <span className="flex items-center justify-center w-6 h-6 mt-0.5 bg-green-500 rounded shrink-0">
                                  <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.5}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </span>
                                <span
                                  className="flex-1 text-gray-700 leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: listaItem.texto,
                                  }}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-sm">
                          <ul className="space-y-3">
                            {item.itensLista.map((listaItem, idx) => (
                              <li
                                key={listaItem.id || idx}
                                className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 border-purple-500"
                              >
                                <span className="flex items-center justify-center w-6 h-6 mt-0.5 bg-purple-500 rounded-full shrink-0">
                                  <span className="w-2 h-2 bg-white rounded-full"></span>
                                </span>
                                <span
                                  className="flex-1 text-gray-700 leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: listaItem.texto,
                                  }}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    ) : (
                      <div className="text-gray-500 text-sm italic p-4 border border-gray-300 rounded-lg">
                        Lista vazia
                      </div>
                    )}
                  </div>
                ) : item.tipo === "quiz" ? (
                  <div className="mb-4">
                    {item.quizData ? (
                      <QuizConteudo quizData={item.quizData} isEdicao={false} />
                    ) : (
                      <div className="text-gray-500 text-sm italic p-4 border border-gray-300 rounded-lg">
                        Quiz incompleto ou sem dados
                      </div>
                    )}
                  </div>
                ) : item.tipo === "info-box" ? (
                  <div className="mb-4 w-full">
                    {item.tipoInfoBox ? (
                      <InfoBox
                        tipo={item.tipoInfoBox}
                        titulo={item.tituloInfoBox}
                        className="w-full"
                      >
                        <div
                          dangerouslySetInnerHTML={{
                            __html: item.conteudo || "",
                          }}
                        />
                      </InfoBox>
                    ) : (
                      <div className="text-gray-500 text-sm italic p-4 border border-gray-300 rounded-lg">
                        Info Box incompleto ou sem dados
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`text-gray-700 leading-relaxed text-base mb-3 ${
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
