import { QuizReutilizavel, QuizConfig } from "@/components/quiz";
import { Truck, Package, ArrowRightLeft } from "lucide-react";

const quizConfig: QuizConfig = {
  title: "🏭 Cenário Prático: Movimentação de Cargas",
  description: "Teste seus conhecimentos sobre equipamentos de movimentação",
  scenario: {
    title: "📋 Situação:",
    description:
      "Um armazém precisa mover 50 caixas grandes de um lado para o outro. As caixas são pesadas e o trajeto tem rampas e curvas.",
    question:
      "❓ Qual equipamento você escolheria para fazer essa movimentação de forma segura e eficiente?",
  },
  options: [
    {
      id: "paleteira",
      label: "A",
      title: "Paleteira Manual",
      description: "Baixo custo, mas lenta e exige esforço físico",
      icon: <Package />,
      isCorrect: false,
      feedback: {
        correct: "",
        incorrect:
          "A paleteira manual seria muito lenta para 50 caixas pesadas e exigiria muito esforço físico do operador, especialmente com rampas e curvas no trajeto.",
      },
    },
    {
      id: "empilhadeira",
      label: "B",
      title: "Empilhadeira",
      description:
        "Mais rápida, ideal para cargas pesadas, mas exige um operador qualificado e tem custo mais elevado",
      icon: <Truck />,
      isCorrect: true,
      feedback: {
        correct:
          "Perfeito! A empilhadeira é a escolha ideal para este cenário. Ela pode transportar várias caixas por vez, é adequada para cargas pesadas e pode lidar com rampas e curvas de forma segura e eficiente.",
        incorrect: "",
      },
    },
    {
      id: "esteira",
      label: "C",
      title: "Transportador de Esteira",
      description:
        "Ideal para grandes volumes, mas caro para instalar em um trajeto não fixo",
      icon: <ArrowRightLeft />,
      isCorrect: false,
      feedback: {
        correct: "",
        incorrect:
          "O transportador de esteira seria muito caro para instalar em um trajeto não fixo e não é prático para movimentação pontual de 50 caixas.",
      },
    },
  ],
  feedbackMessages: {
    correct:
      "A empilhadeira é realmente a melhor escolha para este cenário, pois oferece eficiência, segurança e capacidade para lidar com cargas pesadas em trajetos com obstáculos.",
    incorrect: "💡 Tentar novamente?",
  },
};

export function QuizMovimentacaoCargas() {
  return <QuizReutilizavel config={quizConfig} />;
}
