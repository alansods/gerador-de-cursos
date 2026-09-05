import { ConteudoUnidade } from '@/types/gerador-curso'

export function TituloBlock({ item }: { item: ConteudoUnidade }) {
  return (
    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 mt-4 first:mt-0">
      {item.conteudo}
    </h3>
  )
}
