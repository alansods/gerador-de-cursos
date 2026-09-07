'use client'

import { ArrowRight } from 'lucide-react'
import { CardEscolha } from './CardEscolha'
import { useGrupoRadio } from './useGrupoRadio'
import type { MetodoCriacao } from './useNovoCursoWizard'

const METODOS: MetodoCriacao[] = ['manual', 'ia']

interface StepMetodoProps {
  metodo: MetodoCriacao | null
  onSelecionar: (metodo: MetodoCriacao) => void
}

export function StepMetodo({ metodo, onSelecionar }: StepMetodoProps) {
  const grupo = useGrupoRadio(METODOS, metodo, onSelecionar)

  return (
    <div role="radiogroup" aria-label="Método de criação" className="grid gap-4 md:grid-cols-2">
      <CardEscolha
        ref={grupo.registrar(0)}
        tabIndex={grupo.tabIndex(0)}
        onKeyDown={(evento) => grupo.aoTeclar(evento, 0)}
        titulo="Criação manual"
        descricao="Você define título, categoria e detalhes, e monta as unidades depois no editor."
        selecionado={metodo === 'manual'}
        onSelecionar={() => onSelecionar('manual')}
        itens={['Controle total sobre cada campo', 'Ideal para cursos curtos ou já roteirizados']}
        ilustracao={<IlustracaoManual />}
      />

      <CardEscolha
        ref={grupo.registrar(1)}
        tabIndex={grupo.tabIndex(1)}
        onKeyDown={(evento) => grupo.aoTeclar(evento, 1)}
        titulo="Gerar por IA"
        descricao="Envie um documento Word e a IA monta unidades e conteúdos a partir dele."
        selecionado={metodo === 'ia'}
        onSelecionar={() => onSelecionar('ia')}
        itens={['Usa apenas o conteúdo do documento', 'Ideal para apostilas e roteiros longos']}
        ilustracao={<IlustracaoIa />}
      />
    </div>
  )
}

function IlustracaoManual() {
  return (
    <span className="flex h-28 flex-col justify-center gap-2 rounded-lg bg-muted p-4">
      <span className="flex gap-2">
        <span className="h-6 flex-1 rounded border border-border bg-card" />
        <span className="h-6 flex-1 rounded border border-border bg-card" />
      </span>
      <span className="flex h-11 flex-col justify-center gap-1.5 rounded border border-border bg-card px-2">
        <span className="h-1 w-4/5 rounded-full bg-border" />
        <span className="h-1 w-1/2 rounded-full bg-border/60" />
      </span>
    </span>
  )
}

function IlustracaoIa() {
  return (
    <span className="flex h-28 items-center justify-center gap-3 rounded-lg bg-muted">
      <span className="flex h-20 w-16 flex-col gap-1.5 rounded border border-border bg-card p-2">
        <span className="h-1 w-3/4 rounded-full bg-border" />
        <span className="h-0.5 w-full rounded-full bg-border/60" />
        <span className="h-0.5 w-5/6 rounded-full bg-border/60" />
        <span className="h-0.5 w-full rounded-full bg-border/60" />
        <span className="h-0.5 w-2/3 rounded-full bg-border/60" />
      </span>
      <ArrowRight className="h-4 w-4 text-highlight" aria-hidden />
      <span className="flex h-20 w-16 flex-col gap-1.5 rounded border border-primary/30 bg-card p-2 shadow-sm">
        <span className="h-1 w-2/3 rounded-full bg-primary" />
        <span className="h-0.5 w-full rounded-full bg-primary/25" />
        <span className="h-3 w-full rounded bg-primary/10" />
        <span className="h-0.5 w-4/5 rounded-full bg-primary/25" />
        <span className="h-3 w-full rounded bg-primary/10" />
      </span>
    </span>
  )
}
