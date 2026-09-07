'use client'

import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const TAREFAS_IA = [
  'Extraindo o texto do documento',
  'Gerando a estrutura com IA',
  'Montando as unidades do curso',
]

export const TAREFAS_MANUAL = [
  'Validando as informações',
  'Salvando o curso',
  'Preparando o editor',
]

interface CriandoCursoProps {
  ehIa: boolean
  progresso: number
  tarefaAtual: number
}

export function CriandoCurso({ ehIa, progresso, tarefaAtual }: CriandoCursoProps) {
  const tarefas = ehIa ? TAREFAS_IA : TAREFAS_MANUAL

  return (
    <div className="flex flex-col items-center py-12">
      <div
        className="w-full max-w-md"
        role="status"
        aria-live="polite"
        aria-label={ehIa ? 'Gerando seu curso com IA' : 'Criando seu curso'}
      >
        <div className="flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        </div>

        <h3 className="mt-5 text-center text-xl font-semibold text-foreground">
          {ehIa ? 'Gerando seu curso com IA' : 'Criando seu curso'}
        </h3>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>

        <ul className="mt-5 flex flex-col gap-3">
          {tarefas.map((tarefa, indice) => {
            const concluida = indice < tarefaAtual
            const corrente = indice === tarefaAtual

            return (
              <li key={tarefa} className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                    concluida &&
                      'border-emerald-600 bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-500',
                    corrente && 'border-primary',
                    !concluida && !corrente && 'border-border'
                  )}
                >
                  {concluida && (
                    <Check className="h-3 w-3 text-white dark:text-emerald-950" aria-hidden />
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm',
                    corrente ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {tarefa}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
