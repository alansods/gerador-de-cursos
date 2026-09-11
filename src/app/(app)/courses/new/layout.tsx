import type { ReactNode } from 'react'
import { requirePermission } from '@/lib/page-guard'

export default async function NewCourseLayout({ children }: { children: ReactNode }) {
  await requirePermission('course:create')

  return <>{children}</>
}
