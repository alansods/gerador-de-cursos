'use client'

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { Check, X } from 'lucide-react'
import { Block, HotspotItem } from '@/types/course'
import { illustrationCardStyle } from '@/lib/illustration-paths'
import { useRegistrarQuiz } from '@/components/course/ScormProgressContext'
import { maxImageWidth } from './ImageBlock'

export const FIND_MISS_ALLOWANCE = 2
const HIT_RADIUS_PERCENT = 7
const HIT_RADIUS_MIN_PX = 28
const MISS_VISIBLE_MS = 900
const KEYBOARD_STEP = 5

interface Miss {
  id: number
  x: number
  y: number
}

function panelPosition(x: number, y: number) {
  const ancoraX = x < 25 ? '0%' : x > 75 ? '-100%' : '-50%'
  const ancoraY = y > 60 ? 'calc(-100% - 20px)' : '20px'
  return { left: `${x}%`, top: `${y}%`, transform: `translate(${ancoraX}, ${ancoraY})` }
}

export function findHotspotAt(
  hotspots: HotspotItem[],
  x: number,
  y: number,
  width: number,
  height: number
): HotspotItem | undefined {
  const ratio = width > 0 ? height / width : 1
  const radius =
    width > 0 ? Math.max(HIT_RADIUS_PERCENT, (HIT_RADIUS_MIN_PX / width) * 100) : HIT_RADIUS_PERCENT

  let closest: HotspotItem | undefined
  let closestDistance = Infinity
  for (const hotspot of hotspots) {
    const distance = Math.hypot(x - hotspot.x, (y - hotspot.y) * ratio)
    if (distance <= radius && distance < closestDistance) {
      closest = hotspot
      closestDistance = distance
    }
  }
  return closest
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

export function InteractiveImageBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const hotspots = item.hotspots ?? []
  const findMode = item.hotspotMode === 'find'
  const recordResult = useRegistrarQuiz(blockIndex)
  const [isOpen, setIsOpen] = useState<string | null>(null)
  const [found, setFound] = useState<string[]>([])
  const [misses, setMisses] = useState<Miss[]>([])
  const [cursor, setCursor] = useState({ x: 50, y: 50 })
  const [showCursor, setShowCursor] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const triggersRef = useRef<Record<string, HTMLButtonElement | null>>({})
  const missCount = useRef(0)
  const openOnPointerDown = useRef(false)
  const missTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const helpId = useId()

  const close = (restoreFocus: boolean) => {
    const previous = isOpen
    setIsOpen(null)
    if (restoreFocus && previous) triggersRef.current[previous]?.focus()
  }

  useEffect(() => {
    if (!isOpen) return

    const onPointer = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (panelRef.current?.contains(target)) return
      if (target?.closest('[data-hotspot]')) return
      setIsOpen(null)
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(null)
      triggersRef.current[isOpen]?.focus()
    }

    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    const timers = missTimers.current
    return () => timers.forEach(clearTimeout)
  }, [])

  if (!item.baseImage) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">
        Imagem interativa sem imagem de fundo
      </div>
    )
  }

  const selected = hotspots.find((hotspot) => hotspot.id === isOpen)
  const total = hotspots.length
  const complete = findMode && total > 0 && found.length === total

  const tryAt = (x: number, y: number, dismissing: boolean) => {
    if (complete) return

    const rect = areaRef.current?.getBoundingClientRect()
    const hit = findHotspotAt(hotspots, x, y, rect?.width ?? 0, rect?.height ?? 0)

    if (hit) {
      if (!found.includes(hit.id)) {
        const next = [...found, hit.id]
        setFound(next)
        setAnnouncement(`Encontrado: ${hit.title}. ${next.length} de ${total}.`)
        if (next.length === total) {
          recordResult({
            acertos: total,
            total,
            firstTry: missCount.current <= FIND_MISS_ALLOWANCE,
          })
        }
      }
      setIsOpen(hit.id)
      return
    }

    if (dismissing) {
      setIsOpen(null)
      return
    }

    missCount.current += 1
    const miss = { id: missCount.current, x, y }
    setMisses((current) => [...current, miss])
    missTimers.current.push(
      setTimeout(
        () => setMisses((current) => current.filter((entry) => entry.id !== miss.id)),
        MISS_VISIBLE_MS
      )
    )
    setIsOpen(null)
    setAnnouncement('Nada aqui. Tente outro ponto.')
  }

  const onAreaClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const dismissing = openOnPointerDown.current
    openOnPointerDown.current = false
    if (rect.width <= 0 || rect.height <= 0) return
    setShowCursor(false)
    tryAt(
      clampPercent(((event.clientX - rect.left) / rect.width) * 100),
      clampPercent(((event.clientY - rect.top) / rect.height) * 100),
      dismissing
    )
  }

  const onAreaKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-KEYBOARD_STEP, 0],
      ArrowRight: [KEYBOARD_STEP, 0],
      ArrowUp: [0, -KEYBOARD_STEP],
      ArrowDown: [0, KEYBOARD_STEP],
    }
    const move = moves[event.key]

    if (move) {
      event.preventDefault()
      setShowCursor(true)
      setCursor((current) => ({
        x: clampPercent(current.x + move[0]),
        y: clampPercent(current.y + move[1]),
      }))
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setShowCursor(true)
      tryAt(cursor.x, cursor.y, isOpen !== null)
    }
  }

  const foundHotspots = found
    .map((id) => hotspots.find((hotspot) => hotspot.id === id))
    .filter((hotspot): hotspot is HotspotItem => hotspot !== undefined)

  return (
    <div className="mb-4 space-y-3">
      {findMode && (
        <div className="mx-auto flex max-w-full flex-wrap items-center justify-between gap-2 text-sm">
          <p className="font-medium text-gray-800 dark:text-gray-200">
            {complete
              ? `Você encontrou ${total === 1 ? 'o ponto' : `todos os ${total} pontos`}!`
              : total === 1
                ? 'Toque na imagem onde está o ponto.'
                : `Toque na imagem onde está cada um dos ${total} pontos.`}
          </p>
          <span className="rounded-full bg-(--block-accent-soft,#dbeafe) px-3 py-1 font-semibold tabular-nums text-(--block-accent-ink,#1d4ed8)">
            {found.length} de {total} encontrados
          </span>
        </div>
      )}

      <div className={`relative mx-auto w-fit ${maxImageWidth(item.size)}`}>
        <img
          src={item.baseImage}
          alt={item.caption || 'Imagem interativa'}
          className="h-auto max-w-full rounded-lg"
          style={illustrationCardStyle(item.baseImage)}
        />

        {findMode ? (
          <>
            <div
              ref={areaRef}
              role="application"
              tabIndex={complete ? -1 : 0}
              aria-label="Procurar pontos na imagem"
              aria-describedby={helpId}
              onMouseDown={() => {
                openOnPointerDown.current = isOpen !== null
              }}
              onClick={onAreaClick}
              onKeyDown={onAreaKeyDown}
              onBlur={() => setShowCursor(false)}
              className={`absolute inset-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-(--block-accent,#2563eb) ${
                complete ? '' : 'cursor-crosshair'
              }`}
            >
              {showCursor && !complete && (
                <span
                  data-testid="find-cursor"
                  aria-hidden
                  style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
                  className="pointer-events-none absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-white shadow-[0_0_0_2px_rgba(17,24,39,0.8)]"
                />
              )}
              {misses.map((miss) => (
                <span
                  key={miss.id}
                  data-testid="find-miss"
                  aria-hidden
                  style={{ left: `${miss.x}%`, top: `${miss.y}%` }}
                  className="pointer-events-none absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-red-600 bg-white text-red-700 shadow-lg"
                >
                  <X className="h-4 w-4" />
                </span>
              ))}
            </div>
            <span id={helpId} className="sr-only">
              Clique ou toque onde acha que está um ponto. No teclado, use as setas para mover a
              mira e Enter para marcar.
            </span>
            <span aria-live="polite" className="sr-only">
              {announcement}
            </span>

            {foundHotspots.map((hotspot, index) => (
              <button
                key={hotspot.id}
                ref={(element) => {
                  triggersRef.current[hotspot.id] = element
                }}
                type="button"
                data-hotspot
                onClick={() => setIsOpen(isOpen === hotspot.id ? null : hotspot.id)}
                aria-expanded={isOpen === hotspot.id}
                aria-label={`Encontrado ${index + 1}: ${hotspot.title}`}
                style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-emerald-600 bg-white text-emerald-700 shadow-lg transition-transform hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </button>
            ))}
          </>
        ) : (
          hotspots.map((hotspot, index) => (
            <button
              key={hotspot.id}
              ref={(element) => {
                triggersRef.current[hotspot.id] = element
              }}
              type="button"
              data-hotspot
              onClick={() => setIsOpen(isOpen === hotspot.id ? null : hotspot.id)}
              aria-expanded={isOpen === hotspot.id}
              aria-label={`Ponto ${index + 1}: ${hotspot.title}`}
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg transition-transform hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-white ${
                isOpen === hotspot.id
                  ? 'bg-gray-900 dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-(--block-accent,#2563eb)'
              }`}
            >
              {index + 1}
            </button>
          ))
        )}

        {selected && (
          <div
            ref={panelRef}
            role="dialog"
            aria-labelledby={`titulo-${selected.id}`}
            style={panelPosition(selected.x, selected.y)}
            className="absolute z-10 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between gap-2">
              <h4
                id={`titulo-${selected.id}`}
                className="font-semibold text-gray-900 dark:text-gray-100"
              >
                {selected.title}
              </h4>
              <button
                type="button"
                onClick={() => close(true)}
                aria-label="Fechar"
                className="-mr-1 -mt-1 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selected.content && (
              <div
                className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: selected.content }}
              />
            )}
          </div>
        )}
      </div>

      {item.caption && (
        <p className="text-center text-sm italic text-gray-600 dark:text-gray-400">
          {item.caption}
        </p>
      )}
    </div>
  )
}
