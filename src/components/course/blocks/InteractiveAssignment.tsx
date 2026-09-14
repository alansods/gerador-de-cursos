'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { Check, RotateCcw, X } from 'lucide-react'
import { useRegistrarQuiz } from '@/components/course/ScormProgressContext'
import { illustrationCardStyle } from '@/lib/illustration-paths'

export interface AssignmentChip {
  id: string
  text: string
  correctTarget: string
}

export interface AssignmentTarget {
  id: string
  label: string
  image?: string
}

export interface AssignmentInstructions {
  mouse: string
  touch: string
}

const BANK = '__banco__'

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function chipClassName(active: boolean, correct: boolean | null) {
  return `flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
    correct === true
      ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-200'
      : correct === false
        ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200'
        : active
          ? 'border-(--block-accent,#2563eb) bg-blue-50 ring-2 ring-(--block-accent,#2563eb) dark:bg-blue-950/40'
          : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800'
  }`
}

function ChipContent({ chip, correct }: { chip: AssignmentChip; correct: boolean | null }) {
  return (
    <>
      {correct === true && <Check className="h-4 w-4 shrink-0" />}
      {correct === false && <X className="h-4 w-4 shrink-0" />}
      <span>{chip.text}</span>
    </>
  )
}

function Chip({
  chip,
  active,
  correct,
  locked,
  onSelect,
}: {
  chip: AssignmentChip
  active: boolean
  correct: boolean | null
  locked: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: chip.id,
    disabled: locked,
  })

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      disabled={locked}
      className={`${chipClassName(active, correct)} touch-manipulation select-none [-webkit-touch-callout:none] disabled:cursor-default ${
        locked ? '' : 'cursor-grab active:cursor-grabbing'
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      <ChipContent chip={chip} correct={correct} />
    </button>
  )
}

function Zone({
  id,
  label,
  image,
  emptyText: empty,
  canReceive,
  chips,
  onReceive,
  children,
}: {
  id: string
  label: string
  image?: string
  emptyText: string
  canReceive: boolean
  chips: AssignmentChip[]
  onReceive: () => void
  children: (chip: AssignmentChip) => React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border border-dashed p-3 transition-colors ${
        isOver
          ? 'border-(--block-accent,#2563eb) bg-blue-50 dark:bg-blue-950/40'
          : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40'
      }`}
    >
      <button
        type="button"
        onClick={onReceive}
        disabled={!canReceive}
        className="mb-2 w-full text-left text-sm font-semibold text-gray-900 disabled:cursor-default dark:text-gray-100"
      >
        {image && (
          <img
            src={image}
            alt=""
            className="mb-2 h-28 w-full rounded-md bg-white object-contain p-1"
            style={illustrationCardStyle(image)}
          />
        )}
        {label}
        {canReceive && (
          <span className="ml-2 text-xs font-normal text-(--block-accent,#2563eb)">
            mover para aqui
          </span>
        )}
      </button>

      <div className="flex flex-wrap gap-2">
        {chips.length > 0 ? (
          chips.map((chip) => children(chip))
        ) : (
          <p className="text-xs italic text-gray-500 dark:text-gray-400">{empty}</p>
        )}
      </div>
    </div>
  )
}

export function InteractiveAssignment({
  chips,
  targets,
  singleCapacity,
  bankLabel: dbLabel,
  instructions,
  blockIndex,
}: {
  chips: AssignmentChip[]
  targets: AssignmentTarget[]
  singleCapacity: boolean
  bankLabel: string
  instructions: AssignmentInstructions
  blockIndex?: number
}) {
  const recordResult = useRegistrarQuiz(blockIndex)
  const dndId = useId()

  const [order, setOrder] = useState<string[]>(() => chips.map((f) => f.id))
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [result, setResult] = useState<{ acertos: number; total: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    setOrder(shuffle(chips.map((f) => f.id)))
    setAssignments({})
    setSelected(null)
    setDragging(null)
    setResult(null)
  }, [chips])

  const byId = useMemo(() => new Map(chips.map((f) => [f.id, f])), [chips])
  const inOrder = order.map((id) => byId.get(id)).filter((f): f is AssignmentChip => !!f)
  const inBank = inOrder.filter((f) => !assignments[f.id])
  const allAssigned = inBank.length === 0 && inOrder.length > 0

  const move = (chipId: string, targetId: string) => {
    if (result) return
    setAssignments((current) => {
      const next = { ...current }
      if (targetId === BANK) {
        delete next[chipId]
        return next
      }
      if (singleCapacity) {
        for (const [id, destination] of Object.entries(next)) {
          if (destination === targetId && id !== chipId) delete next[id]
        }
      }
      next[chipId] = targetId
      return next
    })
    setSelected(null)
  }

  const receive = (targetId: string) => () => {
    if (selected) move(selected, targetId)
  }

  const verify = () => {
    const correctCount = inOrder.filter((f) => assignments[f.id] === f.correctTarget).length
    const tally = { acertos: correctCount, total: inOrder.length }
    setResult(tally)
    setSelected(null)
    recordResult(tally)
  }

  const restart = () => {
    setOrder(shuffle(chips.map((f) => f.id)))
    setAssignments({})
    setSelected(null)
    setDragging(null)
    setResult(null)
  }

  const chipText = (id: UniqueIdentifier) => byId.get(String(id))?.text ?? ''
  const zoneLabel = (id: UniqueIdentifier) =>
    id === BANK ? dbLabel : (targets.find((t) => t.id === id)?.label ?? '')

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Arrastando ${chipText(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${chipText(active.id)} sobre ${zoneLabel(over.id)}.`
        : `${chipText(active.id)} fora de uma área.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${chipText(active.id)} solto em ${zoneLabel(over.id)}.`
        : `${chipText(active.id)} solto fora de uma área. Nada mudou.`,
    onDragCancel: ({ active }) => `Arrasto de ${chipText(active.id)} cancelado.`,
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setSelected(null)
    setDragging(String(active.id))
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null)
    if (over) move(String(active.id), String(over.id))
  }

  const renderChip = (chip: AssignmentChip) => (
    <Chip
      key={chip.id}
      chip={chip}
      active={selected === chip.id}
      correct={result ? assignments[chip.id] === chip.correctTarget : null}
      locked={!!result}
      onSelect={() => setSelected(selected === chip.id ? null : chip.id)}
    />
  )

  if (chips.length === 0 || targets.length === 0) return null

  const canReceive = !!selected && !result
  const draggingChip = dragging ? byId.get(dragging) : undefined

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: `${instructions.mouse} ${instructions.touch}`,
        },
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="mb-4 space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 no-hover:hidden">
          {instructions.mouse}
        </p>
        <p className="hidden text-sm text-gray-600 dark:text-gray-400 no-hover:block">
          {instructions.touch}
        </p>

        <Zone
          id={BANK}
          label={dbLabel}
          emptyText="Nenhum item restante."
          canReceive={canReceive}
          chips={inBank}
          onReceive={receive(BANK)}
        >
          {renderChip}
        </Zone>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {targets.map((target) => (
            <Zone
              key={target.id}
              id={target.id}
              label={target.label}
              image={target.image}
              emptyText="Solte um item aqui."
              canReceive={canReceive}
              chips={inOrder.filter((f) => assignments[f.id] === target.id)}
              onReceive={receive(target.id)}
            >
              {renderChip}
            </Zone>
          ))}
        </div>

        <div aria-live="polite" className="flex flex-wrap items-center gap-3">
          {result ? (
            <>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {result.acertos} de {result.total} corretos
              </p>
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <RotateCcw className="h-4 w-4" />
                Tentar novamente
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={verify}
              disabled={!allAssigned}
              className="rounded-lg bg-(--block-accent,#2563eb) px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Verificar
            </button>
          )}
        </div>
      </div>

      {mounted &&
        createPortal(
          <DragOverlay dropAnimation={null}>
            {draggingChip ? (
              <div className={`${chipClassName(false, null)} cursor-grabbing shadow-lg`}>
                <ChipContent chip={draggingChip} correct={null} />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  )
}
