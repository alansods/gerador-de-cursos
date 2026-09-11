/**
 * @jest-environment node
 */
/**
 * Guarda estrutural: o middleware roda no edge e só enxerga o papel do token,
 * que vive 24h. A trava autoritativa é o `layout.tsx` de cada rota de página,
 * que relê o papel do banco. Este teste falha se alguém adicionar uma rota
 * protegida sem esse layout — o modo de falha seria silencioso em produção.
 */

import fs from 'fs'
import path from 'path'
import { PROTECTED_ROUTES, routeRule, matchesPrefix } from '@/lib/protected-routes'

const appRoot = path.join(process.cwd(), 'src', 'app')

// Route groups — `(app)` e afins — não aparecem na URL, então o prefixo da rota
// pode morar na raiz de `app/` ou dentro de qualquer um deles.
const routeRoots = [
  appRoot,
  ...fs
    .readdirSync(appRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('('))
    .map((e) => path.join(appRoot, e.name)),
]

function acharLayout(prefix: string) {
  return routeRoots
    .map((root) => path.join(root, prefix, 'layout.tsx'))
    .find((filePath) => fs.existsSync(filePath))
}

describe('Rotas protegidas', () => {
  it('toda rota de página protegida tem layout.tsx chamando exigirPermissao com a ação certa', () => {
    for (const { prefixes, action } of PROTECTED_ROUTES) {
      for (const prefix of prefixes.filter((p) => !p.startsWith('/api'))) {
        const layout = acharLayout(prefix)

        expect({ prefixo: prefix, existe: layout !== undefined }).toEqual({
          prefixo: prefix,
          existe: true,
        })

        const content = fs.readFileSync(layout!, 'utf-8')
        expect(content).toContain('requirePermission')
        expect(content).toContain(`'${action}'`)
      }
    }
  })

  it('casaPrefixo aceita a rota exata e filhos, mas não prefixos parciais', () => {
    expect(matchesPrefix('/login', '/login')).toBe(true)
    expect(matchesPrefix('/scorm-preview/unidade/1', '/scorm-preview')).toBe(true)
    expect(matchesPrefix('/loginfalso', '/login')).toBe(false)
  })

  it('regraDaRota casa o prefixo exato e os filhos, não prefixos parciais', () => {
    expect(routeRule('/users')?.action).toBe('user:manage')
    expect(routeRule('/users/123')?.action).toBe('user:manage')
    expect(routeRule('/api/users')?.action).toBe('user:manage')

    expect(routeRule('/usuariospublicos')).toBeUndefined()
    expect(routeRule('/courses')).toBeUndefined()
    expect(routeRule('/home')).toBeUndefined()
  })
})
