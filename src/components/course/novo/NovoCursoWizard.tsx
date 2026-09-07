'use client'

import { AlertCircle, ArrowRight, Save, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CriandoCurso } from './CriandoCurso'
import { CursoCriado } from './CursoCriado'
import { StepDocumento } from './StepDocumento'
import { StepIndicator, type EtapaWizard } from './StepIndicator'
import { StepInformacoes } from './StepInformacoes'
import { StepLayout } from './StepLayout'
import { StepMetodo } from './StepMetodo'
import { StepRevisao } from './StepRevisao'
import { TOTAL_ETAPAS, type useNovoCursoWizard } from './useNovoCursoWizard'

type Wizard = ReturnType<typeof useNovoCursoWizard>

interface NovoCursoWizardProps {
  wizard: Wizard
  extraindo: boolean
  tituloCursoCriado: string
  onCancelar: () => void
  onConcluir: () => void
  onBaixarExemplo: () => void
  onAbrirEditor: () => void
}

export function NovoCursoWizard({
  wizard,
  extraindo,
  tituloCursoCriado,
  onCancelar,
  onConcluir,
  onBaixarExemplo,
  onAbrirEditor,
}: NovoCursoWizardProps) {
  const { estado, ehIa, fase } = wizard
  const etapas = montarEtapas(ehIa)
  const concluido = fase === 'concluido'

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator
        etapas={etapas}
        etapaAtual={estado.etapa}
        concluidoTotal={concluido}
        onSelecionar={wizard.irPara}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {fase === 'form' && (
          <header className="border-b border-border px-6 py-5">
            <h2 className="text-xl font-semibold text-foreground">
              {tituloEtapa(estado.etapa, ehIa)}
            </h2>
            {descricaoEtapa(estado.etapa, ehIa) && (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {descricaoEtapa(estado.etapa, ehIa)}
              </p>
            )}
          </header>
        )}

        <div className="px-6 py-6">
          {fase === 'form' && wizard.erroGeracao && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{wizard.erroGeracao}</span>
            </div>
          )}

          {fase === 'criando' && (
            <CriandoCurso
              ehIa={ehIa}
              progresso={wizard.progresso}
              tarefaAtual={wizard.tarefaAtual}
            />
          )}

          {concluido && (
            <CursoCriado
              titulo={tituloCursoCriado}
              resumo={wizard.resumo}
              onAbrirEditor={onAbrirEditor}
              onCriarOutro={wizard.reiniciar}
            />
          )}

          {fase === 'form' && (
            <>
              {estado.etapa === 1 && (
                <StepMetodo metodo={estado.metodo} onSelecionar={wizard.definirMetodo} />
              )}

              {estado.etapa === 2 && !ehIa && (
                <StepInformacoes
                  dados={estado.dados}
                  erros={wizard.erros}
                  mostrarErro={wizard.mostrarErro}
                  onAlterar={wizard.definirCampo}
                  onBlur={wizard.marcarTocado}
                  enviado={wizard.enviado}
                />
              )}

              {estado.etapa === 2 && ehIa && (
                <StepDocumento
                  arquivo={wizard.arquivo}
                  extraindo={extraindo}
                  erro={wizard.erroDocumento}
                  aviso={wizard.avisoDocumento}
                  mostrarErro={wizard.enviado}
                  onSelecionar={wizard.selecionarArquivo}
                  onRemover={wizard.removerArquivo}
                  onBaixarExemplo={onBaixarExemplo}
                />
              )}

              {estado.etapa === 3 && (
                <StepLayout layout={estado.layout} onSelecionar={wizard.definirLayout} />
              )}

              {estado.etapa === 4 && (
                <StepRevisao
                  metodo={estado.metodo}
                  dados={estado.dados}
                  layout={estado.layout}
                  arquivo={wizard.arquivo}
                  marcadores={wizard.marcadores}
                  onEditar={wizard.irPara}
                />
              )}
            </>
          )}
        </div>

        {fase === 'form' && (
          <footer className="sticky bottom-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border bg-card px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={estado.etapa === 1 ? onCancelar : wizard.voltar}
            >
              {estado.etapa === 1 ? 'Cancelar' : 'Voltar'}
            </Button>

            <p
              className="order-last w-full text-sm text-destructive sm:order-none sm:w-auto sm:flex-1 sm:text-right"
              role="alert"
            >
              {avisoRodape(wizard)}
            </p>

            <Button type="button" onClick={onConcluir} className="ml-auto gap-2 sm:ml-0">
              {rotuloAcao(estado.etapa, ehIa)}
              {estado.etapa === TOTAL_ETAPAS ? (
                ehIa ? (
                  <Sparkles className="h-4 w-4" aria-hidden />
                ) : (
                  <Save className="h-4 w-4" aria-hidden />
                )
              ) : (
                <ArrowRight className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </footer>
        )}
      </div>
    </div>
  )
}

function montarEtapas(ehIa: boolean): EtapaWizard[] {
  return [
    { numero: 1, rotulo: 'Método', descricao: 'Manual ou por IA' },
    {
      numero: 2,
      rotulo: ehIa ? 'Documento' : 'Informações',
      descricao: ehIa ? 'Arquivo e leitura' : 'Título e detalhes',
    },
    { numero: 3, rotulo: 'Layout', descricao: 'Navegação do aluno' },
    { numero: 4, rotulo: 'Revisão', descricao: 'Confira e crie' },
  ]
}

function tituloEtapa(etapa: number, ehIa: boolean): string {
  if (etapa === 1) return 'Como você quer começar?'
  if (etapa === 2) return ehIa ? 'Envie o documento base' : 'Informações do curso'
  if (etapa === 3) return 'Escolha o layout do curso'
  return 'Revise antes de criar'
}

function descricaoEtapa(etapa: number, ehIa: boolean): string {
  if (etapa === 1)
    return 'O método define apenas o ponto de partida — todo o conteúdo continua editável depois.'
  if (etapa === 2)
    return ehIa
      ? 'A IA usa exclusivamente o conteúdo do arquivo enviado, sem inventar informação.'
      : ''
  if (etapa === 3) return 'Define como o aluno navega entre as unidades no pacote SCORM.'
  return 'Confira o resumo abaixo. Você pode voltar e ajustar qualquer etapa.'
}

function rotuloAcao(etapa: number, ehIa: boolean): string {
  if (etapa < TOTAL_ETAPAS) return 'Continuar'
  return ehIa ? 'Gerar curso' : 'Criar curso'
}

function avisoRodape(wizard: Wizard): string {
  if (!wizard.enviado || wizard.etapaValida(wizard.estado.etapa)) return ''
  if (wizard.estado.etapa === 1) return 'Selecione um método para continuar'
  if (wizard.ehIa) return 'Envie um documento para continuar'
  return 'Corrija os campos destacados para continuar'
}
