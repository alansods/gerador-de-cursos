export interface IllustrationItem {
  id: string
  title: string
  theme: string
  category: string
  file: string
  tags: string[]
  width: number
  height: number
  set: string
  license: string
  author: string
  source?: string
}

export interface IllustrationManifest {
  version: number
  themes: { id: string; title: string }[]
  categories: { id: string; theme: string; title: string }[]
  items: IllustrationItem[]
}

export interface IllustrationFilters {
  theme?: string
  category?: string
  set?: string
  query?: string
}

export const ILLUSTRATIONS_MANIFEST_URL = '/illustrations/manifest.json'

export function illustrationPath(item: Pick<IllustrationItem, 'file'>): string {
  return `/illustrations/${item.file}`
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function filterIllustrations(
  items: IllustrationItem[],
  { theme, category, set, query }: IllustrationFilters
): IllustrationItem[] {
  const words = normalize(query ?? '')
    .split(/\s+/)
    .filter(Boolean)

  return items.filter((item) => {
    if (theme && item.theme !== theme) return false
    if (category && item.category !== category) return false
    if (set && item.set !== set) return false
    if (words.length === 0) return true
    const haystack = [item.title, ...item.tags].map(normalize).join(' ')
    return words.every((word) => haystack.includes(word))
  })
}
