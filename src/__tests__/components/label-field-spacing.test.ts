import fs from 'fs'
import path from 'path'

const RAIZ = path.join(process.cwd(), 'src')
const DIRETORIOS = ['app', 'components']

function arquivosTsx(dir: string): string[] {
  const entradas = fs.readdirSync(dir, { withFileTypes: true })
  return entradas.flatMap((entrada) => {
    const completo = path.join(dir, entrada.name)
    if (entrada.isDirectory()) return arquivosTsx(completo)
    return entrada.name.endsWith('.tsx') ? [completo] : []
  })
}

const arquivos = DIRETORIOS.flatMap((d) => arquivosTsx(path.join(RAIZ, d)))

function ocorrencias(regex: RegExp, filtro: (linha: string) => boolean) {
  const achados: string[] = []
  for (const arquivo of arquivos) {
    const linhas = fs.readFileSync(arquivo, 'utf8').split('\n')
    linhas.forEach((linha, i) => {
      if (regex.test(linha) && filtro(linha)) {
        achados.push(`${path.relative(process.cwd(), arquivo)}:${i + 1} → ${linha.trim()}`)
      }
    })
  }
  return achados
}

describe('espaçamento entre label e campo', () => {
  it('nenhum <label> de campo define margem própria', () => {
    const achados = ocorrencias(/<label\b/, (linha) => /\bmb-[0-9.]/.test(linha))
    expect(achados).toEqual([])
  })

  it('nenhum <label> de campo usa cor hardcoded em vez de token semântico', () => {
    const achados = ocorrencias(
      /<label\b/,
      (linha) => /font-medium/.test(linha) && /text-gray-/.test(linha)
    )
    expect(achados).toEqual([])
  })

  it('FormField mantém o gap de 8px entre label e campo', () => {
    const fonte = fs.readFileSync(path.join(RAIZ, 'components/ui/form-field.tsx'), 'utf8')
    expect(fonte).toContain("'flex flex-col gap-2'")
  })
})
