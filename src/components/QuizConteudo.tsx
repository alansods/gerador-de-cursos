'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Trophy,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { QuizData } from '@/types/gerador-curso'

interface QuizConteudoProps {
  quizData: QuizData
  isEdicao?: boolean
}

export function QuizConteudo({ quizData, isEdicao = false }: QuizConteudoProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [showFeedbacks, setShowFeedbacks] = useState<Record<string, boolean>>({})
  const [showDicas, setShowDicas] = useState<Record<string, boolean>>({})
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (!isEdicao && !showResults) {
      checkAndShowResults()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFeedbacks, currentQuestionIndex, isEdicao, showResults])

  if (!quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Nenhuma pergunta adicionada.
      </div>
    )
  }

  const currentQuestion = quizData.questions[currentQuestionIndex]
  const questionId = currentQuestion.id
  const selectedOption = selectedOptions[questionId] || null
  const showFeedback = showFeedbacks[questionId] || false

  const handleOptionSelect = (optionId: string) => {
    if (showFeedback || isEdicao) return
    setSelectedOptions({ ...selectedOptions, [questionId]: optionId })
  }

  const handleConfirmar = () => {
    if (!selectedOption || showFeedback || isEdicao) return
    setShowFeedbacks({ ...showFeedbacks, [questionId]: true })
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      if (showFeedbacks[questionId]) checkAndShowResults()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1)
  }

  const handleResetAll = () => {
    setSelectedOptions({})
    setShowFeedbacks({})
    setShowDicas({})
    setCurrentQuestionIndex(0)
    setShowResults(false)
  }

  const checkAndShowResults = () => {
    const total = quizData.questions.length
    const answered = Object.keys(showFeedbacks).length
    if (answered === total && currentQuestionIndex === total - 1) {
      setShowResults(true)
    }
  }

  const calculateResults = () => {
    let correctAnswers = 0
    quizData.questions.forEach((question) => {
      const opt = question.opcoes.find((o) => o.id === selectedOptions[question.id])
      if (opt?.isCorrect) correctAnswers++
    })
    const total = quizData.questions.length
    const pct = Math.round((correctAnswers / total) * 100)
    return { correctAnswers, total, pct }
  }

  const toggleDica = (qId: string) => {
    setShowDicas({ ...showDicas, [qId]: !showDicas[qId] })
  }

  const totalQuestions = quizData.questions.length

  // ── Tela de resultados ────────────────────────────────────────────────────
  if (showResults && !isEdicao) {
    const { correctAnswers, total, pct } = calculateResults()
    const perfect = pct === 100
    const good = pct >= 80
    const ok = pct >= 60

    const scoreColor =
      perfect || good
        ? 'text-emerald-600 dark:text-emerald-400'
        : ok
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-orange-500 dark:text-orange-400'

    const ResultIcon = perfect || good ? Trophy : ok ? TrendingUp : AlertCircle
    const resultMsg = perfect
      ? 'Excelente! Você acertou tudo.'
      : good
        ? 'Ótimo desempenho! Continue assim.'
        : ok
          ? 'Bom trabalho! Revise os erros e tente melhorar.'
          : 'Revise o conteúdo e tente novamente.'

    return (
      <div className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="p-8 flex flex-col items-center gap-6 text-center">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              perfect || good
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : ok
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-orange-100 dark:bg-orange-900/30'
            }`}
          >
            <ResultIcon className={`h-7 w-7 ${scoreColor}`} />
          </div>

          <div>
            <p className={`text-5xl font-bold tabular-nums ${scoreColor}`}>
              {correctAnswers}
              <span className="text-2xl font-normal text-gray-400 dark:text-gray-500">
                /{total}
              </span>
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{pct}% de acerto</p>
          </div>

          <p className="text-gray-700 dark:text-gray-300 text-sm max-w-xs leading-relaxed">
            {resultMsg}
          </p>

          <Button variant="outline" onClick={handleResetAll} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  // ── Questão ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4">
      {quizData.questions.map((question, questionIndex) => {
        const qId = question.id
        const qSelectedOption = selectedOptions[qId] || null
        const qShowFeedback = showFeedbacks[qId] || false
        const qShowDica = showDicas[qId] || false
        const qSelectedOptionData = qSelectedOption
          ? question.opcoes.find((opt) => opt.id === qSelectedOption)
          : null
        const qIsCorrect = qSelectedOptionData?.isCorrect || false

        if (!isEdicao && questionIndex !== currentQuestionIndex) return null

        return (
          <div
            key={question.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  {questionIndex + 1} / {totalQuestions}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                  {questionIndex + 1 === totalQuestions
                    ? 'Última pergunta'
                    : `Faltam ${totalQuestions - questionIndex - 1} pergunta${totalQuestions - questionIndex - 1 > 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Pergunta */}
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                <span className="text-blue-500 dark:text-blue-400 mr-1">{questionIndex + 1}.</span>
                {question.pergunta}
              </p>

              {/* Opções */}
              <div className="space-y-2">
                {question.opcoes.map((opcao, index) => {
                  const isSelected = qSelectedOption === opcao.id
                  const showAsCorrect = qShowFeedback && opcao.isCorrect
                  const showAsIncorrect = qShowFeedback && isSelected && !opcao.isCorrect
                  const dimmed = qShowFeedback && !isSelected && !opcao.isCorrect

                  return (
                    <div key={opcao.id}>
                      <button
                        onClick={() => handleOptionSelect(opcao.id)}
                        disabled={qShowFeedback || isEdicao}
                        className={`w-full text-left rounded-lg border px-4 py-3 flex items-start gap-3 transition-all duration-200 ${
                          showAsCorrect
                            ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                            : showAsIncorrect
                              ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                              : isSelected
                                ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                : dimmed
                                  ? 'border-gray-100 dark:border-gray-800 opacity-40'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
                        }`}
                      >
                        {/* Label */}
                        <span
                          className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 ${
                            showAsCorrect
                              ? 'bg-emerald-500 text-white'
                              : showAsIncorrect
                                ? 'bg-red-500 text-white'
                                : isSelected
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>

                        {/* Texto */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-relaxed ${
                              showAsCorrect
                                ? 'text-emerald-900 dark:text-emerald-200 font-medium'
                                : showAsIncorrect
                                  ? 'text-red-900 dark:text-red-200'
                                  : 'text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {opcao.texto}
                          </p>
                        </div>

                        {/* Ícone de status */}
                        {showAsCorrect && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        )}
                        {showAsIncorrect && (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        )}
                      </button>

                      {/* Feedback da opção selecionada */}
                      {isSelected && qShowFeedback && opcao.feedback && (
                        <div
                          className={`mt-1.5 ml-9 px-3 py-2 rounded-md text-xs leading-relaxed border ${
                            qIsCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {opcao.feedback}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Dica expandida — acima dos botões */}
              {question.dica && !isEdicao && qShowDica && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    {question.dica}
                  </p>
                </div>
              )}

              {/* Navegação */}
              {!isEdicao && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="gap-1.5 text-gray-500 dark:text-gray-400"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>

                  <div className="flex items-center gap-2">
                    {/* Botão de dica */}
                    {question.dica && !qShowFeedback && (
                      <button
                        onClick={() => toggleDica(qId)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                          qShowDica
                            ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                        }`}
                      >
                        <Lightbulb className="h-3.5 w-3.5" />
                        Dica
                      </button>
                    )}

                    {/* Confirmar: aparece quando selecionou mas ainda não confirmou */}
                    {!qShowFeedback && (
                      <Button
                        size="sm"
                        onClick={handleConfirmar}
                        disabled={!qSelectedOption}
                        className="gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white"
                      >
                        Confirmar
                      </Button>
                    )}

                    {/* Após confirmar: Próxima ou Ver Resultado */}
                    {qShowFeedback &&
                      (currentQuestionIndex < totalQuestions - 1 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextQuestion}
                          className="gap-1.5"
                        >
                          Próxima
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={checkAndShowResults}
                          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Ver Resultado
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
