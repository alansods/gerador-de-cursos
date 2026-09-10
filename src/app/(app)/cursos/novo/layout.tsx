import type { ReactNode } from 'react'
import { exigirPermissao } from '@/lib/page-guard'

export default async function NovoCursoLayout({ children }: { children: ReactNode }) {
  await exigirPermissao('curso:criar')

  return <>{children}</>
}
