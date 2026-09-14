'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { CheckCircle2, RotateCcw, UserRound, XCircle } from 'lucide-react'
import { Block } from '@/types/course'
import { illustrationCardStyle, isIllustrationSource } from '@/lib/illustration-paths'
import { useRegistrarQuiz } from '@/components/course/ScormProgressContext'

export function ScenarioBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const options = item.scenarioOptions ?? []
  const recordResult = useRegistrarQuiz(blockIndex)
  const [chosen, setChosen] = useState<string | null>(null)
  const [avatarBroken, setAvatarBroken] = useState(false)
  const [focusTarget, setFocusTarget] = useState<'feedback' | 'options' | null>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const firstOptionRef = useRef<HTMLButtonElement>(null)
  const questionId = useId()

  useEffect(() => {
    setChosen(null)
  }, [item.scenarioOptions])

  useEffect(() => {
    setAvatarBroken(false)
  }, [item.scenarioAvatar])

  useEffect(() => {
    if (focusTarget === 'feedback') feedbackRef.current?.focus()
    if (focusTarget === 'options') firstOptionRef.current?.focus()
    if (focusTarget) setFocusTarget(null)
  }, [focusTarget])

  if (!item.scenarioSituation || options.length === 0) {
    return (
      <div className="mb-4 text-sm italic text-gray-500 dark:text-gray-400">
        Cenário de decisão vazio
      </div>
    )
  }

  const selected = options.find((option) => option.id === chosen)
  const right = selected?.outcome === 'correct'
  const showAvatar = !!item.scenarioAvatar && !avatarBroken

  const choose = (id: string) => {
    if (chosen) return
    const option = options.find((entry) => entry.id === id)
    setChosen(id)
    setFocusTarget('feedback')
    recordResult({ acertos: option?.outcome === 'correct' ? 1 : 0, total: 1 })
  }

  const retry = () => {
    setChosen(null)
    setFocusTarget('options')
  }

  return (
    <div className="block-surface mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="space-y-5 p-5">
        <figure className="flex items-start gap-3">
          <div className="flex shrink-0 flex-col items-center gap-1">
            {showAvatar ? (
              <img
                src={item.scenarioAvatar}
                alt=""
                onError={() => setAvatarBroken(true)}
                className={`h-14 w-14 rounded-full border-2 border-(--block-accent,#2563eb) bg-white ${
                  isIllustrationSource(item.scenarioAvatar)
                    ? 'object-contain p-1.5'
                    : 'object-cover'
                }`}
                style={illustrationCardStyle(item.scenarioAvatar)}
              />
            ) : (
              <span
                aria-hidden
                className="flex h-14 w-14 items-center justify-center rounded-full bg-(--block-accent-soft,#dbeafe) text-(--block-accent-ink,#1d4ed8)"
              >
                <UserRound className="h-7 w-7" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {item.scenarioCharacter && (
              <figcaption className="text-xs font-semibold uppercase tracking-wide text-(--block-accent,#2563eb)">
                {item.scenarioCharacter}
              </figcaption>
            )}
            <blockquote className="relative rounded-2xl rounded-tl-sm bg-(--block-accent-soft,#dbeafe) px-4 py-3 text-base leading-relaxed text-(--block-accent-ink,#1d4ed8)">
              {item.scenarioSituation}
            </blockquote>
          </div>
        </figure>

        <div className="space-y-2">
          <p id={questionId} className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            O que você faz?
          </p>
          <div role="group" aria-labelledby={questionId} className="space-y-2">
            {options.map((option, index) => {
              const isChosen = chosen === option.id
              const tone = !chosen
                ? 'border-gray-200 text-gray-800 hover:border-(--block-accent,#2563eb) hover:bg-(--block-accent,#2563eb)/10 dark:border-gray-700 dark:text-gray-200'
                : isChosen
                  ? option.outcome === 'correct'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-200'
                    : 'border-red-400 bg-red-50 text-red-900 dark:border-red-600 dark:bg-red-900/20 dark:text-red-200'
                  : 'border-gray-100 text-gray-500 opacity-50 dark:border-gray-800 dark:text-gray-400'

              return (
                <button
                  key={option.id}
                  ref={index === 0 ? firstOptionRef : undefined}
                  type="button"
                  onClick={() => choose(option.id)}
                  disabled={!!chosen}
                  aria-pressed={isChosen}
                  className={`flex w-full items-start gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${tone}`}
                >
                  <span
                    aria-hidden
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="leading-relaxed">{option.text}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div aria-live="polite">
          {selected && (
            <div
              ref={feedbackRef}
              tabIndex={-1}
              className={`space-y-3 rounded-lg border px-4 py-3 text-sm leading-relaxed focus:outline-none ${
                right
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
                  : 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'
              }`}
            >
              <p className="flex items-center gap-2 font-semibold">
                {right ? (
                  <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0" />
                ) : (
                  <XCircle aria-hidden className="h-4 w-4 shrink-0" />
                )}
                {right ? 'Boa decisão!' : 'Essa escolha tem problemas.'}
              </p>
              {selected.consequence && <p>{selected.consequence}</p>}
              {!right && (
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex items-center gap-2 rounded-lg border border-current/30 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <RotateCcw aria-hidden className="h-4 w-4" />
                  Tentar de novo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
