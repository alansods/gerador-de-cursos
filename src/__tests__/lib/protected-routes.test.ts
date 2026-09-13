/**
 * @jest-environment node
 */
/**
 * Structural guard: the middleware runs on the edge and only sees the token role,
 * which lives for 24h. The authoritative lock is the `layout.tsx` of each page route,
 * which re-reads the role from the database. This test fails if someone adds a
 * protected route without that layout — the failure would be silent in production.
 */

import fs from 'fs'
import path from 'path'
import { PROTECTED_ROUTES, routeRule, matchesPrefix } from '@/lib/protected-routes'

const appRoot = path.join(process.cwd(), 'src', 'app')

// Route groups — `(app)` and friends — never show up in the URL, so the route prefix
// may live at the root of `app/` or inside any of them.
const routeRoots = [
  appRoot,
  ...fs
    .readdirSync(appRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('('))
    .map((e) => path.join(appRoot, e.name)),
]

function findLayout(prefix: string) {
  return routeRoots
    .map((root) => path.join(root, prefix, 'layout.tsx'))
    .find((filePath) => fs.existsSync(filePath))
}

describe('protected routes', () => {
  it('gives every protected page route a layout.tsx calling requirePermission with the right action', () => {
    for (const { prefixes, action } of PROTECTED_ROUTES) {
      for (const prefix of prefixes.filter((p) => !p.startsWith('/api'))) {
        const layout = findLayout(prefix)

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

  it('matchesPrefix accepts the exact route and its children, but not partial prefixes', () => {
    expect(matchesPrefix('/login', '/login')).toBe(true)
    expect(matchesPrefix('/scorm-preview/unidade/1', '/scorm-preview')).toBe(true)
    expect(matchesPrefix('/loginfalso', '/login')).toBe(false)
  })

  it('routeRule matches the exact prefix and its children, not partial prefixes', () => {
    expect(routeRule('/users')?.action).toBe('user:manage')
    expect(routeRule('/users/123')?.action).toBe('user:manage')
    expect(routeRule('/api/users')?.action).toBe('user:manage')

    expect(routeRule('/usuariospublicos')).toBeUndefined()
    expect(routeRule('/courses')).toBeUndefined()
    expect(routeRule('/home')).toBeUndefined()
  })
})
