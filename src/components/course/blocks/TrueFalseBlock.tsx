'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronRight, RotateCcw, X } from 'lucide-react'
import { Block, TrueFalseItem } from '@/types/course'
import { useRegistrarQuiz } from '@/components/course/ScormProgressContext'

type Answer = TrueFalseItem['answer']
type FocusTarget = 'statement' | 'next' | 'result' | null

const OPTIONS: { value: Answer; label: string; icon: typeof Check }[] = [
  { value: 'true', label: 'Verdadeiro', icon: Check },
  { value: 'false', label: 'Falso', icon: X },
]

const answerLabel = (answer: Answer) => (answer === 'true' ? 'verdadeira' : 'falsa')

export function TrueFalseBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const items = item.trueFalseItems ?? []
  const recordResult = useRegistrarQuiz(blockIndex)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [finished, setFinished] = useState(false)
  const [focusTarget, setFocusTarget] = useState<FocusTarget>(null)
  const statementRef = useRef<HTMLParagraphElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const resultRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    setIndex(0)
    setAnswers({})
    setFinished(false)
  }, [item.trueFalseItems])

  useEffect(() => {
    if (!focusTarget) return
    const element = { statement: statementRef, next: nextRef, result: resultRef }[focusTarget]
      .current
    element?.focus()
    setFocusTarget(null)
  }, [focusTarget])

  if (items.length === 0) {
    return (
      <div className="mb-4 text-sm italic text-gray-500 dark:text-gray-400">
        Verdadeiro ou falso vazio
      </div>
    )
  }

  const current = items[Math.min(index, items.length - 1)]
  const chosen = answers[current.id]
  const answered = chosen !== undefined
  const isLast = index === items.length - 1
  const correctCount = items.filter((entry) => answers[entry.id] === entry.answer).length

  const choose = (answer: Answer) => {
    if (answered) return
    setAnswers((previous) => ({ ...previous, [current.id]: answer }))
    setFocusTarget('next')
  }

  const advance = () => {
    if (!isLast) {
      setIndex(index + 1)
      setFocusTarget('statement')
      return
    }
    setFinished(true)
    setFocusTarget('result')
    recordResult({ acertos: correctCount, total: items.length })
  }

  const restart = () => {
    setIndex(0)
    setAnswers({})
    setFinished(false)
    setFocusTarget('statement')
  }

  if (finished) {
    return (
      <div className="block-surface mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="space-y-4 p-5">
          <p
            ref={resultRef}
            tabIndex={-1}
            className="text-base font-semibold text-gray-900 focus:outline-none dark:text-gray-100"
          >
            Você acertou {correctCount} de {items.length}
          </p>

          <ul className="space-y-2">
            {items.map((entry) => {
              const right = answers[entry.id] === entry.answer
              return (
                <li
                  key={entry.id}
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
                    right
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
                      : 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'
                  }`}
                >
                  {right ? (
                    <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <X aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>
                    <span className="sr-only">{right ? 'Acertou: ' : 'Errou: '}</span>
                    {entry.statement}{' '}
                    <span className="font-semibold">({answerLabel(entry.answer)})</span>
                  </span>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RotateCcw aria-hidden className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const right = chosen === current.answer

  return (
    <div className="block-surface mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <span className="whitespace-nowrap text-xs font-semibold text-(--block-accent,#2563eb)">
          Afirmação {index + 1} de {items.length}
        </span>
        <div className="flex flex-1 gap-1" aria-hidden>
          {items.map((entry, position) => (
            <span
              key={entry.id}
              className={`h-1.5 flex-1 rounded-full ${
                position <= index ? 'bg-(--block-accent,#2563eb)' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-5 p-5">
        <p
          ref={statementRef}
          tabIndex={-1}
          className="text-base font-medium leading-relaxed text-gray-900 focus:outline-none dark:text-gray-100"
        >
          {current.statement}
        </p>

        <div role="group" aria-label="Sua resposta" className="grid grid-cols-2 gap-3">
          {OPTIONS.map(({ value, label, icon: Icon }) => {
            const isChosen = chosen === value
            const isAnswer = current.answer === value
            const tone = !answered
              ? 'border-gray-200 text-gray-800 hover:border-(--block-accent,#2563eb) hover:bg-(--block-accent,#2563eb)/10 dark:border-gray-700 dark:text-gray-200'
              : isAnswer
                ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-200'
                : isChosen
                  ? 'border-red-400 bg-red-50 text-red-900 dark:border-red-600 dark:bg-red-900/20 dark:text-red-200'
                  : 'border-gray-100 text-gray-500 opacity-60 dark:border-gray-800 dark:text-gray-400'

            return (
              <button
                key={value}
                type="button"
                onClick={() => choose(value)}
                disabled={answered}
                aria-pressed={isChosen}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-default ${tone}`}
              >
                <Icon aria-hidden className="h-4 w-4" />
                {label}
              </button>
            )
          })}
        </div>

        <div aria-live="polite">
          {answered && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
                right
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                  : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
              }`}
            >
              <p className="font-semibold">
                {right ? 'Correto!' : 'Não é bem assim.'} A afirmação é{' '}
                {answerLabel(current.answer)}.
              </p>
              {current.explanation && <p className="mt-1">{current.explanation}</p>}
            </div>
          )}
        </div>

        {answered && (
          <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-gray-800">
            <button
              ref={nextRef}
              type="button"
              onClick={advance}
              className="inline-flex items-center gap-1.5 rounded-lg bg-(--block-accent,#2563eb) px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              {isLast ? 'Ver resultado' : 'Próxima'}
              <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
