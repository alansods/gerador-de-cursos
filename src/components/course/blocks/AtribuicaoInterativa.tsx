'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import { useRegistrarQuiz } from '@/components/course/ProgressoScormContext'

export interface FichaAtribuicao {
  id: string
  texto: string
  alvoCorreto: string
}

export interface AlvoAtribuicao {
  id: string
  rotulo: string
}

const BANCO = '__banco__'

function embaralhar<T>(itens: T[]): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function Ficha({
  ficha,
  ativa,
  correta,
  bloqueada,
  onSelecionar,
}: {
  ficha: FichaAtribuicao
  ativa: boolean
  correta: boolean | null
  bloqueada: boolean
  onSelecionar: () => void
}) {
  return (
    <button
      type="button"
      draggable={!bloqueada}
      onDragStart={onSelecionar}
      onClick={onSelecionar}
      aria-pressed={ativa}
      disabled={bloqueada}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default ${
        correta === true
          ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-200'
          : correta === false
            ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200'
            : ativa
              ? 'border-(--block-accent,#2563eb) bg-blue-50 ring-2 ring-(--block-accent,#2563eb) dark:bg-blue-950/40'
              : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800'
      }`}
    >
      {correta === true && <Check className="h-4 w-4 shrink-0" />}
      {correta === false && <X className="h-4 w-4 shrink-0" />}
      <span>{ficha.texto}</span>
    </button>
  )
}

function Zona({
  rotulo,
  vazio,
  podeReceber,
  fichas,
  onReceber,
  children,
}: {
  rotulo: string
  vazio: string
  podeReceber: boolean
  fichas: FichaAtribuicao[]
  onReceber: () => void
  children: (ficha: FichaAtribuicao) => React.ReactNode
}) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        onReceber()
      }}
      className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40"
    >
      <button
        type="button"
        onClick={onReceber}
        disabled={!podeReceber}
        className="mb-2 w-full text-left text-sm font-semibold text-gray-900 disabled:cursor-default dark:text-gray-100"
      >
        {rotulo}
        {podeReceber && (
          <span className="ml-2 text-xs font-normal text-(--block-accent,#2563eb)">
            mover para aqui
          </span>
        )}
      </button>

      <div className="flex flex-wrap gap-2">
        {fichas.length > 0 ? (
          fichas.map((ficha) => children(ficha))
        ) : (
          <p className="text-xs italic text-gray-500 dark:text-gray-400">{vazio}</p>
        )}
      </div>
    </div>
  )
}

export function AtribuicaoInterativa({
  fichas,
  alvos,
  capacidadeUnica,
  rotuloBanco,
  instrucao,
  blocoIndex,
}: {
  fichas: FichaAtribuicao[]
  alvos: AlvoAtribuicao[]
  capacidadeUnica: boolean
  rotuloBanco: string
  instrucao: string
  blocoIndex?: number
}) {
  const registrarResultado = useRegistrarQuiz(blocoIndex)

  const [ordem, setOrdem] = useState<string[]>(() => fichas.map((f) => f.id))
  const [atribuicoes, setAtribuicoes] = useState<Record<string, string>>({})
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ acertos: number; total: number } | null>(null)

  useEffect(() => {
    setOrdem(embaralhar(fichas.map((f) => f.id)))
    setAtribuicoes({})
    setSelecionada(null)
    setResultado(null)
  }, [fichas])

  const porId = useMemo(() => new Map(fichas.map((f) => [f.id, f])), [fichas])
  const naOrdem = ordem.map((id) => porId.get(id)).filter((f): f is FichaAtribuicao => !!f)
  const noBanco = naOrdem.filter((f) => !atribuicoes[f.id])
  const todasAtribuidas = noBanco.length === 0 && naOrdem.length > 0

  const mover = (fichaId: string, alvoId: string) => {
    if (resultado) return
    setAtribuicoes((atual) => {
      const proximo = { ...atual }
      if (alvoId === BANCO) {
        delete proximo[fichaId]
        return proximo
      }
      if (capacidadeUnica) {
        for (const [id, destino] of Object.entries(proximo)) {
          if (destino === alvoId && id !== fichaId) delete proximo[id]
        }
      }
      proximo[fichaId] = alvoId
      return proximo
    })
    setSelecionada(null)
  }

  const receber = (alvoId: string) => () => {
    if (selecionada) mover(selecionada, alvoId)
  }

  const verificar = () => {
    const acertos = naOrdem.filter((f) => atribuicoes[f.id] === f.alvoCorreto).length
    const apuracao = { acertos, total: naOrdem.length }
    setResultado(apuracao)
    setSelecionada(null)
    registrarResultado(apuracao)
  }

  const reiniciar = () => {
    setOrdem(embaralhar(fichas.map((f) => f.id)))
    setAtribuicoes({})
    setSelecionada(null)
    setResultado(null)
  }

  const renderFicha = (ficha: FichaAtribuicao) => (
    <Ficha
      key={ficha.id}
      ficha={ficha}
      ativa={selecionada === ficha.id}
      correta={resultado ? atribuicoes[ficha.id] === ficha.alvoCorreto : null}
      bloqueada={!!resultado}
      onSelecionar={() => setSelecionada(selecionada === ficha.id ? null : ficha.id)}
    />
  )

  if (fichas.length === 0 || alvos.length === 0) return null

  const podeReceber = !!selecionada && !resultado

  return (
    <div className="mb-4 space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">{instrucao}</p>

      <Zona
        rotulo={rotuloBanco}
        vazio="Nenhum item restante."
        podeReceber={podeReceber}
        fichas={noBanco}
        onReceber={receber(BANCO)}
      >
        {renderFicha}
      </Zona>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {alvos.map((alvo) => (
          <Zona
            key={alvo.id}
            rotulo={alvo.rotulo}
            vazio="Solte um item aqui."
            podeReceber={podeReceber}
            fichas={naOrdem.filter((f) => atribuicoes[f.id] === alvo.id)}
            onReceber={receber(alvo.id)}
          >
            {renderFicha}
          </Zona>
        ))}
      </div>

      <div aria-live="polite" className="flex flex-wrap items-center gap-3">
        {resultado ? (
          <>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {resultado.acertos} de {resultado.total} corretos
            </p>
            <button
              type="button"
              onClick={reiniciar}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <RotateCcw className="h-4 w-4" />
              Tentar novamente
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={verificar}
            disabled={!todasAtribuidas}
            className="rounded-lg bg-(--block-accent,#2563eb) px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Verificar
          </button>
        )}
      </div>
    </div>
  )
}
