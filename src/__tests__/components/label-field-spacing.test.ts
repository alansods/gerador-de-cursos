import fs from 'fs'
import path from 'path'

const ROOT = path.join(process.cwd(), 'src')
const DIRECTORIES = ['app', 'components']

function tsxFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((input) => {
    const complete = path.join(dir, input.name)
    if (input.isDirectory()) return tsxFiles(complete)
    return input.name.endsWith('.tsx') ? [complete] : []
  })
}

const files = DIRECTORIES.flatMap((d) => tsxFiles(path.join(ROOT, d)))

function occurrences(regex: RegExp, filter: (line: string) => boolean) {
  const findings: string[] = []
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      if (regex.test(line) && filter(line)) {
        findings.push(`${path.relative(process.cwd(), file)}:${i + 1} → ${line.trim()}`)
      }
    })
  }
  return findings
}

describe('label to field spacing', () => {
  it('no field <label> sets a margin of its own', () => {
    const findings = occurrences(/<label\b/, (line) => /\bmb-[0-9.]/.test(line))
    expect(findings).toEqual([])
  })

  it('no field <label> hardcodes a color instead of a semantic token', () => {
    const findings = occurrences(
      /<label\b/,
      (line) => /font-medium/.test(line) && /text-gray-/.test(line)
    )
    expect(findings).toEqual([])
  })

  it('FormField keeps the 8px gap between label and field', () => {
    const source = fs.readFileSync(path.join(ROOT, 'components/ui/form-field.tsx'), 'utf8')
    expect(source).toContain("'flex flex-col gap-2'")
  })
})
