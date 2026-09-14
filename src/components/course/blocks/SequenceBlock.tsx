'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, RotateCcw, X } from 'lucide-react'
import { Block, SequenceItem } from '@/types/course'
import { useRegistrarQuiz } from '@/components/course/ScormProgressContext'

export function shuffledOrder(ids: string[]): string[] {
  const copy = [...ids]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  const unchanged = copy.every((id, index) => id === ids[index])
  return unchanged && copy.length > 1 ? [...copy.slice(1), copy[0]] : copy
}

export function SequenceBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const items = item.sequenceItems ?? []
  const recordResult = useRegistrarQuiz(blockIndex)
  const [order, setOrder] = useState<string[]>(() => items.map((entry) => entry.id))
  const [checked, setChecked] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const buttonsRef = useRef<Record<string, HTMLButtonElement | null>>({})
  const resultRef = useRef<HTMLParagraphElement>(null)
  const pendingFocus = useRef<string | null>(null)

  useEffect(() => {
    setOrder(shuffledOrder((item.sequenceItems ?? []).map((entry) => entry.id)))
    setChecked(false)
  }, [item.sequenceItems])

  useEffect(() => {
    if (!pendingFocus.current) return
    if (pendingFocus.current === 'result') resultRef.current?.focus()
    else buttonsRef.current[pendingFocus.current]?.focus()
    pendingFocus.current = null
  })

  if (items.length === 0) {
    return (
      <div className="mb-4 text-sm italic text-gray-500 dark:text-gray-400">Sequência vazia</div>
    )
  }

  const byId = new Map(items.map((entry) => [entry.id, entry]))
  const correctIndex = new Map(items.map((entry, index) => [entry.id, index]))
  const current = order
    .map((id) => byId.get(id))
    .filter((entry): entry is SequenceItem => entry !== undefined)
  const correctCount = current.filter((entry, index) => correctIndex.get(entry.id) === index).length

  const move = (position: number, offset: number) => {
    const target = position + offset
    if (checked || target < 0 || target >= current.length) return
    const next = current.map((entry) => entry.id)
    ;[next[position], next[target]] = [next[target], next[position]]
    const moved = current[position]
    const edge = target === 0 || target === current.length - 1
    pendingFocus.current = `${moved.id}:${edge ? (target === 0 ? 'down' : 'up') : offset < 0 ? 'up' : 'down'}`
    setOrder(next)
    setAnnouncement(`${moved.text}: posição ${target + 1} de ${current.length}.`)
  }

  const verify = () => {
    setChecked(true)
    pendingFocus.current = 'result'
    recordResult({ acertos: correctCount, total: current.length })
  }

  const restart = () => {
    const next = shuffledOrder(items.map((entry) => entry.id))
    pendingFocus.current = `${next[0]}:down`
    setOrder(next)
    setChecked(false)
    setAnnouncement('')
  }

  return (
    <div className="block-surface mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="space-y-4 p-5">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Coloque os passos na ordem correta usando as setas de cada passo.
        </p>

        <ol className="space-y-2">
          {current.map((entry, position) => {
            const right = correctIndex.get(entry.id) === position
            const tone = !checked
              ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
              : right
                ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-200'
                : 'border-red-400 bg-red-50 text-red-900 dark:border-red-600 dark:bg-red-900/20 dark:text-red-200'

            return (
              <li
                key={entry.id}
                className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2 text-sm ${tone}`}
              >
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--block-accent-soft,#dbeafe) text-xs font-bold text-(--block-accent-ink,#1d4ed8)"
                >
                  {position + 1}
                </span>
                <span className="flex-1 leading-relaxed text-gray-900 dark:text-gray-100">
                  {entry.text}
                  {checked && !right && (
                    <span className="mt-0.5 block text-xs font-semibold">
                      Posição correta: {(correctIndex.get(entry.id) ?? 0) + 1}
                    </span>
                  )}
                </span>

                {checked ? (
                  right ? (
                    <Check aria-label="Posição certa" className="h-4 w-4 shrink-0" />
                  ) : (
                    <X aria-label="Posição errada" className="h-4 w-4 shrink-0" />
                  )
                ) : (
                  <span className="flex shrink-0 gap-1">
                    {(['up', 'down'] as const).map((direction) => {
                      const offset = direction === 'up' ? -1 : 1
                      const disabled =
                        direction === 'up' ? position === 0 : position === current.length - 1
                      const Icon = direction === 'up' ? ArrowUp : ArrowDown
                      return (
                        <button
                          key={direction}
                          ref={(element) => {
                            buttonsRef.current[`${entry.id}:${direction}`] = element
                          }}
                          type="button"
                          disabled={disabled}
                          onClick={() => move(position, offset)}
                          aria-label={`Mover “${entry.text}” para ${direction === 'up' ? 'cima' : 'baixo'}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition-colors hover:border-(--block-accent,#2563eb) hover:text-(--block-accent,#2563eb) disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-700 dark:border-gray-700 dark:text-gray-300"
                        >
                          <Icon aria-hidden className="h-4 w-4" />
                        </button>
                      )
                    })}
                  </span>
                )}
              </li>
            )
          })}
        </ol>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
          {checked ? (
            <>
              <p
                ref={resultRef}
                tabIndex={-1}
                className="text-sm font-semibold text-gray-900 focus:outline-none dark:text-gray-100"
              >
                {correctCount} de {current.length} na posição certa
              </p>
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <RotateCcw aria-hidden className="h-4 w-4" />
                Tentar novamente
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={verify}
              className="rounded-lg bg-(--block-accent,#2563eb) px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Verificar ordem
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
