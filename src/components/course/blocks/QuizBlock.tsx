import { QuizConteudo } from '@/components/QuizConteudo'
import { useRegistrarQuiz } from '@/components/course/ProgressoScormContext'
import { ConteudoUnidade } from '@/types/gerador-curso'

export function QuizBlock({ item, blocoIndex }: { item: ConteudoUnidade; blocoIndex?: number }) {
  const registrarResultado = useRegistrarQuiz(blocoIndex)

  return (
    <div className="mb-4">
      {item.quizData ? (
        <QuizConteudo quizData={item.quizData} isEdicao={false} onResultado={registrarResultado} />
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
          Quiz incompleto ou sem dados
        </div>
      )}
    </div>
  )
}
