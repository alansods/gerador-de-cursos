import { Block } from '@/types/course'

export function DividerBlock({ item }: { item: Block }) {
  if (item.estiloSeparador === 'espaco') {
    return <div className="h-12" aria-hidden="true" />
  }

  if (item.estiloSeparador === 'linha-icone') {
    return (
      <div className="my-8 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        <span className="h-2 w-2 rotate-45 bg-(--block-accent,#2563eb)" />
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>
    )
  }

  return <hr className="my-8 border-gray-200 dark:border-gray-700" />
}
