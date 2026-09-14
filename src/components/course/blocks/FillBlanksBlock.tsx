'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import { Block } from '@/types/course'
import { useRegistrarQuiz } from '@/components/course/ScormProgressContext'
import { parseFillBlanks, sameWord } from '@/lib/fill-blanks'

interface WordChip {
  id: string
  word: string
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function FillBlanksBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const recordResult = useRegistrarQuiz(blockIndex)
  const segments = useMemo(() => parseFillBlanks(item.fillBlanksText), [item.fillBlanksText])
  const answers = useMemo(
    () => segments.flatMap((segment) => (segment.kind === 'blank' ? [segment.answer] : [])),
    [segments]
  )
  const words = useMemo<WordChip[]>(
    () =>
      [...answers, ...(item.fillBlanksDistractors ?? [])].map((word, index) => ({
        id: `w-${index}`,
        word,
      })),
    [answers, item.fillBlanksDistractors]
  )

  const [bank, setBank] = useState<string[]>(() => words.map((word) => word.id))
  const [placed, setPlaced] = useState<Record<number, string>>({})
  const [active, setActive] = useState(0)
  const [checked, setChecked] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [focusTarget, setFocusTarget] = useState<string | null>(null)
  const refs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    setBank(shuffle(words.map((word) => word.id)))
    setPlaced({})
    setActive(0)
    setChecked(false)
  }, [words])

  useEffect(() => {
    if (!focusTarget) return
    refs.current[focusTarget]?.focus()
    setFocusTarget(null)
  }, [focusTarget])

  if (answers.length === 0) {
    return (
      <div className="mb-4 text-sm italic text-gray-500 dark:text-gray-400">
        Texto com lacunas vazio
      </div>
    )
  }

  const byId = new Map(words.map((word) => [word.id, word]))
  const usedIds = new Set(Object.values(placed))
  const available = bank.filter((id) => !usedIds.has(id))
  const allFilled = answers.every((_, index) => placed[index] !== undefined)
  const isRight = (index: number) => {
    const word = byId.get(placed[index] ?? '')
    return !!word && sameWord(word.word, answers[index])
  }
  const correctCount = answers.filter((_, index) => isRight(index)).length

  const nextEmpty = (filled: Record<number, string>, from: number) => {
    for (let offset = 1; offset <= answers.length; offset++) {
      const candidate = (from + offset) % answers.length
      if (filled[candidate] === undefined) return candidate
    }
    return from
  }

  const place = (chipId: string) => {
    if (checked) return
    const next = { ...placed, [active]: chipId }
    const remaining = available.filter((id) => id !== chipId)
    setPlaced(next)
    setAnnouncement(`${byId.get(chipId)?.word} na lacuna ${active + 1}.`)
    setActive(nextEmpty(next, active))
    const complete = answers.every((_, index) => next[index] !== undefined)
    setFocusTarget(complete ? 'verify' : remaining[0] ? `chip-${remaining[0]}` : null)
  }

  const selectBlank = (index: number) => {
    if (checked) return
    if (placed[index] !== undefined) {
      const word = byId.get(placed[index])?.word
      const next = { ...placed }
      delete next[index]
      setPlaced(next)
      setAnnouncement(`${word} voltou para as palavras. Lacuna ${index + 1} selecionada.`)
    } else {
      setAnnouncement(`Lacuna ${index + 1} selecionada.`)
    }
    setActive(index)
  }

  const verify = () => {
    setChecked(true)
    setFocusTarget('result')
    recordResult({ acertos: correctCount, total: answers.length })
  }

  const restart = () => {
    const shuffled = shuffle(words.map((word) => word.id))
    setBank(shuffled)
    setPlaced({})
    setActive(0)
    setChecked(false)
    setAnnouncement('')
    setFocusTarget(`chip-${shuffled[0]}`)
  }

  return (
    <div className="block-surface mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="space-y-4 p-5">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Toque em uma palavra para colocá-la na lacuna destacada. Toque em uma lacuna preenchida
          para devolver a palavra.
        </p>

        <p className="text-base leading-[2.6] text-gray-900 dark:text-gray-100">
          {segments.map((segment, position) => {
            if (segment.kind === 'text') return <span key={position}>{segment.value}</span>

            const word = byId.get(placed[segment.index] ?? '')
            const isActive = !checked && active === segment.index
            const right = checked && isRight(segment.index)
            const tone = checked
              ? right
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200'
                : 'border-red-500 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200'
              : isActive
                ? 'border-(--block-accent,#2563eb) bg-(--block-accent-soft,#dbeafe) text-(--block-accent-ink,#1d4ed8) ring-2 ring-(--block-accent,#2563eb)/40'
                : word
                  ? 'border-gray-400 bg-white text-gray-900 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100'
                  : 'border-dashed border-gray-400 bg-gray-50 text-gray-500 dark:border-gray-600 dark:bg-gray-800/60 dark:text-gray-400'

            return (
              <span key={position} className="inline-flex items-baseline gap-1 align-baseline">
                <button
                  type="button"
                  onClick={() => selectBlank(segment.index)}
                  disabled={checked}
                  aria-pressed={isActive}
                  aria-label={`Lacuna ${segment.index + 1}: ${word ? word.word : 'vazia'}`}
                  className={`mx-0.5 inline-flex min-w-[5.5rem] items-center justify-center gap-1 rounded-md border-2 px-2 py-0.5 text-sm font-semibold leading-6 transition-colors disabled:cursor-default ${tone}`}
                >
                  {checked &&
                    (right ? (
                      <Check aria-hidden className="h-3.5 w-3.5" />
                    ) : (
                      <X aria-hidden className="h-3.5 w-3.5" />
                    ))}
                  {word ? word.word : ' '}
                </button>
                {checked && !right && (
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    ({answers[segment.index]})
                  </span>
                )}
              </span>
            )
          })}
        </p>

        {!checked && (
          <div
            role="group"
            aria-label="Palavras"
            className="flex min-h-12 flex-wrap gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40"
          >
            {available.length > 0 ? (
              available.map((id) => (
                <button
                  key={id}
                  ref={(element) => {
                    refs.current[`chip-${id}`] = element
                  }}
                  type="button"
                  onClick={() => place(id)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors hover:border-(--block-accent,#2563eb) dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                  {byId.get(id)?.word}
                </button>
              ))
            ) : (
              <p className="text-xs italic text-gray-500 dark:text-gray-400">
                Todas as palavras foram usadas.
              </p>
            )}
          </div>
        )}

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
          {checked ? (
            <>
              <p
                ref={(element) => {
                  refs.current.result = element
                }}
                tabIndex={-1}
                className="text-sm font-semibold text-gray-900 focus:outline-none dark:text-gray-100"
              >
                {correctCount} de {answers.length} lacunas corretas
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
              ref={(element) => {
                refs.current.verify = element
              }}
              type="button"
              onClick={verify}
              disabled={!allFilled}
              className="rounded-lg bg-(--block-accent,#2563eb) px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Verificar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
