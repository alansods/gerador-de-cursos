import type { Action } from '@/lib/permissions'

export interface ProtectedRoute {
  prefixes: string[]
  action: Action
}

export const PROTECTED_ROUTES: ProtectedRoute[] = [
  { prefixes: ['/users', '/api/users'], action: 'user:manage' },
]

/**
 * Casa o prefixo exato ou um filho dele. Comparar com `startsWith` cru faria
 * `/usuariospublicos` cair na regra de `/usuarios`.
 */
export function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function routeRule(pathname: string): ProtectedRoute | undefined {
  return PROTECTED_ROUTES.find(({ prefixes }) =>
    prefixes.some((prefix) => matchesPrefix(pathname, prefix))
  )
}
