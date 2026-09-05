import { QuizConteudo } from '@/components/QuizConteudo'
import { ConteudoUnidade } from '@/types/gerador-curso'

export function QuizBlock({ item }: { item: ConteudoUnidade }) {
  return (
    <div className="mb-4">
      {item.quizData ? (
        <QuizConteudo quizData={item.quizData} isEdicao={false} />
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
          Quiz incompleto ou sem dados
        </div>
      )}
    </div>
  )
}
