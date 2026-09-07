'use client'

import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CATALOGO_BLOCOS, type ResumoGeracao, type TipoBloco } from '@/lib/blocos'

interface CursoCriadoProps {
  titulo: string
  resumo: ResumoGeracao | null
  onAbrirEditor: () => void
  onCriarOutro: () => void
}

export function CursoCriado({ titulo, resumo, onAbrirEditor, onCriarOutro }: CursoCriadoProps) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" aria-hidden />
      </span>

      <h3 className="mt-5 text-2xl font-bold text-foreground">Curso criado</h3>

      <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">{titulo}</span> já está disponível na sua
        lista de cursos.
      </p>

      {resumo && resumo.blocos > 0 && (
        <p className="mt-3 max-w-md text-sm text-muted-foreground">{descreverResumo(resumo)}</p>
      )}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={onAbrirEditor}>
          Abrir no editor
        </Button>
        <Button type="button" variant="outline" onClick={onCriarOutro}>
          Criar outro curso
        </Button>
      </div>
    </div>
  )
}

function descreverResumo(resumo: ResumoGeracao): string {
  const unidades = `${resumo.unidades} ${resumo.unidades === 1 ? 'unidade' : 'unidades'}`
  const blocos = `${resumo.blocos} ${resumo.blocos === 1 ? 'bloco' : 'blocos'}`

  const destaques = (Object.keys(resumo.porTipo) as TipoBloco[])
    .filter((tipo) => CATALOGO_BLOCOS[tipo]?.marcador)
    .sort((a, b) => (resumo.porTipo[b] ?? 0) - (resumo.porTipo[a] ?? 0))
    .slice(0, 3)
    .map((tipo) => {
      const quantidade = resumo.porTipo[tipo] ?? 0
      const meta = CATALOGO_BLOCOS[tipo]
      return `${quantidade} ${quantidade === 1 ? meta.rotulo.toLowerCase() : meta.rotuloPlural}`
    })

  return destaques.length > 0
    ? `${unidades} · ${blocos} · ${destaques.join(', ')}`
    : `${unidades} · ${blocos}`
}
