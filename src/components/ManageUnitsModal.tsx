'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UnitsList } from './UnitsList'
import { useCourseEditor } from '@/context/CourseEditorContext'
import { Unit } from '@/types/course'

interface ManageUnitsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  units: Unit[]
}

export function ManageUnitsModal({ open, onOpenChange, units }: ManageUnitsModalProps) {
  const { addUnit, updateUnit, deleteUnit, reorderUnits } = useCourseEditor()

  const [localUnits, setLocalUnits] = useState<Unit[]>(units)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setLocalUnits(units)
      setEditingId(null)
    }
  }, [open, units])

  const handleReorder = (newOrder: Unit[]) => {
    setLocalUnits(newOrder)
  }

  const handleAdd = async () => {
    const newUnit = {
      titulo: `Nova Unidade ${localUnits.length + 1}`,
      descricao: 'Descrição da unidade',
      conteudo: [],
    }
    setPending(true)
    try {
      await addUnit(newUnit)
    } finally {
      setPending(false)
    }
  }

  const handleEdit = async (id: string, newTitle: string) => {
    const unit = localUnits.find((u) => u.id === id)
    if (!unit) return

    setPending(true)
    try {
      await updateUnit(id, { titulo: newTitle })
      setLocalUnits((prev) => prev.map((u) => (u.id === id ? { ...u, titulo: newTitle } : u)))
    } finally {
      setPending(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (localUnits.length <= 1) {
      alert('Não é possível deletar a última unidade do curso.')
      return
    }

    if (!confirm('Tem certeza que deseja deletar esta unidade? Esta ação não pode ser desfeita.')) {
      return
    }

    setPending(true)
    try {
      await deleteUnit(id)
    } finally {
      setPending(false)
    }
  }

  const handleSave = async () => {
    setPending(true)
    try {
      await reorderUnits(localUnits)
      onOpenChange(false)
    } finally {
      setPending(false)
    }
  }

  const handleCancel = () => {
    setLocalUnits(units)
    setEditingId(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Gerenciar Unidades</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <UnitsList
            units={localUnits}
            onReorder={handleReorder}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            editingId={editingId || undefined}
            onStartEdit={setEditingId}
            onCancelEdit={() => setEditingId(null)}
            disabled={pending}
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={pending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
