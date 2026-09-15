'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { LayoutGrid, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BlockRenderer } from '@/components/course/blocks'
import {
  BLOCK_CATEGORIES,
  isGradableBlock,
  modalEntriesFor,
  type BlockModalEntry,
} from '@/lib/blocks'
import {
  BLOCK_GUIDE,
  BLOCK_SAMPLES,
  type BlockGuide,
  type ShowcaseEntryId,
} from '@/lib/block-showcase'

function ShowcaseEntry({ entry }: { entry: BlockModalEntry }) {
  const t = useTranslations('blocks')
  const id = entry.id as ShowcaseEntryId
  const [graded, setGraded] = useState(true)
  const [resetCount, setResetCount] = useState(0)
  const sample = BLOCK_SAMPLES[id]
  const guide = BLOCK_GUIDE[id]
  const gradable = isGradableBlock(sample)
  const Icon = entry.icon

  const guideRows: { key: keyof BlockGuide; label: string }[] = [
    { key: 'authorFills', label: t('authorFills') },
    { key: 'learnerDoes', label: t('learnerDoes') },
    { key: 'grading', label: t('grading') },
    { key: 'marker', label: t('marker') },
  ]

  return (
    <Card id={entry.id} className="relative scroll-mt-20 gap-0 overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{entry.label}</h2>
            <p className="text-sm text-muted-foreground">{entry.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {gradable && (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={graded}
                onChange={(e) => setGraded(e.target.checked)}
                className="h-4 w-4"
              />
              {t('graded')}
            </label>
          )}
          <Button variant="outline" size="sm" onClick={() => setResetCount((count) => count + 1)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('reset')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5">
        <div className="min-w-0 p-4 sm:p-5 lg:col-span-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('sample')}
          </p>
          <BlockRenderer
            key={`${resetCount}-${graded}`}
            block={[{ ...sample, graded: graded ? undefined : false }]}
          />
        </div>
        <dl className="space-y-4 border-t border-border bg-muted/40 p-4 sm:p-5 lg:col-span-2 lg:border-l lg:border-t-0">
          {guideRows.map(({ key, label }) =>
            guide[key] ? (
              <div key={key}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-foreground">{guide[key]}</dd>
              </div>
            ) : null
          )}
        </dl>
      </div>
    </Card>
  )
}

export default function BlocksPage() {
  const t = useTranslations('blocks')

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-6 sm:px-6">
        <PageHeader icon={LayoutGrid} title={t('title')} description={t('description')} />

        <Tabs defaultValue={BLOCK_CATEGORIES[0].id}>
          <TabsList className="w-full max-w-full justify-start overflow-x-auto">
            {BLOCK_CATEGORIES.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex-none whitespace-nowrap"
              >
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {BLOCK_CATEGORIES.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-6 space-y-6">
              {modalEntriesFor(category.id).map((entry) => (
                <ShowcaseEntry key={entry.id} entry={entry} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageTransition>
  )
}
