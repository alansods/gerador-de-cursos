'use client'

import { AlertCircle, ArrowRight, Save, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreatingCourse } from './CreatingCourse'
import { CourseCreated } from './CourseCreated'
import { StepDocument } from './StepDocument'
import { StepIndicator, type WizardStep } from './StepIndicator'
import { StepInformation } from './StepInformation'
import { StepLayout } from './StepLayout'
import { StepMethod } from './StepMethod'
import { StepReview } from './StepReview'
import { TOTAL_STEPS, type useNewCourseWizard } from './useNewCourseWizard'

type Wizard = ReturnType<typeof useNewCourseWizard>

interface NewCourseWizardProps {
  wizard: Wizard
  extracting: boolean
  createdCourseTitle: string
  onCancel: () => void
  onFinish: () => void
  onDownloadSample: () => void
  onOpenEditor: () => void
}

export function NewCourseWizard({
  wizard,
  extracting,
  createdCourseTitle,
  onCancel,
  onFinish,
  onDownloadSample,
  onOpenEditor,
}: NewCourseWizardProps) {
  const { state, isAi, phase } = wizard
  const steps = buildSteps(isAi)
  const completed = phase === 'concluido'

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator
        steps={steps}
        currentStep={state.step}
        completedCount={completed}
        onSelect={wizard.goTo}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {phase === 'form' && (
          <header className="border-b border-border px-6 py-5">
            <h2 className="text-xl font-semibold text-foreground">{stepTitle(state.step, isAi)}</h2>
            {stepDescription(state.step, isAi) && (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {stepDescription(state.step, isAi)}
              </p>
            )}
          </header>
        )}

        <div className="px-6 py-6">
          {phase === 'form' && wizard.generationError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{wizard.generationError}</span>
            </div>
          )}

          {phase === 'criando' && (
            <CreatingCourse
              isAi={isAi}
              progress={wizard.progress}
              currentTask={wizard.currentTask}
            />
          )}

          {completed && (
            <CourseCreated
              title={createdCourseTitle}
              summary={wizard.summary}
              onOpenEditor={onOpenEditor}
              onCreateAnother={wizard.restart}
            />
          )}

          {phase === 'form' && (
            <>
              {state.step === 1 && <StepMethod method={state.method} onSelect={wizard.setMethod} />}

              {state.step === 2 && !isAi && (
                <StepInformation
                  data={state.data}
                  errors={wizard.errors}
                  showError={wizard.showError}
                  onChange={wizard.setField}
                  onBlur={wizard.markTouched}
                  submitted={wizard.submitted}
                />
              )}

              {state.step === 2 && isAi && (
                <StepDocument
                  file={wizard.file}
                  extracting={extracting}
                  error={wizard.documentError}
                  warning={wizard.documentWarning}
                  showError={wizard.submitted}
                  onSelect={wizard.selectFile}
                  onRemove={wizard.removeFile}
                  onDownloadSample={onDownloadSample}
                />
              )}

              {state.step === 3 && <StepLayout layout={state.layout} onSelect={wizard.setLayout} />}

              {state.step === 4 && (
                <StepReview
                  method={state.method}
                  data={state.data}
                  layout={state.layout}
                  file={wizard.file}
                  markers={wizard.markers}
                  onEdit={wizard.goTo}
                />
              )}
            </>
          )}
        </div>

        {phase === 'form' && (
          <footer className="sticky bottom-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border bg-card px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={state.step === 1 ? onCancel : wizard.back}
            >
              {state.step === 1 ? 'Cancelar' : 'Voltar'}
            </Button>

            <p
              className="order-last w-full text-sm text-destructive sm:order-none sm:w-auto sm:flex-1 sm:text-right"
              role="alert"
            >
              {footerNotice(wizard)}
            </p>

            <Button type="button" onClick={onFinish} className="ml-auto gap-2 sm:ml-0">
              {actionLabel(state.step, isAi)}
              {state.step === TOTAL_STEPS ? (
                isAi ? (
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

function buildSteps(isAi: boolean): WizardStep[] {
  return [
    { numero: 1, label: 'Método', description: 'Manual ou por IA' },
    {
      numero: 2,
      label: isAi ? 'Documento' : 'Informações',
      description: isAi ? 'Arquivo e leitura' : 'Título e detalhes',
    },
    { numero: 3, label: 'Layout', description: 'Navegação do aluno' },
    { numero: 4, label: 'Revisão', description: 'Confira e crie' },
  ]
}

function stepTitle(step: number, isAi: boolean): string {
  if (step === 1) return 'Como você quer começar?'
  if (step === 2) return isAi ? 'Envie o documento base' : 'Informações do curso'
  if (step === 3) return 'Escolha o layout do curso'
  return 'Revise antes de criar'
}

function stepDescription(step: number, isAi: boolean): string {
  if (step === 1)
    return 'O método define apenas o ponto de partida — todo o conteúdo continua editável depois.'
  if (step === 2)
    return isAi
      ? 'A IA usa exclusivamente o conteúdo do arquivo enviado, sem inventar informação.'
      : ''
  if (step === 3) return 'Define como o aluno navega entre as unidades no pacote SCORM.'
  return 'Confira o resumo abaixo. Você pode voltar e ajustar qualquer etapa.'
}

function actionLabel(step: number, isAi: boolean): string {
  if (step < TOTAL_STEPS) return 'Continuar'
  return isAi ? 'Gerar curso' : 'Criar curso'
}

function footerNotice(wizard: Wizard): string {
  if (!wizard.submitted || wizard.isStepValid(wizard.state.step)) return ''
  if (wizard.state.step === 1) return 'Selecione um método para continuar'
  if (wizard.isAi) return 'Envie um documento para continuar'
  return 'Corrija os campos destacados para continuar'
}
