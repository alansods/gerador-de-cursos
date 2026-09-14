'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'
import { Block, SheetMaterial } from '@/types/course'
import { illustrationCardStyle } from '@/lib/illustration-paths'

function MaterialCard({ material }: { material: SheetMaterial }) {
  const [broken, setBroken] = useState(false)
  const showImage = !!material.image && !broken

  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div
        className="flex aspect-square items-center justify-center bg-white p-3"
        style={showImage ? illustrationCardStyle(material.image) : undefined}
      >
        {showImage ? (
          <img
            src={material.image}
            alt=""
            onError={() => setBroken(true)}
            className="h-full w-full object-contain"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-full bg-(--block-accent-soft,#dbeafe) text-(--block-accent-ink,#1d4ed8)"
          >
            <Package className="h-6 w-6" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
        <span className="text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
          {material.name}
        </span>
        {material.quantity && (
          <span className="text-xs font-medium text-(--block-accent,#2563eb)">
            {material.quantity}
          </span>
        )}
      </div>
    </li>
  )
}

export function TechnicalSheetBlock({ item }: { item: Block }) {
  const materials = item.sheetMaterials ?? []
  const steps = item.sheetSteps ?? []

  if (materials.length === 0) {
    return (
      <div className="mb-4 text-sm italic text-gray-500 dark:text-gray-400">
        Ficha técnica vazia
      </div>
    )
  }

  return (
    <div className="block-surface mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="space-y-6 p-5">
        {item.sheetSummary && (
          <p className="rounded-lg bg-(--block-accent-soft,#dbeafe) px-4 py-2 text-sm font-medium text-(--block-accent-ink,#1d4ed8)">
            {item.sheetSummary}
          </p>
        )}

        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-(--block-accent,#2563eb)">
            Materiais
          </h4>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {materials.map((material) => (
              <MaterialCard key={`${material.id}:${material.image ?? ''}`} material={material} />
            ))}
          </ul>
        </section>

        {steps.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-(--block-accent,#2563eb)">
              Passos
            </h4>
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={step.id} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--block-accent-soft,#dbeafe) text-xs font-bold text-(--block-accent-ink,#1d4ed8)"
                  >
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-base leading-relaxed text-gray-900 dark:text-gray-100">
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  )
}
