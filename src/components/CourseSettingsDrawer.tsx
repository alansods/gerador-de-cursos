'use client'

import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Settings, GripVertical, Trash2, Plus } from 'lucide-react'
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

interface Unidade {
  id: string
  titulo: string
  descricao?: string
  conteudo?: unknown[]
}

interface CourseData {
  titulo: string
  descricao: string
  categoria: string
  cargaHoraria: string
}

interface CourseSettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseData: CourseData
  unidades: Unidade[]
  onSave: (courseData: CourseData, unidades: Unidade[]) => void
  onAddUnidade: () => void
  onDeleteUnidade: (id: string) => void
}

function SortableUnidadeItem({
  unidade,
  index,
  onDelete,
}: {
  unidade: Unidade
  index: number
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: unidade.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

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
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {unidade.titulo}
        </p>
      </div>

      <button
        onClick={() => onDelete(unidade.id)}
        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export function CourseSettingsDrawer({
  open,
  onOpenChange,
  courseData,
  unidades,
  onSave,
  onAddUnidade,
  onDeleteUnidade,
}: CourseSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'geral' | 'unidades'>('geral')
  const [localCourseData, setLocalCourseData] = useState(courseData)
  const [localUnidades, setLocalUnidades] = useState(unidades)

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

    const oldIndex = localUnidades.findIndex((u) => u.id === active.id)
    const newIndex = localUnidades.findIndex((u) => u.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      setLocalUnidades(arrayMove(localUnidades, oldIndex, newIndex))
    }
  }

  const handleSave = () => {
    onSave(localCourseData, localUnidades)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLocalCourseData(courseData)
    setLocalUnidades(unidades)
    onOpenChange(false)
  }

  React.useEffect(() => {
    if (open) {
      setLocalCourseData(courseData)
      setLocalUnidades(unidades)
    }
  }, [open, courseData, unidades])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 !w-[480px] !max-w-[480px]">
        <SheetHeader className="pb-4 border-b border-gray-200 dark:border-gray-700 px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                CONFIGURAÇÕES
              </p>
              <SheetTitle className="text-xl">Sobre o curso</SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('geral')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'geral'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Geral
            </button>
            <button
              onClick={() => setActiveTab('unidades')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'unidades'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Unidades
            </button>
          </div>

          {activeTab === 'geral' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome do curso
                </label>
                <Input
                  value={localCourseData.titulo}
                  onChange={(e) =>
                    setLocalCourseData({ ...localCourseData, titulo: e.target.value })
                  }
                  placeholder="Digite o nome do curso"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descrição curta
                </label>
                <Textarea
                  value={localCourseData.descricao}
                  onChange={(e) =>
                    setLocalCourseData({ ...localCourseData, descricao: e.target.value })
                  }
                  placeholder="Digite uma breve descrição"
                  rows={4}
                  className="w-full resize-none bg-white dark:bg-gray-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categoria
                </label>
                <Select
                  value={localCourseData.categoria}
                  onValueChange={(value) =>
                    setLocalCourseData({ ...localCourseData, categoria: value })
                  }
                >
                  <SelectTrigger className="w-full bg-white dark:bg-gray-800">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="negocios">Negócios</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="desenvolvimento-pessoal">Desenvolvimento Pessoal</SelectItem>
                    <SelectItem value="saude-bem-estar">Saúde e Bem-estar</SelectItem>
                    <SelectItem value="linguas">Línguas</SelectItem>
                    <SelectItem value="gastronomia">Gastronomia</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Carga horária
                </label>
                <Input
                  value={localCourseData.cargaHoraria}
                  onChange={(e) =>
                    setLocalCourseData({ ...localCourseData, cargaHoraria: e.target.value })
                  }
                  placeholder="Ex: 20 horas"
                  className="w-full"
                />
              </div>
            </div>
          )}

          {activeTab === 'unidades' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Arraste para reordenar. Clique no nome para renomear.
              </p>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localUnidades.map((u) => u.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {localUnidades.map((unidade, index) => (
                      <SortableUnidadeItem
                        key={unidade.id}
                        unidade={unidade}
                        index={index}
                        onDelete={onDeleteUnidade}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <button
                onClick={onAddUnidade}
                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-blue-600 dark:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Nova unidade</span>
              </button>
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
