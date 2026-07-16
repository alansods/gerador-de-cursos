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
import { UnidadesList } from './UnidadesList'
import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { Unidade } from '@/types/gerador-curso'

interface ManageUnitsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unidades: Unidade[]
}

export function ManageUnitsModal({ open, onOpenChange, unidades }: ManageUnitsModalProps) {
  const { adicionarUnidade, editarUnidade, deletarUnidade, reordenarUnidades } = useGeradorCurso()

  const [localUnidades, setLocalUnidades] = useState<Unidade[]>(unidades)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLocalUnidades(unidades)
      setEditingId(null)
    }
  }, [open, unidades])

  const handleReorder = (newOrder: Unidade[]) => {
    setLocalUnidades(newOrder)
  }

  const handleAdd = () => {
    const novaUnidade = {
      titulo: `Nova Unidade ${localUnidades.length + 1}`,
      descricao: 'Descrição da unidade',
      conteudo: [],
    }
    adicionarUnidade(novaUnidade)
  }

  const handleEdit = (id: string, novoTitulo: string) => {
    const unidade = localUnidades.find((u) => u.id === id)
    if (unidade) {
      editarUnidade(id, { titulo: novoTitulo })
      setLocalUnidades((prev) => prev.map((u) => (u.id === id ? { ...u, titulo: novoTitulo } : u)))
    }
  }

  const handleDelete = (id: string) => {
    if (localUnidades.length <= 1) {
      alert('Não é possível deletar a última unidade do curso.')
      return
    }

    if (confirm('Tem certeza que deseja deletar esta unidade? Esta ação não pode ser desfeita.')) {
      deletarUnidade(id)
    }
  }

  const handleSave = () => {
    reordenarUnidades(localUnidades)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLocalUnidades(unidades)
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
          <UnidadesList
            unidades={localUnidades}
            onReorder={handleReorder}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            editingId={editingId || undefined}
            onStartEdit={setEditingId}
            onCancelEdit={() => setEditingId(null)}
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
