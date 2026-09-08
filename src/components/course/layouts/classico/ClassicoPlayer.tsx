'use client'
import React from 'react'
import type { CursoGerado } from '@/types/gerador-curso'
import { useProgressoScorm } from '@/hooks/useProgressoScorm'
import { ProgressoScormProvider } from '@/components/course/ProgressoScormContext'
import { ClassicoNavbar } from './ClassicoNavbar'
import { ClassicoHome } from './ClassicoHome'
import { ClassicoUnit } from './ClassicoUnit'

interface ClassicoPlayerProps {
  curso: CursoGerado
}

export function ClassicoPlayer({ curso }: ClassicoPlayerProps) {
  const { unidadeAtual, navegar, registrarQuiz, progresso } = useProgressoScorm(curso)

  const handleNavigate = (unitId: string | null) => {
    navegar(unitId)
    window.scrollTo(0, 0)
  }

  return (
    <ProgressoScormProvider valor={{ unidadeId: unidadeAtual, registrarQuiz }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ClassicoNavbar
          curso={curso}
          currentUnidadeId={unidadeAtual || undefined}
          showMenu={true}
          onNavigate={handleNavigate}
          progresso={progresso}
        />

        {unidadeAtual ? (
          <ClassicoUnit curso={curso} unidadeId={unidadeAtual} onNavigate={handleNavigate} />
        ) : (
          <ClassicoHome curso={curso} onNavigate={handleNavigate} />
        )}
      </div>
    </ProgressoScormProvider>
  )
}
