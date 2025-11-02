'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { RotateCcw } from 'lucide-react'

interface FlipCardProps {
  tipoFrente: 'imagem' | 'imagem-titulo' | 'titulo'
  imagemFrente?: string
  tituloFrente?: string
  conteudoVerso: string
  alturaCard?: string
  larguraCard?: string
}

export function FlipCard({
  tipoFrente,
  imagemFrente,
  tituloFrente,
  conteudoVerso,
  alturaCard,
  larguraCard,
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  // Tamanhos padrão - formato retangular (altura maior que largura)
  const altura = alturaCard || '450px'
  const largura = larguraCard || '400px'
  const maxWidth = larguraCard || '400px'

  return (
    <div 
      className="flip-card-wrapper group" 
      style={{ 
        height: altura, 
        width: largura,
        maxWidth: maxWidth,
        minHeight: '300px',
        margin: '0 auto'
      }}
    >
      <div
        className={`flip-card ${isFlipped ? 'flipped' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ cursor: 'pointer' }}
      >
        {/* Frente do card */}
        <div className="flip-card-front">
          {tipoFrente === 'imagem-titulo' ? (
            <Card className="h-full w-full flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-gray-50 border border-gray-200 dark:border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-300 relative group rounded-xl">
              {/* Ícone de clique */}
              <div className="absolute top-3 right-3 z-10 bg-gray-100/80 dark:bg-gray-200/80 rounded-full p-1.5 opacity-60 group-hover:opacity-80 transition-opacity">
                <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-700" />
              </div>
              
              <div className="relative h-full w-full">
                {imagemFrente && (
                  <img
                    src={imagemFrente}
                    alt={tituloFrente || 'Card'}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                {tituloFrente && (
                  <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-white border-t border-gray-200 dark:border-gray-300 px-6 py-4 rounded-b-xl">
                    <p className="text-base font-bold text-gray-900 dark:text-gray-800 text-center">
                      {tituloFrente}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ) : tipoFrente === 'imagem' ? (
            <Card className="h-full w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border-2 border-blue-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300 relative group rounded-xl">
              {/* Ícone de clique */}
              <div className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-md opacity-70 group-hover:opacity-100 transition-opacity">
                <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
              
              {imagemFrente && (
                <img
                  src={imagemFrente}
                  alt="Card"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
            </Card>
          ) : (
            <Card className="h-full w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border-2 border-blue-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300 relative group rounded-xl">
              {/* Ícone de clique */}
              <div className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-md opacity-70 group-hover:opacity-100 transition-opacity">
                <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
              
              <div className="p-8 text-center w-full">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {tituloFrente || 'Card'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 flex items-center justify-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Clique para ver mais
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Verso do card */}
        <div className="flip-card-back">
          <Card className="h-full w-full flex flex-col bg-[#E8F0FE] dark:bg-[#D0E0FC] border border-blue-200 dark:border-blue-300 overflow-hidden shadow-sm relative rounded-xl">
            {/* Ícone de clique no verso também */}
            <div className="absolute top-3 right-3 z-10 bg-gray-100/80 dark:bg-gray-200/80 rounded-full p-1.5 opacity-60 hover:opacity-80 transition-opacity">
              <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-700" />
            </div>
            
            {/* Conteúdo do verso */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pt-14 pb-20">
              <div
                className="text-[#1A237E] dark:text-[#283593] leading-relaxed text-base"
                style={{ 
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
                dangerouslySetInnerHTML={{ __html: conteudoVerso }}
              />
            </div>

            {/* Footer com título */}
            {tituloFrente && (
              <div className="absolute bottom-0 left-0 right-0 bg-[#D0E0FC] dark:bg-[#B8D4F8] border-t border-blue-300/50 px-6 py-4">
                <p className="text-base font-bold text-[#1A237E] dark:text-[#283593] text-center">
                  {tituloFrente}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .flip-card-wrapper {
          perspective: 1200px;
          width: 100%;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .flip-card-wrapper:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .flip-card {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .flip-card.flipped {
          transform: rotateY(180deg);
        }

        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 0.75rem;
        }

        .flip-card-back {
          transform: rotateY(180deg);
        }

        .flip-card-back::-webkit-scrollbar {
          width: 10px;
        }

        .flip-card-back::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 5px;
        }

        .flip-card-back::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 5px;
        }

        .flip-card-back::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media (prefers-color-scheme: dark) {
          .flip-card-back::-webkit-scrollbar-track {
            background: #1e293b;
          }

          .flip-card-back::-webkit-scrollbar-thumb {
            background: #475569;
          }

          .flip-card-back::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
        }
      `}</style>
    </div>
  )
}