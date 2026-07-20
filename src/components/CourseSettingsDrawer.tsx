'use client'

import React, { useState, useEffect } from 'react'
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
import { Settings } from 'lucide-react'

interface Unidade {
  id: string
  titulo: string
  descricao?: string
  conteudo?: unknown[]
}

interface CourseData {
  titulo: string
  descricao: string
  categoria?: string
  cargaHoraria: string
}

interface CourseSettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseData: CourseData
  unidades: Unidade[]
  onSave: (courseData: CourseData, unidades: Unidade[]) => void
}

export function CourseSettingsDrawer({
  open,
  onOpenChange,
  courseData,
  unidades,
  onSave,
}: CourseSettingsDrawerProps) {
  const [localCourseData, setLocalCourseData] = useState(courseData)
  const [localUnidades, setLocalUnidades] = useState(unidades)

  useEffect(() => {
    setLocalCourseData(courseData)
    setLocalUnidades(unidades)
  }, [courseData, unidades])

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
      <SheetContent className="flex flex-col p-0 !w-[480px] !max-w-[480px] bg-white dark:bg-gray-900">
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
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome do curso
              </label>
              <Input
                value={localCourseData.titulo}
                onChange={(e) => setLocalCourseData({ ...localCourseData, titulo: e.target.value })}
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
                className="resize-none"
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
                <SelectTrigger className="w-full">
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
