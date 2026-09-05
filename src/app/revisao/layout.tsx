import type { ReactNode } from 'react'
import { exigirPermissao } from '@/lib/page-guard'

export default async function RevisaoLayout({ children }: { children: ReactNode }) {
  await exigirPermissao('revisao:ver')

  return <>{children}</>
}
