'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  HelpCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { QuizData } from "@/types/gerador-curso";

interface QuizConteudoProps {
  quizData: QuizData;
  isEdicao?: boolean;
}

export function QuizConteudo({ quizData, isEdicao = false }: QuizConteudoProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [showFeedbacks, setShowFeedbacks] = useState<Record<string, boolean>>({});
  const [showDicas, setShowDicas] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState(false);

  // Verificar quando mostrar resultados
  useEffect(() => {
    if (!isEdicao && !showResults) {
      checkAndShowResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFeedbacks, currentQuestionIndex, isEdicao, showResults]);

  if (!quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-6 text-center text-gray-500 dark:text-gray-400">
            Quiz sem perguntas
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const questionId = currentQuestion.id;
  const selectedOption = selectedOptions[questionId] || null;
  const showFeedback = showFeedbacks[questionId] || false;

  const handleOptionSelect = (optionId: string) => {
    if (showFeedback || isEdicao) return;
    
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionId,
    });
    setShowFeedbacks({
      ...showFeedbacks,
      [questionId]: true,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quando chegar na última pergunta e responder, mostrar resultados
      if (showFeedbacks[questionId]) {
        checkAndShowResults();
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleResetAll = () => {
    setSelectedOptions({});
    setShowFeedbacks({});
    setShowDicas({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  // Verificar se todas as perguntas foram respondidas para mostrar resultados
  const checkAndShowResults = () => {
    const totalQuestions = quizData.questions.length;
    const answeredQuestions = Object.keys(showFeedbacks).length;
    
    if (answeredQuestions === totalQuestions && currentQuestionIndex === totalQuestions - 1) {
      setShowResults(true);
    }
  };

  // Calcular nota e mensagem de feedback
  const calculateResults = () => {
    let correctAnswers = 0;
    
    quizData.questions.forEach((question) => {
      const selectedOptionId = selectedOptions[question.id];
      if (selectedOptionId) {
        const selectedOption = question.opcoes.find((opt) => opt.id === selectedOptionId);
        if (selectedOption?.isCorrect) {
          correctAnswers++;
        }
      }
    });

    const totalQuestions = quizData.questions.length;
    const percentage = (correctAnswers / totalQuestions) * 100;

    let message = "";
    let icon = <Trophy className="h-12 w-12" />;
    let bgColor = "from-green-500 to-emerald-600";
    const textColor = "text-green-50";

    if (percentage === 100) {
      message = "🎉 Parabéns! Você acertou todas as questões! Você demonstrou excelente compreensão do conteúdo!";
      icon = <Trophy className="h-12 w-12" />;
      bgColor = "from-yellow-500 to-amber-600";
    } else if (percentage >= 80) {
      message = "👏 Parabéns! Você teve um ótimo desempenho! Continue assim para alcançar a perfeição!";
      icon = <TrendingUp className="h-12 w-12" />;
      bgColor = "from-green-500 to-emerald-600";
    } else if (percentage >= 60) {
      message = "👍 Bom trabalho! Você está no caminho certo. Revise os conteúdos que errou e tente novamente para melhorar!";
      icon = <TrendingUp className="h-12 w-12" />;
      bgColor = "from-blue-500 to-blue-600";
    } else {
      message = "💪 Não desista! Todo aprendizado requer prática. Revise o conteúdo e tente novamente - você consegue melhorar!";
      icon = <HelpCircle className="h-12 w-12" />;
      bgColor = "from-orange-500 to-red-500";
    }

    return {
      correctAnswers,
      totalQuestions,
      percentage: Math.round(percentage),
      message,
      icon,
      bgColor,
      textColor,
    };
  };


  const toggleDica = (questionId: string) => {
    setShowDicas({
      ...showDicas,
      [questionId]: !showDicas[questionId],
    });
  };

  const totalQuestions = quizData.questions.length;

  // Mostrar tela de resultados
  if (showResults && !isEdicao) {
    const results = calculateResults();

    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="border-2 border-blue-200 dark:border-blue-800 dark:bg-gray-800 shadow-lg overflow-hidden">
          <CardHeader className={`bg-gradient-to-r ${results.bgColor} ${results.textColor} pb-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {results.icon}
                <div>
                  <h3 className="text-2xl font-bold">Resultado do Quiz</h3>
                  <p className="text-sm opacity-90 mt-1">
                    Você completou todas as perguntas!
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {/* Nota */}
            <div className="text-center space-y-4">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="text-6xl font-bold text-gray-900 dark:text-gray-100">
                  {results.correctAnswers}/{results.totalQuestions}
                </div>
                <Badge
                  className={`text-lg px-4 py-2 ${
                    results.percentage >= 80
                      ? "bg-green-500 text-white"
                      : results.percentage >= 60
                      ? "bg-blue-500 text-white"
                      : "bg-orange-500 text-white"
                  } border-0`}
                >
                  {results.percentage}% de acerto
                </Badge>
              </div>
            </div>

            {/* Mensagem de Feedback */}
            <div className={`bg-gradient-to-r ${results.bgColor} rounded-lg p-6 ${results.textColor} shadow-md`}>
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">{results.icon}</div>
                <p className="text-lg font-semibold leading-relaxed">
                  {results.message}
                </p>
              </div>
            </div>

            {/* Botão Reiniciar */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleResetAll}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-8 py-6 text-lg"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {quizData.questions.map((question, questionIndex) => {
        const qId = question.id;
        const qSelectedOption = selectedOptions[qId] || null;
        const qShowFeedback = showFeedbacks[qId] || false;
        const qShowDica = showDicas[qId] || false;
        const qSelectedOptionData = qSelectedOption
          ? question.opcoes.find((opt) => opt.id === qSelectedOption)
          : null;
        const qIsCorrect = qSelectedOptionData?.isCorrect || false;

        // Mostrar apenas a pergunta atual se não estiver em modo edição
        if (!isEdicao && questionIndex !== currentQuestionIndex) {
          return null;
        }

        return (
          <Card
            key={question.id}
            className="border-2 border-blue-200 dark:border-blue-800 shadow-lg bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
          >
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white rounded-t-lg pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-6 w-6" />
                  <div>
                    <h3 className="text-xl font-bold">Quiz Interativo</h3>
                    {totalQuestions > 1 && (
                      <p className="text-sm text-blue-100 dark:text-blue-200 mt-1">
                        Pergunta {questionIndex + 1} de {totalQuestions}
                      </p>
                    )}
                  </div>
                </div>
                {!isEdicao && qShowFeedback && (
                  <Badge
                    variant="secondary"
                    className={`${
                      qIsCorrect
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    } border-0`}
                  >
                    {qIsCorrect ? "Correto!" : "Incorreto"}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-8">
              {/* Pergunta */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border-l-4 border-blue-500 dark:border-blue-600 shadow-sm">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                  {question.pergunta}
                </p>
              </div>

              {/* Botão de Dica */}
              {question.dica && !isEdicao && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => toggleDica(qId)}
                    className={`${
                      qShowDica
                        ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-300"
                        : "bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    } transition-all`}
                    disabled={qShowFeedback}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    {qShowDica ? "Ocultar Dica" : "Mostrar Dica"}
                  </Button>
                </div>
              )}

              {/* Dica */}
              {qShowDica && question.dica && !isEdicao && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-5 shadow-md animate-in slide-in-from-top-2">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Dica:</p>
                      <p className="text-yellow-900 dark:text-yellow-200 leading-relaxed">{question.dica}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Opções de Resposta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {question.opcoes.map((opcao, index) => {
                  const isSelected = qSelectedOption === opcao.id;
                  const showAsCorrect = qShowFeedback && opcao.isCorrect;
                  const showAsIncorrect = qShowFeedback && isSelected && !opcao.isCorrect;

                  return (
                    <Card
                      key={opcao.id}
                      className={`cursor-pointer transition-all duration-300 dark:bg-gray-800 ${
                        isEdicao
                          ? "cursor-default"
                          : qShowFeedback && !isSelected
                          ? "opacity-50 cursor-default"
                          : ""
                      } ${
                        showAsCorrect
                          ? "ring-4 ring-green-500 bg-green-50 dark:bg-green-900/30 border-green-500 shadow-lg scale-105"
                          : showAsIncorrect
                          ? "ring-4 ring-red-500 bg-red-50 dark:bg-red-900/30 border-red-500 shadow-lg"
                          : isSelected && !qShowFeedback
                          ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
                          : "hover:shadow-md hover:scale-105 border-gray-200 dark:border-gray-700"
                      }`}
                      onClick={() => handleOptionSelect(opcao.id)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Label da Opção */}
                          <div className="shrink-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                showAsCorrect
                                  ? "bg-green-500 text-white"
                                  : showAsIncorrect
                                  ? "bg-red-500 text-white"
                                  : "bg-blue-500 text-white"
                              }`}
                            >
                              {String.fromCharCode(65 + index)}
                            </div>
                          </div>

                          {/* Texto da Opção */}
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-gray-100 font-medium leading-relaxed mb-4">
                              {opcao.texto}
                            </p>

                            {/* Feedback da Opção Selecionada */}
                            {isSelected && qShowFeedback && (
                              <div
                                className={`mt-5 p-4 rounded-lg border-2 ${
                                  qIsCorrect
                                    ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
                                    : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {qIsCorrect ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <p
                                      className={`font-semibold mb-2 ${
                                        qIsCorrect
                                          ? "text-green-800 dark:text-green-300"
                                          : "text-red-800 dark:text-red-300"
                                      }`}
                                    >
                                      {qIsCorrect ? "Correto!" : "Incorreto"}
                                    </p>
                                    <p
                                      className={`text-sm leading-relaxed ${
                                        qIsCorrect
                                          ? "text-green-700 dark:text-green-300"
                                          : "text-red-700 dark:text-red-300"
                                      }`}
                                    >
                                      {opcao.feedback}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Feedback Visual para Resposta Correta */}
                            {showAsCorrect && !isSelected && (
                              <div className="mt-5 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                                    Esta é a resposta correta!
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Botões de Navegação */}
              {!isEdicao && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Botão Anterior */}
                  <div>
                    {currentQuestionIndex > 0 && (
                      <Button
                        variant="outline"
                        onClick={handlePreviousQuestion}
                        className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Anterior
                      </Button>
                    )}
                  </div>

                  {/* Botão Próxima / Finalizar */}
                  <div>
                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <Button
                        variant="outline"
                        onClick={handleNextQuestion}
                        className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                        disabled={!qShowFeedback}
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (qShowFeedback) {
                            checkAndShowResults();
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white border-blue-600 dark:border-blue-700"
                        disabled={!qShowFeedback}
                      >
                        Ver Resultados
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
