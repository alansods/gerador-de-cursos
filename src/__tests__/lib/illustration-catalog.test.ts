import {
  filterIllustrations,
  illustrationPath,
  type IllustrationItem,
} from '@/lib/illustration-catalog'
import {
  ILLUSTRATION_CARD_COLOR,
  illustrationCardStyle,
  isIllustrationSource,
} from '@/lib/illustration-paths'

const item = (id: string, overrides: Partial<IllustrationItem>): IllustrationItem => ({
  id,
  title: id,
  theme: 'culinary',
  category: 'ingredients',
  file: `culinary/ingredients/${id}.svg`,
  tags: [],
  width: 64,
  height: 64,
  set: 'original',
  license: 'original',
  author: 'Gerador de Cursos',
  ...overrides,
})

const items = [
  item('lemon', { title: 'Limão', tags: ['fruta', 'cítrico'] }),
  item('whisk', { title: 'Fouet', category: 'utensils', tags: ['batedor', 'misturar creme'] }),
  item('hands', { title: 'Lavar as mãos', theme: 'food-safety', category: 'scenes' }),
  item('apple', { title: 'Maçã', tags: ['fruta'], set: 'fluent-emoji' }),
]

const ids = (list: IllustrationItem[]) => list.map((entry) => entry.id)

describe('filterIllustrations', () => {
  it('returns everything without filters', () => {
    expect(ids(filterIllustrations(items, {}))).toEqual(['lemon', 'whisk', 'hands', 'apple'])
  })

  it('filters by theme, category and set together', () => {
    expect(ids(filterIllustrations(items, { theme: 'food-safety' }))).toEqual(['hands'])
    expect(ids(filterIllustrations(items, { theme: 'culinary', category: 'utensils' }))).toEqual([
      'whisk',
    ])
    expect(ids(filterIllustrations(items, { set: 'fluent-emoji' }))).toEqual(['apple'])
  })

  it('searches title and tags ignoring case and accents, requiring every word', () => {
    expect(ids(filterIllustrations(items, { query: 'LIMAO' }))).toEqual(['lemon'])
    expect(ids(filterIllustrations(items, { query: 'fruta' }))).toEqual(['lemon', 'apple'])
    expect(ids(filterIllustrations(items, { query: 'maos lavar' }))).toEqual(['hands'])
    expect(ids(filterIllustrations(items, { query: 'fruta citrico' }))).toEqual(['lemon'])
    expect(ids(filterIllustrations(items, { query: 'fruta', set: 'original' }))).toEqual(['lemon'])
    expect(filterIllustrations(items, { query: 'parafuso' })).toEqual([])
  })

  it('builds the public path of an item', () => {
    expect(illustrationPath(items[0])).toBe('/illustrations/culinary/ingredients/lemon.svg')
  })
})

describe('isIllustrationSource', () => {
  it('recognizes library paths and their packaged copies only', () => {
    expect(isIllustrationSource('/illustrations/culinary/ingredients/lemon.svg')).toBe(true)
    expect(isIllustrationSource('images/illustration-culinary-ingredients-lemon.svg')).toBe(true)
    expect(isIllustrationSource('images/midia-1-abc.png')).toBe(false)
    expect(isIllustrationSource('https://blob.vercel-storage.com/foto.png')).toBe(false)
    expect(isIllustrationSource(undefined)).toBe(false)
  })

  it('gives the cream card style only to illustrations', () => {
    expect(illustrationCardStyle('/illustrations/culinary/ingredients/lemon.svg')).toEqual({
      backgroundColor: ILLUSTRATION_CARD_COLOR,
    })
    expect(illustrationCardStyle('https://x.com/a.png')).toBeUndefined()
  })
})
