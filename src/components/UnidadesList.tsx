'use client'

import React, { useState } from 'react'
import { GripVertical, Trash2, Plus, Pencil, Check, X } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '@/components/ui/input'
import { Unidade } from '@/types/gerador-curso'

interface UnidadesListProps {
  unidades: Unidade[]
  onReorder: (newOrder: Unidade[]) => void
  onAdd: () => void
  onEdit: (id: string, novoTitulo: string) => void
  onDelete: (id: string) => void
  editingId?: string
  onStartEdit?: (id: string) => void
  onCancelEdit?: () => void
}

function SortableUnidadeItem({
  unidade,
  index,
  onDelete,
  onEdit,
  isEditing,
  onStartEdit,
  onCancelEdit,
}: {
  unidade: Unidade
  index: number
  onDelete: (id: string) => void
  onEdit: (id: string, novoTitulo: string) => void
  isEditing: boolean
  onStartEdit: (id: string) => void
  onCancelEdit: () => void
}) {
  const [editValue, setEditValue] = useState(unidade.titulo)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: unidade.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      onEdit(unidade.id, editValue.trim())
      onCancelEdit()
    }
  }

  const handleCancelEdit = () => {
    setEditValue(unidade.titulo)
    onCancelEdit()
  }

  React.useEffect(() => {
    if (isEditing) {
      setEditValue(unidade.titulo)
    }
  }, [isEditing, unidade.titulo])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex-shrink-0">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
                if (e.key === 'Escape') handleCancelEdit()
              }}
              className="h-8 text-sm"
              autoFocus
            />
            <button
              onClick={handleSaveEdit}
              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 rounded transition-all"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {unidade.titulo}
          </p>
        )}
      </div>

      {!isEditing && (
        <>
          <button
            onClick={() => onStartEdit(unidade.id)}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-all"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(unidade.id)}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  )
}

export function UnidadesList({
  unidades,
  onReorder,
  onAdd,
  onEdit,
  onDelete,
  editingId,
  onStartEdit,
  onCancelEdit,
}: UnidadesListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = unidades.findIndex((u) => u.id === active.id)
    const newIndex = unidades.findIndex((u) => u.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(unidades, oldIndex, newIndex))
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Arraste para reordenar. Renomeie direto na lista, ou clique no card para navegar. A
        descrição de cada unidade se edita na página dela.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={unidades.map((u) => u.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {unidades.map((unidade, index) => (
              <SortableUnidadeItem
                key={unidade.id}
                unidade={unidade}
                index={index}
                onDelete={onDelete}
                onEdit={onEdit}
                isEditing={editingId === unidade.id}
                onStartEdit={onStartEdit || (() => {})}
                onCancelEdit={onCancelEdit || (() => {})}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={onAdd}
        className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-blue-600 dark:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm font-medium">Nova unidade</span>
      </button>
    </div>
  )
}
