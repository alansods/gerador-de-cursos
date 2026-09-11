import type { ReactNode } from 'react'
import { requirePermission } from '@/lib/page-guard'

export default async function UsersLayout({ children }: { children: ReactNode }) {
  await requirePermission('usuario:gerenciar')

  return <>{children}</>
}
