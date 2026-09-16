'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const loadRichTextEditor = () => import('@/components/RichTextEditor')
const loadExportModal = () => import('@/components/ExportModal')
const loadCourseSettingsDrawer = () => import('@/components/CourseSettingsDrawer')
const loadManageUnitsModal = () => import('@/components/ManageUnitsModal')
const loadContentBlockDrawer = () => import('@/components/ContentBlockDrawer')

export const RichTextEditor = dynamic(
  () => loadRichTextEditor().then((module) => module.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="min-h-[160px] w-full animate-pulse rounded-md border border-border bg-muted/40"
      />
    ),
  }
)

export const ExportModal = dynamic(() => loadExportModal().then((module) => module.ExportModal), {
  ssr: false,
})

export const CourseSettingsDrawer = dynamic(
  () => loadCourseSettingsDrawer().then((module) => module.CourseSettingsDrawer),
  { ssr: false }
)

export const ManageUnitsModal = dynamic(
  () => loadManageUnitsModal().then((module) => module.ManageUnitsModal),
  { ssr: false }
)

export const ContentBlockDrawer = dynamic(
  () => loadContentBlockDrawer().then((module) => module.ContentBlockDrawer),
  { ssr: false }
)

const IDLE_FALLBACK_DELAY = 1500

export function usePreloadEditorParts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const preload = () => {
      loadContentBlockDrawer()
      loadRichTextEditor()
      loadCourseSettingsDrawer()
      loadManageUnitsModal()
      loadExportModal()
    }

    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(preload)
      return () => window.cancelIdleCallback(handle)
    }

    const timeout = setTimeout(preload, IDLE_FALLBACK_DELAY)
    return () => clearTimeout(timeout)
  }, [enabled])
}

export function useMountAfterFirstOpen(open: boolean) {
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  return mounted || open
}
