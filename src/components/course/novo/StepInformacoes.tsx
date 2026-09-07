'use client'

import { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORIAS_CURSO, MODALIDADES_CURSO, VALIDATION_RULES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CampoCursoManual, DadosCursoManual } from '@/lib/validacao-curso'
import { CampoComErro } from './CampoComErro'
import { useGrupoRadio } from './useGrupoRadio'

const LIMITE_DESCRICAO = VALIDATION_RULES.NOVO_CURSO.DESCRICAO_MAX

interface StepInformacoesProps {
  dados: DadosCursoManual
  erros: Partial<Record<CampoCursoManual, string>>
  mostrarErro: (campo: CampoCursoManual) => boolean
  onAlterar: (campo: CampoCursoManual, valor: string) => void
  onBlur: (campo: CampoCursoManual) => void
  enviado?: boolean
}

export function StepInformacoes({
  dados,
  erros,
  mostrarErro,
  onAlterar,
  onBlur,
  enviado = false,
}: StepInformacoesProps) {
  const caracteres = dados.descricao.trim().length
  const container = useRef<HTMLDivElement>(null)

  const categorias = useGrupoRadio(CATEGORIAS_CURSO, dados.categoria || null, (categoria) =>
    onAlterar('categoria', categoria)
  )
  const modalidades = useGrupoRadio(MODALIDADES_CURSO, dados.modalidade || null, (modalidade) =>
    onAlterar('modalidade', modalidade)
  )

  useEffect(() => {
    if (!enviado) return
    focarPrimeiroInvalido(container.current)
  }, [enviado])

  return (
    <div ref={container} className="flex max-w-3xl flex-col gap-6">
      <CampoComErro label="Título do curso" erro={erros.titulo} mostrarErro={mostrarErro('titulo')}>
        {(props) => (
          <Input
            {...props}
            value={dados.titulo}
            maxLength={VALIDATION_RULES.NOVO_CURSO.TITULO_MAX}
            onChange={(e) => onAlterar('titulo', e.target.value)}
            onBlur={() => onBlur('titulo')}
            placeholder="Ex.: Fundamentos de Automação Industrial"
            className={cn('h-11', mostrarErro('titulo') && 'border-destructive')}
          />
        )}
      </CampoComErro>

      <CampoComErro label="Categoria" erro={erros.categoria} mostrarErro={mostrarErro('categoria')}>
        {(props) => (
          <div
            id={props.id}
            role="radiogroup"
            aria-label="Categoria"
            aria-invalid={props['aria-invalid']}
            aria-describedby={props['aria-describedby']}
            className="flex flex-wrap gap-2"
          >
            {CATEGORIAS_CURSO.map((categoria, indice) => {
              const selecionada = dados.categoria === categoria
              return (
                <button
                  key={categoria}
                  ref={categorias.registrar(indice)}
                  type="button"
                  role="radio"
                  aria-checked={selecionada}
                  tabIndex={categorias.tabIndex(indice)}
                  onKeyDown={(evento) => categorias.aoTeclar(evento, indice)}
                  onClick={() => onAlterar('categoria', categoria)}
                  className={cn(
                    'h-9 rounded-full border px-4 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    selecionada
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {categoria}
                </button>
              )
            })}
          </div>
        )}
      </CampoComErro>

      <CampoComErro
        label="Descrição"
        erro={erros.descricao}
        mostrarErro={mostrarErro('descricao')}
        contador={`${caracteres} / ${LIMITE_DESCRICAO}`}
        contadorExcedido={caracteres > LIMITE_DESCRICAO}
      >
        {(props) => (
          <Textarea
            {...props}
            rows={4}
            value={dados.descricao}
            onChange={(e) => onAlterar('descricao', e.target.value)}
            onBlur={() => onBlur('descricao')}
            placeholder="O que o aluno será capaz de fazer ao concluir este curso?"
            className={cn(mostrarErro('descricao') && 'border-destructive')}
          />
        )}
      </CampoComErro>

      <div className="grid gap-6 sm:grid-cols-2">
        <CampoComErro
          label="Carga horária"
          erro={erros.cargaHoraria}
          mostrarErro={mostrarErro('cargaHoraria')}
        >
          {(props) => (
            <div className="relative">
              <Input
                {...props}
                inputMode="numeric"
                maxLength={4}
                value={dados.cargaHoraria}
                onChange={(e) => onAlterar('cargaHoraria', e.target.value)}
                onBlur={() => onBlur('cargaHoraria')}
                placeholder="40"
                className={cn('pr-16', mostrarErro('cargaHoraria') && 'border-destructive')}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                horas
              </span>
            </div>
          )}
        </CampoComErro>

        <CampoComErro
          label="Modalidade"
          erro={erros.modalidade}
          mostrarErro={mostrarErro('modalidade')}
        >
          {(props) => (
            <div
              id={props.id}
              role="radiogroup"
              aria-label="Modalidade"
              className="flex gap-1 rounded-lg bg-muted p-1"
            >
              {MODALIDADES_CURSO.map((modalidade, indice) => {
                const selecionada = dados.modalidade === modalidade
                return (
                  <button
                    key={modalidade}
                    ref={modalidades.registrar(indice)}
                    type="button"
                    role="radio"
                    aria-checked={selecionada}
                    tabIndex={modalidades.tabIndex(indice)}
                    onKeyDown={(evento) => modalidades.aoTeclar(evento, indice)}
                    onClick={() => onAlterar('modalidade', modalidade)}
                    className={cn(
                      'h-8 flex-1 rounded-md text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selecionada
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {modalidade}
                  </button>
                )
              })}
            </div>
          )}
        </CampoComErro>
      </div>
    </div>
  )
}

function focarPrimeiroInvalido(container: HTMLDivElement | null) {
  if (!container) return

  const invalido = container.querySelector<HTMLElement>('[aria-invalid="true"]')
  if (!invalido) return

  const focavel = invalido.matches('input, textarea, select, button')
    ? invalido
    : invalido.querySelector<HTMLElement>('button, input, textarea, select')

  focavel?.focus()
}
