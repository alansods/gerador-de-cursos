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
import { ROTAS_PROTEGIDAS, regraDaRota, casaPrefixo } from '@/lib/rotas-protegidas'

const raizApp = path.join(process.cwd(), 'src', 'app')

// Route groups — `(app)` e afins — não aparecem na URL, então o prefixo da rota
// pode morar na raiz de `app/` ou dentro de qualquer um deles.
const raizesDeRota = [
  raizApp,
  ...fs
    .readdirSync(raizApp, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('('))
    .map((e) => path.join(raizApp, e.name)),
]

function acharLayout(prefixo: string) {
  return raizesDeRota
    .map((raiz) => path.join(raiz, prefixo, 'layout.tsx'))
    .find((caminho) => fs.existsSync(caminho))
}

describe('Rotas protegidas', () => {
  it('toda rota de página protegida tem layout.tsx chamando exigirPermissao com a ação certa', () => {
    for (const { prefixos, acao } of ROTAS_PROTEGIDAS) {
      for (const prefixo of prefixos.filter((p) => !p.startsWith('/api'))) {
        const layout = acharLayout(prefixo)

        expect({ prefixo, existe: layout !== undefined }).toEqual({ prefixo, existe: true })

        const conteudo = fs.readFileSync(layout!, 'utf-8')
        expect(conteudo).toContain('exigirPermissao')
        expect(conteudo).toContain(`'${acao}'`)
      }
    }
  })

  it('casaPrefixo aceita a rota exata e filhos, mas não prefixos parciais', () => {
    expect(casaPrefixo('/login', '/login')).toBe(true)
    expect(casaPrefixo('/scorm-preview/unidade/1', '/scorm-preview')).toBe(true)
    expect(casaPrefixo('/loginfalso', '/login')).toBe(false)
  })

  it('regraDaRota casa o prefixo exato e os filhos, não prefixos parciais', () => {
    expect(regraDaRota('/usuarios')?.acao).toBe('usuario:gerenciar')
    expect(regraDaRota('/usuarios/123')?.acao).toBe('usuario:gerenciar')
    expect(regraDaRota('/api/users')?.acao).toBe('usuario:gerenciar')

    expect(regraDaRota('/usuariospublicos')).toBeUndefined()
    expect(regraDaRota('/cursos')).toBeUndefined()
    expect(regraDaRota('/home')).toBeUndefined()
  })
})
