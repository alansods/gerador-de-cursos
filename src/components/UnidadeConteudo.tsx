'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { FlipCard } from '@/components/flipcard'
import { QuizConteudo } from '@/components/QuizConteudo'
import { InfoBox } from '@/components/InfoBox'
import { Unidade } from '@/types/gerador-curso'
import { Target } from 'lucide-react'

interface UnidadeConteudoProps {
  unidade: Unidade
}

const extractYouTubeId = (url: string): string => {
  if (!url) return ''

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return ''
}

export function UnidadeConteudo({ unidade }: UnidadeConteudoProps) {
  return (
    <div key={unidade.id} id={unidade.id} className="scroll-mt-20">
      <div className="space-y-6">
        {unidade.conteudo.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>Nenhum conteúdo adicionado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {unidade.conteudo.map((item) => (
              <div
                key={item.id}
                className={`${item.colunas === 6 ? 'md:col-span-6' : 'md:col-span-12'}`}
              >
                {item.tipo === 'titulo' ? (
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 mt-4 first:mt-0">
                    {item.conteudo}
                  </h3>
                ) : item.tipo === 'subtitulo' ? (
                  <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-3">
                    {item.conteudo}
                  </h4>
                ) : item.tipo === 'imagem' ? (
                  <div className="space-y-3">
                    {item.fonte && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
                        Fonte: {item.fonte}
                      </p>
                    )}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <img
                        src={item.conteudo}
                        alt={item.legenda || 'Imagem'}
                        className={`h-auto object-contain rounded-lg mx-auto ${
                          item.tamanho === 'pequena'
                            ? 'max-w-xs'
                            : item.tamanho === 'media'
                              ? 'max-w-md'
                              : 'max-w-full'
                        }`}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                    {item.legenda && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-2 text-center">
                        {item.legenda}
                      </p>
                    )}
                  </div>
                ) : item.tipo === 'accordion' ? (
                  <div className="mb-4">
                    {item.items && item.items.length > 0 ? (
                      <Accordion type="single" collapsible className="w-full">
                        {item.items.map((accordionItem, idx) => (
                          <AccordionItem key={accordionItem.id || idx} value={`item-${idx}`}>
                            <AccordionTrigger className="text-left font-semibold">
                              {accordionItem.titulo}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div
                                className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: accordionItem.conteudo,
                                }}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-sm italic">
                        Accordion vazio
                      </div>
                    )}
                  </div>
                ) : item.tipo === 'flipcard' ? (
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
                      <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
                        FlipCard vazio ou incompleto
                      </div>
                    )}
                  </div>
                ) : item.tipo === 'lista' ? (
                  <div className="mb-4">
                    {item.itensLista && item.itensLista.length > 0 ? (
                      <ul className="space-y-3">
                        {item.itensLista.map((listaItem, idx) => (
                          <li
                            key={listaItem.id || idx}
                            className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
                          >
                            {item.tipoLista === 'check' ? (
                              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 shrink-0">
                                <svg
                                  className="w-4 h-4"
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
                            ) : item.tipoLista === 'nao-ordenada' ? (
                              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                              </span>
                            ) : (
                              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm tabular-nums shrink-0">
                                {idx + 1}
                              </span>
                            )}
                            <span
                              className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: listaItem.texto,
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
                        Lista vazia
                      </div>
                    )}
                  </div>
                ) : item.tipo === 'quiz' ? (
                  <div className="mb-4">
                    {item.quizData ? (
                      <QuizConteudo quizData={item.quizData} isEdicao={false} />
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
                        Quiz incompleto ou sem dados
                      </div>
                    )}
                  </div>
                ) : item.tipo === 'info-box' ? (
                  <div className="mb-4 w-full">
                    {item.tipoInfoBox ? (
                      <InfoBox
                        tipo={item.tipoInfoBox}
                        titulo={item.tituloInfoBox}
                        className="w-full"
                      >
                        <div
                          dangerouslySetInnerHTML={{
                            __html: item.conteudo || '',
                          }}
                        />
                      </InfoBox>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
                        Info Box incompleto ou sem dados
                      </div>
                    )}
                  </div>
                ) : item.tipo === 'video' ? (
                  <div className="mb-4 w-full">
                    {item.videoUrl && item.videoTitulo ? (
                      <div className="space-y-3">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {item.videoTitulo}
                        </h4>
                        <div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
                          <iframe
                            src={`https://www.youtube.com/embed/${extractYouTubeId(item.videoUrl)}`}
                            title={item.videoTitulo}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
                        Vídeo incompleto ou sem dados
                      </div>
                    )}
                  </div>
                ) : item.tipo === 'objetivos-aprendizagem' ? (
                  <div className="mb-4 w-full">
                    {item.itensObjetivos && item.itensObjetivos.length > 0 ? (
                      <div className="flex items-start gap-6 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-8">
                        <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-full border-2 border-blue-600 dark:border-blue-400">
                          <Target className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Objetivos de aprendizagem
                          </h2>
                          {item.itensObjetivos.map((objetivo, idx) => (
                            <div key={objetivo.id || idx} className="flex items-baseline gap-3">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm tabular-nums shrink-0">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span
                                className="text-gray-800 dark:text-gray-200 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: objetivo.texto,
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
                        Objetivos de aprendizagem vazios
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-3 ${
                      item.alinhamento === 'centro'
                        ? 'text-center'
                        : item.alinhamento === 'direita'
                          ? 'text-right'
                          : item.alinhamento === 'justificado'
                            ? 'text-justify'
                            : 'text-left'
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: item.conteudo,
                    }}
                    style={{
                      color: item.corTexto || 'inherit',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
