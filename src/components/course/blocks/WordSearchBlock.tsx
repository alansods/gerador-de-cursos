'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { Check, CircleCheck, Eye, Hand, Keyboard } from 'lucide-react'
import type { Block } from '@/types/course'
import { useRegistrarQuiz } from '@/components/course/ScormProgressContext'
import {
  buildWordSearch,
  matchSelection,
  placementCells,
  selectionCells,
  snapToLine,
  type GridCell,
} from '@/lib/word-search'

interface Selection {
  start: GridCell
  end: GridCell
}

type StatusKind = 'ok' | 'err' | 'info'

const HATCH = 'repeating-linear-gradient(135deg, var(--ws-rev-a) 0 4px, var(--ws-rev-b) 4px 8px)'
const WORD_COLORS = 6
const WRONG_FLASH_MS = 750

const color = (index: number, part: 'bg' | 'fg' | 'ring') =>
  `var(--ws-${index % WORD_COLORS}-${part})`
const cellKey = (cell: GridCell) => `${cell.row},${cell.col}`

export function WordSearchBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const recordResult = useRegistrarQuiz(blockIndex)
  const items = useMemo(() => item.wordSearchItems ?? [], [item.wordSearchItems])
  const layout = useMemo(
    () => buildWordSearch(items, item.wordSearchSeed ?? 1),
    [items, item.wordSearchSeed]
  )
  const placed = useMemo(
    () => items.filter((word) => layout.placements.some((p) => p.id === word.id)),
    [items, layout]
  )

  const [found, setFound] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [selection, setSelection] = useState<Selection | null>(null)
  const dragRef = useRef<Selection | null>(null)
  const [wrong, setWrong] = useState<Selection | null>(null)
  const [cursor, setCursor] = useState<GridCell>({ row: 0, col: 0 })
  const [anchor, setAnchor] = useState<GridCell | null>(null)
  const [keyboardMode, setKeyboardMode] = useState(false)
  const [focused, setFocused] = useState(false)
  const [lastFound, setLastFound] = useState<string | null>(null)
  const [status, setStatus] = useState<{ text: string; kind: StatusKind } | null>(null)
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setFound([])
    setRevealed(false)
    setConfirming(false)
    setSelection(null)
    setWrong(null)
    setAnchor(null)
    setLastFound(null)
    setStatus(null)
  }, [layout])

  useEffect(() => () => clearTimeout(wrongTimer.current), [])

  if (placed.length === 0) {
    return (
      <div className="mb-4 text-sm italic text-gray-500 dark:text-gray-400">
        Caça-palavras sem palavras
      </div>
    )
  }

  const total = placed.length
  const done = found.length === total
  const locked = done || revealed
  const colorIndex = new Map(items.map((word, index) => [word.id, index]))
  const wordOf = (id: string) => layout.placements.find((p) => p.id === id)
  const lettersOf = (cells: GridCell[]) => cells.map((c) => layout.grid[c.row][c.col]).join('')

  const commit = (current: Selection) => {
    const cells = selectionCells(current.start, current.end)
    dragRef.current = null
    setSelection(null)
    setAnchor(null)
    if (cells.length < 2) return

    const hit = matchSelection(current.start, current.end, layout.placements)
    const hitPlacement = hit ? wordOf(hit) : undefined
    if (hit && hitPlacement) {
      const word = lettersOf(placementCells(hitPlacement))
      if (found.includes(hit)) {
        setStatus({ text: `Você já encontrou ${word}.`, kind: 'info' })
        return
      }
      const next = [...found, hit]
      setFound(next)
      setLastFound(hit)
      setConfirming(false)
      setStatus({ text: `Boa! ${word} encontrada.`, kind: 'ok' })
      if (next.length === total) recordResult({ acertos: total, total })
      return
    }
    setWrong(current)
    setStatus({
      text: `${lettersOf(cells)} não é uma das respostas. Tente outra sequência.`,
      kind: 'err',
    })
    clearTimeout(wrongTimer.current)
    wrongTimer.current = setTimeout(() => setWrong(null), WRONG_FLASH_MS)
  }

  const cellFromPointer = (event: PointerEvent<HTMLDivElement>): GridCell => {
    const rect = event.currentTarget.getBoundingClientRect()
    const clamp = (value: number) => Math.max(0, Math.min(layout.size - 1, value))
    return {
      row: clamp(Math.floor(((event.clientY - rect.top) / rect.height) * layout.size)),
      col: clamp(Math.floor(((event.clientX - rect.left) / rect.width) * layout.size)),
    }
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (locked || confirming || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const cell = cellFromPointer(event)
    clearTimeout(wrongTimer.current)
    setWrong(null)
    setAnchor(null)
    setKeyboardMode(false)
    dragRef.current = { start: cell, end: cell }
    setSelection(dragRef.current)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const end = snapToLine(drag.start, cellFromPointer(event), layout.size)
    if (end.row !== drag.end.row || end.col !== drag.end.col) {
      dragRef.current = { start: drag.start, end }
      setSelection(dragRef.current)
    }
  }

  const onPointerUp = () => {
    if (dragRef.current) commit(dragRef.current)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (locked || confirming) return
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    }
    const move = moves[event.key]
    if (move) {
      event.preventDefault()
      const clamp = (value: number) => Math.max(0, Math.min(layout.size - 1, value))
      const next = { row: clamp(cursor.row + move[0]), col: clamp(cursor.col + move[1]) }
      setKeyboardMode(true)
      setCursor(next)
      if (anchor) setSelection({ start: anchor, end: snapToLine(anchor, next, layout.size) })
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setKeyboardMode(true)
      if (anchor) {
        commit({ start: anchor, end: snapToLine(anchor, cursor, layout.size) })
        return
      }
      setAnchor(cursor)
      setWrong(null)
      setSelection({ start: cursor, end: cursor })
      setStatus({
        text: `Início marcado na letra ${layout.grid[cursor.row][cursor.col]}. Vá até a última letra e aperte Enter.`,
        kind: 'info',
      })
      return
    }
    if (event.key === 'Escape' && anchor) {
      event.preventDefault()
      setAnchor(null)
      setSelection(null)
      setStatus({ text: 'Seleção cancelada.', kind: 'info' })
    }
  }

  const reveal = () => {
    setRevealed(true)
    setConfirming(false)
    setSelection(null)
    setAnchor(null)
    setStatus(null)
    recordResult({ acertos: found.length, total })
  }

  const coverage = new Map<string, string[]>()
  for (const p of layout.placements) {
    for (const cell of placementCells(p)) {
      const key = cellKey(cell)
      coverage.set(key, [...(coverage.get(key) ?? []), p.id])
    }
  }
  const selectionKeys = new Set(
    selection ? selectionCells(selection.start, selection.end).map(cellKey) : []
  )
  const wrongKeys = new Set(wrong ? selectionCells(wrong.start, wrong.end).map(cellKey) : [])
  const showCursor = focused && keyboardMode && !locked

  const cellStyle = (cell: GridCell): { style: CSSProperties; animation: string } => {
    const key = cellKey(cell)
    const owners = coverage.get(key) ?? []
    const foundOwners = owners
      .filter((id) => found.includes(id))
      .map((id) => colorIndex.get(id) ?? 0)
    const revealedOwner = revealed && owners.some((id) => !found.includes(id))
    let style: CSSProperties = {}
    let animation = ''

    if (foundOwners.length === 1) {
      style = {
        background: color(foundOwners[0], 'bg'),
        color: color(foundOwners[0], 'fg'),
        fontWeight: 700,
        boxShadow: `inset 0 0 0 1.5px ${color(foundOwners[0], 'ring')}`,
      }
    } else if (foundOwners.length > 1) {
      style = {
        background: `linear-gradient(135deg, ${color(foundOwners[0], 'bg')} 0 50%, ${color(foundOwners[1], 'bg')} 50% 100%)`,
        fontWeight: 700,
        boxShadow: `inset 0 0 0 1.5px ${color(foundOwners[0], 'ring')}`,
      }
    } else if (revealedOwner) {
      style = {
        background: HATCH,
        color: 'var(--ws-rev-fg)',
        fontWeight: 700,
        outline: '1.5px dashed var(--ws-rev-ring)',
        outlineOffset: '-4px',
      }
    }
    if (lastFound && owners.includes(lastFound)) animation = 'ws-pop'
    if (wrongKeys.has(key)) {
      style = { background: 'var(--ws-err-bg)', color: 'var(--ws-err-fg)', fontWeight: 700 }
      animation = 'ws-shake'
    }
    if (selectionKeys.has(key)) {
      style = {
        background: 'var(--block-accent, #2563eb)',
        color: 'var(--ws-on-accent)',
        fontWeight: 700,
      }
      animation = ''
    }
    if (showCursor && cursor.row === cell.row && cursor.col === cell.col) {
      style = {
        ...style,
        boxShadow: `inset 0 0 0 3px ${selectionKeys.has(key) ? 'currentColor' : 'var(--block-accent, #2563eb)'}`,
      }
    }
    return { style, animation }
  }

  const statusTone =
    status?.kind === 'err'
      ? 'text-red-700 dark:text-red-300'
      : status?.kind === 'ok'
        ? 'text-emerald-700 dark:text-emerald-300'
        : 'text-gray-600 dark:text-gray-400'

  return (
    <div
      data-word-search
      className="block-surface @container mb-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 @2xl:p-6"
    >
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Leia as dicas, descubra cada palavra e arraste sobre as letras, da primeira à última.
      </p>

      <div className="flex flex-col gap-6 @2xl:flex-row @2xl:items-start @2xl:gap-8">
        <div className="flex flex-col gap-3 @2xl:w-[392px] @2xl:shrink-0">
          <div className={`min-h-8 items-center gap-2 ${locked ? 'hidden' : 'flex'}`}>
            {selection ? (
              <span
                aria-hidden="true"
                className="rounded-lg bg-(--block-accent,#2563eb) px-2.5 py-1 font-mono text-[15px] font-bold tracking-[0.14em] text-(--ws-on-accent)"
              >
                {lettersOf(selectionCells(selection.start, selection.end))}
              </span>
            ) : (
              !locked && (
                <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  {keyboardMode && focused ? (
                    <>
                      <Keyboard aria-hidden className="h-4 w-4" />
                      Setas movem · Enter marca início e fim
                    </>
                  ) : (
                    <>
                      <Hand aria-hidden className="h-4 w-4" />
                      Arraste sobre as letras
                    </>
                  )}
                </span>
              )
            )}
          </div>

          <div className="rounded-xl border-[1.5px] border-dashed border-gray-300 bg-gray-100/70 p-1.5 focus-within:border-solid focus-within:border-(--block-accent,#2563eb) dark:border-gray-600 dark:bg-gray-800/40 @2xl:p-2">
            <div
              role="application"
              aria-roledescription="grade de letras"
              aria-label={`Grade de letras, ${layout.size} por ${layout.size}. ${found.length} de ${total} palavras encontradas. Use as setas para mover e Enter para marcar a primeira e a última letra de uma palavra.`}
              tabIndex={locked ? -1 : 0}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                dragRef.current = null
                setSelection(null)
              }}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false)
                if (anchor) {
                  setAnchor(null)
                  setSelection(null)
                }
              }}
              className={`grid touch-none select-none gap-0.5 outline-none @2xl:gap-[3px] ${locked ? 'cursor-default' : 'cursor-crosshair'}`}
              style={{ gridTemplateColumns: `repeat(${layout.size}, minmax(0, 1fr))` }}
            >
              {layout.grid.flatMap((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const { style, animation } = cellStyle({ row: rowIndex, col: colIndex })
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      aria-hidden="true"
                      className={`flex aspect-square items-center justify-center rounded-[5px] bg-gray-50 font-mono text-base leading-none font-medium text-gray-900 dark:bg-gray-800/80 dark:text-gray-100 @2xl:text-lg ${animation}`}
                      style={style}
                    >
                      {letter}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <p aria-live="polite" className={`min-h-[22px] text-sm font-semibold ${statusTone}`}>
            {locked ? '' : status?.text}
          </p>

          <div className="flex flex-col gap-2">
            <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
              {found.length} de {total} palavras
            </span>
            <div
              role="progressbar"
              aria-label="Palavras encontradas"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={found.length}
              className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
            >
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${done ? 'bg-emerald-500' : 'bg-(--block-accent,#2563eb)'}`}
                style={{ width: `${Math.round((found.length / total) * 100)}%` }}
              />
            </div>
          </div>

          {!locked && !confirming && (
            <button
              type="button"
              onClick={() => {
                setConfirming(true)
                setSelection(null)
                setAnchor(null)
              }}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-[15px] font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              <Eye aria-hidden className="h-4 w-4" />
              Ver respostas
            </button>
          )}

          {confirming && !locked && (
            <div
              role="alertdialog"
              aria-label="Confirmar ver respostas"
              className="flex flex-col gap-3 rounded-xl border border-gray-300 bg-gray-50 p-3.5 dark:border-gray-600 dark:bg-gray-800/60"
            >
              <p className="text-[15px] leading-snug text-gray-900 dark:text-gray-100">
                Ver as respostas encerra a atividade. Sua nota fica em{' '}
                <strong>
                  {found.length} de {total}
                </strong>
                .
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={reveal}
                  className="min-h-11 rounded-lg bg-(--block-accent,#2563eb) px-4 text-[15px] font-semibold text-(--ws-on-accent) hover:opacity-90"
                >
                  Mostrar respostas
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="min-h-11 rounded-lg px-4 text-[15px] font-semibold text-gray-900 hover:bg-white dark:text-gray-100 dark:hover:bg-gray-900"
                >
                  Continuar procurando
                </button>
              </div>
            </div>
          )}

          {done && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3.5 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100"
            >
              <CircleCheck aria-hidden className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <p className="font-bold">Muito bem! Você encontrou todas as palavras.</p>
                <p className="text-sm">
                  Nota: {total} de {total}.
                </p>
              </div>
            </div>
          )}

          {revealed && !done && (
            <div
              role="status"
              className="flex flex-col gap-3 rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 dark:border-gray-600 dark:bg-gray-800/60"
            >
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">Respostas reveladas</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Você encontrou {found.length} de {total} palavras. Essa é a sua nota.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-[13px] text-gray-900 dark:text-gray-100">
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-[18px] w-[18px] rounded-[5px]"
                    style={{
                      background: color(0, 'bg'),
                      boxShadow: `inset 0 0 0 1.5px ${color(0, 'ring')}`,
                    }}
                  />
                  Encontrada por você
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-[18px] w-[18px] rounded-[5px]"
                    style={{
                      background: HATCH,
                      outline: '1.5px dashed var(--ws-rev-ring)',
                      outlineOffset: '-1.5px',
                    }}
                  />
                  Revelada
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 grow flex-col gap-2">
          <h3 className="mb-1 text-[15px] font-bold text-gray-900 dark:text-gray-100">Dicas</h3>
          <ol className="flex flex-col gap-2">
            {placed.map((word, index) => {
              const isFound = found.includes(word.id)
              const isRevealed = revealed && !isFound
              const tone = colorIndex.get(word.id) ?? index
              const letters = wordOf(word.id) ? lettersOf(placementCells(wordOf(word.id)!)) : ''
              const chipStyle: CSSProperties = isFound
                ? {
                    background: color(tone, 'bg'),
                    color: color(tone, 'fg'),
                    boxShadow: `inset 0 0 0 1.5px ${color(tone, 'ring')}`,
                  }
                : {
                    background: HATCH,
                    color: 'var(--ws-rev-fg)',
                    outline: '1.5px dashed var(--ws-rev-ring)',
                    outlineOffset: '-1.5px',
                  }

              return (
                <li
                  key={word.id}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isFound || isRevealed ? '' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-300 ring-inset dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-600'}`}
                    style={isFound || isRevealed ? chipStyle : undefined}
                  >
                    {isFound ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : isRevealed ? (
                      <Eye className="h-[15px] w-[15px]" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1.5 pt-[3px]">
                    <p
                      className={`text-[15px] leading-snug ${isFound ? 'text-gray-500 line-through decoration-[1.5px] dark:text-gray-400' : isRevealed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}
                    >
                      <span className="sr-only">
                        {`Dica ${index + 1}${isFound ? ', encontrada: ' : isRevealed ? ', revelada: ' : ': '}`}
                      </span>
                      {word.clue}
                    </p>
                    {(isFound || isRevealed) && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-md px-2 py-0.5 font-mono text-sm font-bold tracking-[0.08em]"
                          style={chipStyle}
                        >
                          {letters}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {isFound ? 'Encontrada' : 'Revelada'}
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}
