'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { QUIZ_OPTIONS } from '@/lib/blocks'
import type { QuizItem, QuizQuestion } from '@/types/course'

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function createOption(isCorrect: boolean): QuizItem {
  return { id: uid('op'), text: '', isCorrect, feedback: '' }
}

export function createQuizQuestion(): QuizQuestion {
  return {
    id: uid('q'),
    question: '',
    hint: '',
    options: Array.from({ length: QUIZ_OPTIONS.min }, (_, index) => createOption(index === 0)),
  }
}

function removeOption(options: QuizItem[], optionId: string): QuizItem[] {
  const remaining = options.filter((option) => option.id !== optionId)
  if (remaining.some((option) => option.isCorrect)) return remaining
  return remaining.map((option, index) => ({ ...option, isCorrect: index === 0 }))
}

export function QuizQuestionsField({
  questions,
  onChange,
}: {
  questions: QuizQuestion[]
  onChange: (questions: QuizQuestion[]) => void
}) {
  const update = (id: string, change: Partial<QuizQuestion>) =>
    onChange(
      questions.map((question) => (question.id === id ? { ...question, ...change } : question))
    )

  const updateOption = (question: QuizQuestion, optionId: string, change: Partial<QuizItem>) =>
    update(question.id, {
      options: question.options.map((option) =>
        option.id === optionId ? { ...option, ...change } : option
      ),
    })

  const move = (index: number, offset: number) => {
    const target = index + offset
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Perguntas <span className="text-destructive">*</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...questions, createQuizQuestion()])}
          className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar pergunta
        </Button>
      </div>

      {questions.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          Nenhuma pergunta adicionada ainda.
        </p>
      )}

      {questions.map((question, index) => (
        <Card key={question.id} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Pergunta {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={index === 0}
                aria-label={`Mover pergunta ${index + 1} para cima`}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={index === questions.length - 1}
                aria-label={`Mover pergunta ${index + 1} para baixo`}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remover pergunta ${index + 1}`}
                onClick={() => onChange(questions.filter((other) => other.id !== question.id))}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <FormField
            compact
            label={
              <>
                Enunciado <span className="text-destructive">*</span>
              </>
            }
          >
            <Textarea
              value={question.question}
              onChange={(e) => update(question.id, { question: e.target.value })}
              placeholder="O que o aluno precisa responder..."
              rows={2}
              className="text-sm"
            />
          </FormField>

          <FormField compact label="Dica">
            <Input
              value={question.hint ?? ''}
              onChange={(e) => update(question.id, { hint: e.target.value })}
              placeholder="Pista mostrada se o aluno pedir (opcional)..."
              className="text-sm"
            />
          </FormField>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">
              Alternativas <span className="text-destructive">*</span>
            </legend>
            <p className="text-xs text-muted-foreground">
              De {QUIZ_OPTIONS.min} a {QUIZ_OPTIONS.max}. Marque a correta.
            </p>

            {question.options.map((option, optionIndex) => {
              const letter = String.fromCharCode(65 + optionIndex)
              return (
                <div key={option.id} className="space-y-2 rounded-md border border-border p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={option.isCorrect}
                      onChange={() =>
                        update(question.id, {
                          options: question.options.map((other) => ({
                            ...other,
                            isCorrect: other.id === option.id,
                          })),
                        })
                      }
                      aria-label={`Alternativa ${letter} é a correta`}
                      className="h-4 w-4"
                    />
                    <span className="w-4 text-sm font-semibold">{letter}</span>
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(question, option.id, { text: e.target.value })}
                      placeholder={`Alternativa ${letter}...`}
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={question.options.length <= QUIZ_OPTIONS.min}
                      aria-label={`Remover alternativa ${letter}`}
                      onClick={() =>
                        update(question.id, { options: removeOption(question.options, option.id) })
                      }
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={option.feedback}
                    onChange={(e) =>
                      updateOption(question, option.id, { feedback: e.target.value })
                    }
                    placeholder={`Feedback da alternativa ${letter}...`}
                    className="text-sm"
                  />
                </div>
              )
            })}

            {question.options.length < QUIZ_OPTIONS.max && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  update(question.id, { options: [...question.options, createOption(false)] })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar alternativa
              </Button>
            )}
          </fieldset>
        </Card>
      ))}
    </div>
  )
}
