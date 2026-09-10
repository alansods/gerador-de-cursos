'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

interface FlipCardProps {
  tipoFrente: 'imagem' | 'imagem-titulo' | 'titulo'
  imagemFrente?: string
  tituloFrente?: string
  conteudoVerso: string
  alturaCard?: string
  indice?: number
}

export function FlipCard({
  tipoFrente,
  imagemFrente,
  tituloFrente,
  conteudoVerso,
  alturaCard,
  indice,
}: FlipCardProps) {
  const [virado, setVirado] = useState(false)

  const altura = alturaCard || '300px'
  const numero = typeof indice === 'number' ? String(indice).padStart(2, '0') : null
  const comImagem = tipoFrente === 'imagem' || tipoFrente === 'imagem-titulo'
  const titulo = tituloFrente || (comImagem ? '' : 'Card')

  return (
    <div className="fc" style={{ height: altura }}>
      <div className={`fc-inner ${virado ? 'fc-virado' : ''}`}>
        <div className="fc-face fc-frente">
          {comImagem ? (
            <>
              <div className="fc-band" style={tipoFrente === 'imagem' ? { flex: 1 } : undefined}>
                {imagemFrente && (
                  <img
                    src={imagemFrente}
                    alt={tituloFrente || 'Capa do card'}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
              </div>
              <div className="fc-body">
                {(numero || titulo) && (
                  <div className="fc-linha">
                    {numero && <span className="fc-num">{numero}</span>}
                    {titulo && <span className="fc-title">{titulo}</span>}
                  </div>
                )}
                <span className="fc-cta">
                  <RotateCcw className="fc-icone" />
                  Ver definição
                </span>
              </div>
            </>
          ) : (
            <div className="fc-body fc-body-titulo">
              {numero && <span className="fc-num fc-num-grande">{numero}</span>}
              <div>
                <div className="fc-title fc-title-grande">{titulo}</div>
                <div className="fc-regua" />
                <span className="fc-cta">
                  <RotateCcw className="fc-icone" />
                  Ver definição
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="fc-face fc-back">
          <div className="fc-scroll">
            {(numero || tituloFrente) && (
              <div className="fc-linha fc-linha-verso">
                {numero && <span className="fc-num">{numero}</span>}
                {tituloFrente && <span className="fc-title-verso">{tituloFrente}</span>}
              </div>
            )}
            <div className="fc-text" dangerouslySetInnerHTML={{ __html: conteudoVerso }} />
          </div>
          <button type="button" className="fc-close" onClick={() => setVirado(false)}>
            <RotateCcw className="fc-icone" />
            Voltar
          </button>
        </div>
      </div>

      {!virado && (
        <button
          type="button"
          className="fc-hit"
          aria-label={`Virar card${tituloFrente ? `: ${tituloFrente}` : ''}`}
          onClick={() => setVirado(true)}
        />
      )}

      <style jsx global>{`
        .fc {
          position: relative;
          width: 100%;
          perspective: 1200px;
          transition: transform 0.2s ease;
        }

        .fc:hover {
          transform: translateY(-2px);
        }

        .fc-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 8px;
        }

        .fc-virado {
          transform: rotateY(180deg);
        }

        .fc-face {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 8px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #dbe3ec;
          transition: border-color 0.2s ease;
        }

        .fc:hover .fc-face {
          border-color: #b9cdea;
        }

        .fc-back {
          transform: rotateY(180deg);
          border-left: 3px solid var(--block-accent, #2563eb);
        }

        .fc:hover .fc-back {
          border-left-color: var(--block-accent, #2563eb);
        }

        .fc-hit {
          position: absolute;
          inset: 0;
          z-index: 3;
          cursor: pointer;
          border-radius: 8px;
          background: transparent;
          border: 0;
          padding: 0;
        }

        .fc-hit:focus-visible {
          outline: 2px solid var(--block-accent, #2563eb);
          outline-offset: 3px;
        }

        .fc-band {
          height: 150px;
          flex-shrink: 0;
          border-bottom: 1px solid #dbe3ec;
          background: var(--block-accent-soft, #eef4ff);
        }

        .fc-band img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .fc-body {
          flex: 1;
          min-height: 0;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .fc-body-titulo {
          padding: 22px 20px;
        }

        .fc-linha {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .fc-linha-verso {
          margin-bottom: 10px;
        }

        .fc-num {
          font-variant-numeric: tabular-nums;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
        }

        .fc-num-grande {
          font-size: 40px;
          line-height: 1;
          letter-spacing: -0.03em;
          color: #e2e8f0;
        }

        .fc-title {
          font-size: 17px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: #1a202c;
          text-wrap: pretty;
        }

        .fc-title-grande {
          font-size: 22px;
          line-height: 1.22;
          letter-spacing: -0.015em;
        }

        .fc-title-verso {
          font-size: 14px;
          font-weight: 600;
          color: #1a202c;
        }

        .fc-regua {
          width: 28px;
          height: 2px;
          margin: 14px 0;
          background: var(--block-accent, #2563eb);
        }

        .fc-cta,
        .fc-close {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          color: var(--block-accent, #2563eb);
        }

        .fc-close {
          position: absolute;
          bottom: 16px;
          left: 20px;
          z-index: 4;
          cursor: pointer;
          background: transparent;
          border: 0;
          padding: 0;
        }

        .fc-icone {
          width: 14px;
          height: 14px;
        }

        .fc-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 18px 20px 50px;
        }

        .fc-text {
          font-size: 13.5px;
          line-height: 1.62;
          color: #475569;
          overflow-wrap: break-word;
        }

        .fc-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .fc-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }

        .dark .fc-face {
          background: #1e293b;
          border-color: #334155;
        }

        .dark .fc:hover .fc-face {
          border-color: #475569;
        }

        .dark .fc-band {
          border-bottom-color: #334155;
        }

        .dark .fc-title,
        .dark .fc-title-verso {
          color: #f1f5f9;
        }

        .dark .fc-text {
          color: #cbd5e1;
        }

        .dark .fc-num {
          color: #64748b;
        }

        .dark .fc-num-grande {
          color: #334155;
        }

        .dark .fc-scroll::-webkit-scrollbar-thumb {
          background: #475569;
        }
      `}</style>
    </div>
  )
}
