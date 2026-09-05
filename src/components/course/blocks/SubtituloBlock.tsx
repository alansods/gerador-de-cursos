import { ConteudoUnidade } from '@/types/gerador-curso'

export function SubtituloBlock({ item }: { item: ConteudoUnidade }) {
  return (
    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 mt-3">
      {item.conteudo}
    </h4>
  )
}
