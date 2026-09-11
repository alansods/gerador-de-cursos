'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Course, Unit, Block, CourseEditorContextType } from '@/types/course'
import { queryKeys } from '@/lib/query-keys'
import {
  useCreateCourseMutation,
  useCourseQuery,
  useUpdateCourseMutation,
} from '@/hooks/queries/useCourseQuery'
import { useDeleteCourseMutation } from '@/hooks/queries/useCoursesQuery'

const CourseEditorContext = createContext<CourseEditorContextType | undefined>(undefined)

export function CourseEditorProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  const { course: currentCourse, isLoading } = useCourseQuery(selectedCourse)
  const create = useCreateCourseMutation()
  const update = useUpdateCourseMutation()
  const remove = useDeleteCourseMutation()

  /**
   * Identidade estável: não depende dos dados do curso, então pode entrar nas
   * deps de um efeito sem se realimentar.
   */
  const selectCourse = useCallback(
    (identifier: string, forceRefresh = false) => {
      setSelectedCourse(identifier)

      if (forceRefresh) {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(identifier) })
      }
    },
    [queryClient]
  )

  const createCourse = useCallback(
    async (course: Omit<Course, 'id' | 'dataCriacao' | 'dataModificacao'>) => {
      const created = await create.mutateAsync(course)
      setSelectedCourse(created.id)
      return created.id
    },
    [create]
  )

  const updateCourse = useCallback(
    async (id: string, course: Partial<Course>) => {
      await update.mutateAsync({
        id,
        course,
        version: currentCourse?.id === id ? currentCourse.version : undefined,
      })
    },
    [update, currentCourse]
  )

  const deleteCourse = useCallback(
    async (id: string) => {
      await remove.mutateAsync(id)
    },
    [remove]
  )

  const saveUnits = useCallback(
    (units: Unit[] | undefined) => {
      if (!currentCourse) return Promise.resolve()
      return updateCourse(currentCourse.id, { unidades: units })
    },
    [currentCourse, updateCourse]
  )

  const addUnit = useCallback(
    (unit: Omit<Unit, 'id' | 'ordem'>) => {
      if (!currentCourse) return Promise.resolve()

      const newUnit: Unit = {
        ...unit,
        id: Date.now().toString(),
        ordem: currentCourse.unidades?.length || 0,
      }

      return saveUnits([...(currentCourse.unidades || []), newUnit])
    },
    [currentCourse, saveUnits]
  )

  const updateUnit = useCallback(
    (unitId: string, data: Partial<Unit>) =>
      saveUnits(currentCourse?.unidades?.map((u) => (u.id === unitId ? { ...u, ...data } : u))),
    [currentCourse, saveUnits]
  )

  const deleteUnit = useCallback(
    (unitId: string) => saveUnits(currentCourse?.unidades?.filter((u) => u.id !== unitId)),
    [currentCourse, saveUnits]
  )

  const reorderUnits = useCallback((units: Unit[]) => saveUnits(units), [saveUnits])

  const mapUnit = useCallback(
    (unitId: string, transform: (unit: Unit) => Unit) =>
      saveUnits(
        currentCourse?.unidades?.map((unit) => (unit.id === unitId ? transform(unit) : unit))
      ),
    [currentCourse, saveUnits]
  )

  const addBlock = useCallback(
    (unitId: string, content: Omit<Block, 'id' | 'ordem'>) =>
      mapUnit(unitId, (unit) => {
        const newBlock: Block = {
          ...content,
          id: Date.now().toString(),
          ordem: unit.conteudo?.length || 0,
        }

        return { ...unit, conteudo: [...(unit.conteudo || []), newBlock] }
      }),
    [mapUnit]
  )

  const updateBlock = useCallback(
    (unitId: string, blockId: string, data: Partial<Block>) => {
      mapUnit(unitId, (unit) => ({
        ...unit,
        conteudo: unit.conteudo?.map((c) => (c.id === blockId ? { ...c, ...data } : c)),
      }))
    },
    [mapUnit]
  )

  const deleteBlock = useCallback(
    (unitId: string, blockId: string) => {
      mapUnit(unitId, (unit) => ({
        ...unit,
        conteudo: unit.conteudo?.filter((c) => c.id !== blockId),
      }))
    },
    [mapUnit]
  )

  const reorderBlocks = useCallback(
    (unitId: string, blocks: Block[]) => {
      mapUnit(unitId, (unit) => ({ ...unit, conteudo: blocks }))
    },
    [mapUnit]
  )

  const state = useMemo(
    () => ({
      currentCourse,
      editMode: currentCourse !== null,
      // sem curso selecionado a query fica ociosa, e ociosa não é carregando
      loading: selectedCourse !== null && isLoading,
    }),
    [currentCourse, selectedCourse, isLoading]
  )

  const value = useMemo(
    (): CourseEditorContextType => ({
      state,
      createCourse,
      updateCourse,
      deleteCourse,
      selectCourse,
      addUnit,
      updateUnit,
      deleteUnit,
      reorderUnits,
      addBlock,
      updateBlock,
      deleteBlock,
      reorderBlocks,
    }),
    [
      state,
      createCourse,
      updateCourse,
      deleteCourse,
      selectCourse,
      addUnit,
      updateUnit,
      deleteUnit,
      reorderUnits,
      addBlock,
      updateBlock,
      deleteBlock,
      reorderBlocks,
    ]
  )

  return <CourseEditorContext.Provider value={value}>{children}</CourseEditorContext.Provider>
}

export function useCourseEditor() {
  const context = useContext(CourseEditorContext)

  if (context === undefined) {
    throw new Error('useGeradorCurso deve ser usado dentro de um GeradorCursoProvider')
  }

  return context
}
