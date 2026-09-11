import { QuizContent } from '@/components/QuizContent'
import { useRegistrarQuiz } from '@/components/course/ScormProgressContext'
import { Block } from '@/types/course'

export function QuizBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const recordResult = useRegistrarQuiz(blockIndex)

  return (
    <div className="mb-4">
      {item.quizData ? (
        <QuizContent quizData={item.quizData} isEditing={false} onResult={recordResult} />
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
          Quiz incompleto ou sem dados
        </div>
      )}
    </div>
  )
}
