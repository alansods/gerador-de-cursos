import { Block } from '@/types/course'

export function SubheadingBlock({ item }: { item: Block }) {
  return (
    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-3">
      {item.conteudo}
    </h4>
  )
}
