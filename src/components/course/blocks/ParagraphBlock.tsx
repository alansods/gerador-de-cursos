import { Block } from '@/types/course'

export function ParagraphBlock({ item }: { item: Block }) {
  return (
    <div
      className={`text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-3 ${
        item.alignment === 'center'
          ? 'text-center'
          : item.alignment === 'right'
            ? 'text-right'
            : item.alignment === 'justify'
              ? 'text-justify'
              : 'text-left'
      }`}
      dangerouslySetInnerHTML={{
        __html: item.content,
      }}
      style={{
        color: item.textColor || 'inherit',
      }}
    />
  )
}
