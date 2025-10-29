import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";

export interface QuizOption {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isCorrect: boolean;
  feedback: {
    correct: string;
    incorrect: string;
  };
}

export interface QuizConfig {
  title: string;
  description: string;
  scenario: {
    title: string;
    description: string;
    question: string;
  };
  options: QuizOption[];
  feedbackMessages: {
    correct: string;
    incorrect: string;
  };
}

interface QuizReutilizavelProps {
  config: QuizConfig;
  onComplete?: (isCorrect: boolean) => void;
  onReset?: () => void;
}

export function QuizReutilizavel({
  config,
  onComplete,
  onReset,
}: QuizReutilizavelProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<QuizOption[]>([]);

  // Função para embaralhar as opções
  const shuffleArray = (array: QuizOption[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Embaralhar as opções quando o componente monta
  useEffect(() => {
    setShuffledOptions(shuffleArray(config.options));
  }, [config.options]);

  const handleOptionSelect = (optionId: string) => {
    if (showFeedback) return;

    setSelectedOption(optionId);
    const option = shuffledOptions.find((opt) => opt.id === optionId);
    if (option) {
      setShowFeedback(true);

      // Callback para quando o quiz é completado
      if (onComplete) {
        onComplete(option.isCorrect);
      }
    }
  };

  const resetQuiz = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    // Embaralhar novamente as opções
    setShuffledOptions(shuffleArray(config.options));

    // Callback para quando o quiz é resetado
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-blue-600 dark:text-blue-400 mb-2">
          {config.title}
        </h2>
        <p className="text-center text-sm sm:text-base md:text-lg text-muted-foreground mb-6">
          {config.description}
        </p>

        <div className="bg-muted p-4 sm:p-6 rounded-lg border-l-4 border-blue-500 dark:border-blue-400">
          <h3 className="font-semibold text-base sm:text-lg mb-3 text-foreground">
            {config.scenario.title}
          </h3>
          <p className="text-foreground leading-relaxed text-sm sm:text-base">
            {config.scenario.description}
          </p>
          <div className="mt-4 p-3 sm:p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm sm:text-base">
              {config.scenario.question}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {shuffledOptions.map((option) => {
          const isSelected = selectedOption === option.id;
          const showCorrect = showFeedback && option.isCorrect;
          const showIncorrect = showFeedback && isSelected && !option.isCorrect;

          return (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all duration-300 ${
                isSelected
                  ? showCorrect
                    ? "ring-2 ring-green-500 dark:ring-green-400 bg-green-50 dark:bg-green-900/20"
                    : showIncorrect
                    ? "ring-2 ring-red-500 dark:ring-red-400 bg-red-50 dark:bg-red-900/20"
                    : "ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : showFeedback
                  ? "cursor-default"
                  : "hover:shadow-lg hover:scale-105"
              } ${showFeedback && !isSelected ? "opacity-60" : ""}`}
              onClick={() => handleOptionSelect(option.id)}
            >
              <CardHeader className="text-center p-4 sm:p-6 pb-2 sm:pb-2">
                <div className="flex justify-center mb-2">
                  <Badge
                    variant={
                      isSelected
                        ? showCorrect
                          ? "default"
                          : "destructive"
                        : "secondary"
                    }
                    className="text-sm sm:text-lg px-2 sm:px-3 py-1"
                  >
                    {option.label}
                  </Badge>
                </div>
                <div className="flex justify-center mb-3">
                  <div className="w-6 h-6 mt-6">{option.icon}</div>
                </div>
                <CardTitle className="text-base sm:text-lg">
                  {option.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed">
                  {option.description}
                </p>
                {isSelected && showFeedback && (
                  <div className="mt-4 p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      {showCorrect ? (
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      )}
                      <span
                        className={`font-semibold text-sm sm:text-base ${
                          showCorrect ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {showCorrect ? "Correto!" : "Incorreto"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      {showCorrect
                        ? option.feedback.correct
                        : option.feedback.incorrect}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showFeedback && (
        <div className="mt-6 sm:mt-8 text-center">
          <Button
            onClick={resetQuiz}
            variant="outline"
            className="text-sm sm:text-base"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>
        </div>
      )}
    </div>
  );
}
