import type { ReactNode } from 'react'
import { exigirPermissao } from '@/lib/page-guard'

export default async function UsuariosLayout({ children }: { children: ReactNode }) {
  await exigirPermissao('usuario:gerenciar')

  return <>{children}</>
}
