'use client'

import { Fragment } from 'react'
import { layoutRegistry } from '@/components/course/layouts'
import type { DeteccaoMarcadores } from '@/lib/marcadores'
import type { DadosCursoManual } from '@/lib/validacao-curso'
import type { MetodoCriacao } from './useNovoCursoWizard'

interface StepRevisaoProps {
  metodo: MetodoCriacao | null
  dados: DadosCursoManual
  layout: string
  arquivo: File | null
  marcadores: DeteccaoMarcadores | null
  onEditar: (etapa: number) => void
}

interface LinhaResumo {
  rotulo: string
  valor: string
  detalhe?: string
  etapa: number
}

export function StepRevisao({
  metodo,
  dados,
  layout,
  arquivo,
  marcadores,
  onEditar,
}: StepRevisaoProps) {
  const ehIa = metodo === 'ia'
  const meta = layoutRegistry[layout]?.meta

  const linhas: LinhaResumo[] = [
    {
      rotulo: 'Método',
      valor: ehIa ? 'Gerar por IA' : 'Criação manual',
      detalhe: ehIa
        ? marcadores?.encontrados
          ? 'Estrutura definida pelos marcadores do documento'
          : 'Estrutura definida pela IA a partir do conteúdo'
        : 'Campos preenchidos manualmente',
      etapa: 1,
    },
    ehIa
      ? {
          rotulo: 'Documento',
          valor: arquivo?.name ?? '—',
          detalhe: arquivo ? `${(arquivo.size / 1024 / 1024).toFixed(2)} MB` : undefined,
          etapa: 2,
        }
      : {
          rotulo: 'Curso',
          valor: dados.titulo || '—',
          detalhe: [dados.categoria, `${dados.cargaHoraria} horas`, dados.modalidade]
            .filter(Boolean)
            .join(' · '),
          etapa: 2,
        },
    {
      rotulo: 'Layout',
      valor: meta?.nome ?? layout,
      detalhe: meta?.descricao,
      etapa: 3,
    },
  ]

  if (!ehIa) {
    linhas.push({ rotulo: 'Descrição', valor: dados.descricao || '—', etapa: 2 })
  }

  return (
    <div className="max-w-3xl overflow-hidden rounded-xl border border-border">
      {linhas.map((linha, indice) => (
        <Fragment key={linha.rotulo}>
          <div
            className={`flex items-start gap-5 bg-card p-4 ${indice > 0 ? 'border-t border-border' : ''}`}
          >
            <span className="w-28 shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {linha.rotulo}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium leading-relaxed text-foreground">
                {linha.valor}
              </span>
              {linha.detalhe && (
                <span className="mt-0.5 block text-sm text-muted-foreground">{linha.detalhe}</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => onEditar(linha.etapa)}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Editar
            </button>
          </div>
        </Fragment>
      ))}
    </div>
  )
}
