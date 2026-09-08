'use client'
import React from 'react'
import type { CursoGerado } from '@/types/gerador-curso'
import { useProgressoScorm } from '@/hooks/useProgressoScorm'
import { ProgressoScormProvider } from '@/components/course/ProgressoScormContext'
import { SidebarNavbar } from './SidebarNavbar'
import { SidebarHome } from './SidebarHome'
import { SidebarUnit } from './SidebarUnit'

interface SidebarPlayerProps {
  curso: CursoGerado
}

export function SidebarPlayer({ curso }: SidebarPlayerProps) {
  const { unidadeAtual, navegar, registrarQuiz, progresso } = useProgressoScorm(curso)

  const handleNavigate = (unitId: string | null) => {
    navegar(unitId)
    window.scrollTo(0, 0)
  }

  return (
    <ProgressoScormProvider valor={{ unidadeId: unidadeAtual, registrarQuiz }}>
      <div className="min-h-screen flex bg-[#f7f7fb] dark:bg-[#121018]">
        <SidebarNavbar
          curso={curso}
          currentUnidadeId={unidadeAtual || undefined}
          onNavigate={handleNavigate}
          progresso={progresso}
        />

        <div className="flex-1 min-w-0 pt-16 md:pt-0">
          {unidadeAtual ? (
            <SidebarUnit curso={curso} unidadeId={unidadeAtual} onNavigate={handleNavigate} />
          ) : (
            <SidebarHome curso={curso} onNavigate={handleNavigate} />
          )}
        </div>
      </div>
    </ProgressoScormProvider>
  )
}
