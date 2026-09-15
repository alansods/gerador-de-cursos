import { getPageItems } from '@/lib/pagination'

describe('getPageItems', () => {
  it('lists every page when they fit in seven slots', () => {
    expect(getPageItems(1, 1)).toEqual([1])
    expect(getPageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('returns nothing when there are no pages', () => {
    expect(getPageItems(1, 0)).toEqual([])
  })

  it('collapses the end while the current page is near the start', () => {
    expect(getPageItems(1, 12)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 12])
    expect(getPageItems(4, 12)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 12])
  })

  it('collapses the start while the current page is near the end', () => {
    expect(getPageItems(12, 12)).toEqual([1, 'ellipsis-start', 8, 9, 10, 11, 12])
    expect(getPageItems(9, 12)).toEqual([1, 'ellipsis-start', 8, 9, 10, 11, 12])
  })

  it('keeps one neighbour on each side in the middle', () => {
    expect(getPageItems(5, 12)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 12])
    expect(getPageItems(8, 12)).toEqual([1, 'ellipsis-start', 7, 8, 9, 'ellipsis-end', 12])
  })

  it('always uses seven slots once pages overflow', () => {
    for (let page = 1; page <= 30; page++) {
      expect(getPageItems(page, 30)).toHaveLength(7)
    }
  })
})
