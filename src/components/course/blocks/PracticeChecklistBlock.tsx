'use client'

import { useEffect, useState } from 'react'
import { ClipboardCheck, PartyPopper } from 'lucide-react'
import { Block } from '@/types/course'
import { usePracticeCompletion } from '@/components/course/ScormProgressContext'

export function PracticeChecklistBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const items = item.practiceItems ?? []
  const { completed, complete } = usePracticeCompletion(blockIndex)
  const [checked, setChecked] = useState<string[]>(() =>
    completed ? items.map((entry) => entry.id) : []
  )

  useEffect(() => {
    setChecked([])
  }, [item.practiceItems])

  useEffect(() => {
    if (completed) setChecked((item.practiceItems ?? []).map((entry) => entry.id))
  }, [completed, item.practiceItems])

  if (items.length === 0) {
    return (
      <div className="mb-4 text-sm italic text-gray-500 dark:text-gray-400">
        Missão prática vazia
      </div>
    )
  }

  const doneCount = items.filter((entry) => checked.includes(entry.id)).length
  const allDone = doneCount === items.length
  const percentage = Math.round((doneCount / items.length) * 100)

  const toggle = (id: string) => {
    const next = checked.includes(id) ? checked.filter((entry) => entry !== id) : [...checked, id]
    setChecked(next)
    if (!completed && items.every((entry) => next.includes(entry.id))) complete()
  }

  return (
    <div className="block-surface mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--block-accent-soft,#dbeafe) text-(--block-accent-ink,#1d4ed8)"
          >
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-(--block-accent,#2563eb)">
              Missão prática
            </p>
            {item.practiceMission && (
              <p className="text-base leading-relaxed text-gray-900 dark:text-gray-100">
                {item.practiceMission}
              </p>
            )}
          </div>
        </div>

        <ul className="space-y-2">
          {items.map((entry) => {
            const isChecked = checked.includes(entry.id)
            return (
              <li key={entry.id}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-(--block-accent,#2563eb)/40 ${
                    isChecked
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-200'
                      : 'border-gray-200 text-gray-800 hover:border-(--block-accent,#2563eb) dark:border-gray-700 dark:text-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(entry.id)}
                    className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-emerald-600"
                  />
                  <span
                    className={`leading-relaxed ${isChecked ? 'line-through decoration-1' : ''}`}
                  >
                    {entry.text}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>

        <div className="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-900 tabular-nums dark:text-gray-100">
            {doneCount} de {items.length} feitos
          </p>
          <div
            role="progressbar"
            aria-label="Progresso da missão"
            aria-valuemin={0}
            aria-valuemax={items.length}
            aria-valuenow={doneCount}
            className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width]"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div aria-live="polite">
            {(allDone || completed) && (
              <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                <PartyPopper aria-hidden className="h-4 w-4 shrink-0" />
                {allDone ? 'Missão cumprida!' : 'Missão já cumprida.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
