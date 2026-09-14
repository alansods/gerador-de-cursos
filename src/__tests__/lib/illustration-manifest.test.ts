import fs from 'fs'
import path from 'path'

interface ManifestItem {
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

interface Manifest {
  version: number
  themes: { id: string; title: string }[]
  categories: { id: string; theme: string; title: string }[]
  items: ManifestItem[]
}

const root = path.join(process.cwd(), 'public', 'illustrations')
const manifest: Manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'))

function listSvgs(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) return listSvgs(full)
    return entry.name.endsWith('.svg') ? [path.relative(root, full).split(path.sep).join('/')] : []
  })
}

const duplicates = (values: string[]) =>
  values.filter((value, index) => values.indexOf(value) !== index)

describe('illustration manifest', () => {
  it('has unique theme ids, and category ids unique inside each theme', () => {
    expect(duplicates(manifest.themes.map((theme) => theme.id))).toEqual([])
    expect(
      duplicates(manifest.categories.map((category) => `${category.theme}/${category.id}`))
    ).toEqual([])
    const themeIds = manifest.themes.map((theme) => theme.id)
    expect(manifest.categories.filter((category) => !themeIds.includes(category.theme))).toEqual([])
  })

  it('has unique item ids that reference declared themes and categories', () => {
    const categoryKeys = manifest.categories.map((category) => `${category.theme}/${category.id}`)

    expect(duplicates(manifest.items.map((item) => item.id))).toEqual([])
    expect(
      manifest.items
        .filter((item) => !categoryKeys.includes(`${item.theme}/${item.category}`))
        .map((item) => item.id)
    ).toEqual([])
  })

  it('points every item to an SVG inside its own theme and category folder', () => {
    const misplaced = manifest.items.filter(
      (item) =>
        !new RegExp(`^${item.theme}/${item.category}/[a-z0-9-]+\\.svg$`).test(item.file) ||
        !fs.existsSync(path.join(root, item.file))
    )

    expect(misplaced.map((item) => item.file)).toEqual([])
  })

  it('lists every SVG in the folder', () => {
    const listed = manifest.items.map((item) => item.file)

    expect(listSvgs(root).filter((file) => !listed.includes(file))).toEqual([])
  })

  it('fills the descriptive, size and origin fields of every item', () => {
    const incomplete = manifest.items.filter(
      (item) =>
        !item.title?.trim() ||
        !Array.isArray(item.tags) ||
        item.tags.length === 0 ||
        !(item.width > 0) ||
        !(item.height > 0) ||
        !item.set?.trim() ||
        !item.license?.trim() ||
        !item.author?.trim()
    )

    expect(incomplete.map((item) => item.id)).toEqual([])
  })

  it('ships the license text of every third-party set, used by the credits file', () => {
    const thirdPartySets = [...new Set(manifest.items.map((item) => item.set))].filter(
      (set) => set !== 'original'
    )

    expect(
      thirdPartySets.filter((set) => !fs.existsSync(path.join(root, 'licenses', `${set}.txt`)))
    ).toEqual([])
  })

  it('keeps every SVG free of scripts and event handlers', () => {
    const unsafe = listSvgs(root).filter((file) => {
      const source = fs.readFileSync(path.join(root, file), 'utf8').trim()
      return (
        !/^(<\?xml[^>]*>\s*)?<svg[\s>]/.test(source) ||
        /<script/i.test(source) ||
        /\son[a-z]+\s*=/i.test(source)
      )
    })

    expect(unsafe).toEqual([])
  })
})
