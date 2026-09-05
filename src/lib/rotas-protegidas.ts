import type { Acao } from '@/lib/permissions'

export interface RotaProtegida {
  prefixos: string[]
  acao: Acao
}

export const ROTAS_PROTEGIDAS: RotaProtegida[] = [
  { prefixos: ['/usuarios', '/api/users'], acao: 'usuario:gerenciar' },
  { prefixos: ['/revisao'], acao: 'revisao:ver' },
]

/**
 * Casa o prefixo exato ou um filho dele. Comparar com `startsWith` cru faria
 * `/usuariospublicos` cair na regra de `/usuarios`.
 */
export function casaPrefixo(pathname: string, prefixo: string): boolean {
  return pathname === prefixo || pathname.startsWith(`${prefixo}/`)
}

export function regraDaRota(pathname: string): RotaProtegida | undefined {
  return ROTAS_PROTEGIDAS.find(({ prefixos }) =>
    prefixos.some((prefixo) => casaPrefixo(pathname, prefixo))
  )
}
