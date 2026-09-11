import { Block } from '@/types/course'

export function ParagraphBlock({ item }: { item: Block }) {
  return (
    <div
      className={`text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-3 ${
        item.alinhamento === 'centro'
          ? 'text-center'
          : item.alinhamento === 'direita'
            ? 'text-right'
            : item.alinhamento === 'justificado'
              ? 'text-justify'
              : 'text-left'
      }`}
      dangerouslySetInnerHTML={{
        __html: item.conteudo,
      }}
      style={{
        color: item.corTexto || 'inherit',
      }}
    />
  )
}
