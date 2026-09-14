import * as fs from 'fs/promises'
import * as path from 'path'
import type { IllustrationItem, IllustrationManifest } from './illustration-catalog'
import { isLibraryIllustrationPath } from './illustration-paths'

export type { IllustrationItem, IllustrationManifest } from './illustration-catalog'

export { isLibraryIllustrationPath, libraryPackageFileName } from './illustration-paths'

export const ORIGINAL_SET = 'original'

export const CREDITS_FILE_NAME = 'illustration-credits.txt'

export function libraryRoot(): string {
  return path.join(process.cwd(), 'public', 'illustrations')
}

export async function readIllustrationManifest(
  root = libraryRoot()
): Promise<IllustrationManifest> {
  return JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'))
}

export function findLibraryItem(
  manifest: IllustrationManifest,
  libraryPath: string
): IllustrationItem | undefined {
  if (!isLibraryIllustrationPath(libraryPath)) return undefined
  const file = libraryPath.replace(/^\/illustrations\//, '')
  return manifest.items.find((item) => item.file === file)
}

export function buildIllustrationCredits(
  items: IllustrationItem[],
  licenseTexts: Record<string, string> = {}
): string | null {
  const thirdParty = items.filter((item) => item.set !== ORIGINAL_SET)
  if (thirdParty.length === 0) return null

  const bySet = new Map<string, IllustrationItem[]>()
  thirdParty.forEach((item) => {
    const group = bySet.get(item.set) ?? []
    if (!group.some((entry) => entry.id === item.id)) group.push(item)
    bySet.set(item.set, group)
  })

  const sections = [...bySet.entries()].map(([set, group]) => {
    const first = group[0]
    const lines = [
      `Acervo: ${set}`,
      `Licença: ${first.license}`,
      `Autor: ${first.author}`,
      ...(first.source ? [`Fonte: ${first.source}`] : []),
      `Ilustrações usadas: ${group.map((item) => item.title).join(', ')}`,
    ]
    const licenseText = licenseTexts[set]?.trim()
    return licenseText ? `${lines.join('\n')}\n\n${licenseText}` : lines.join('\n')
  })

  return `Créditos das ilustrações\n\n${sections.join('\n\n----------------------------------------\n\n')}\n`
}

export async function readLicenseTexts(
  sets: string[],
  root = libraryRoot()
): Promise<Record<string, string>> {
  const texts: Record<string, string> = {}
  for (const set of new Set(sets)) {
    if (set === ORIGINAL_SET || !/^[a-z0-9-]+$/.test(set)) continue
    const text = await fs
      .readFile(path.join(root, 'licenses', `${set}.txt`), 'utf8')
      .catch(() => null)
    if (text !== null) texts[set] = text
  }
  return texts
}
