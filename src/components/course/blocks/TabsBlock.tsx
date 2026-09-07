'use client'

import { Tabs } from 'radix-ui'
import { ConteudoUnidade } from '@/types/gerador-curso'

export function TabsBlock({ item }: { item: ConteudoUnidade }) {
  const itens = item.itensTabs ?? []

  if (itens.length === 0) {
    return <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">Abas vazias</div>
  }

  return (
    <div className="mb-4">
      <Tabs.Root defaultValue={itens[0].id || 'tab-0'} className="w-full">
        <Tabs.List
          className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700"
          aria-label="Conteúdo em abas"
        >
          {itens.map((tab, idx) => (
            <Tabs.Trigger
              key={tab.id || idx}
              value={tab.id || `tab-${idx}`}
              className="shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent transition-colors hover:text-gray-900 dark:hover:text-gray-100 data-[state=active]:border-(--block-accent,#2563eb) data-[state=active]:text-(--block-accent,#2563eb)"
            >
              {tab.titulo}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {itens.map((tab, idx) => (
          <Tabs.Content
            key={tab.id || idx}
            value={tab.id || `tab-${idx}`}
            className="pt-4 text-gray-700 dark:text-gray-300 leading-relaxed"
          >
            <div dangerouslySetInnerHTML={{ __html: tab.conteudo }} />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  )
}
