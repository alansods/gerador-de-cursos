export type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

const MAX_SLOTS = 7

export function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= MAX_SLOTS) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, index) => start + index)

  if (page <= 4) {
    return [...range(1, 5), 'ellipsis-end', totalPages]
  }

  if (page >= totalPages - 3) {
    return [1, 'ellipsis-start', ...range(totalPages - 4, totalPages)]
  }

  return [1, 'ellipsis-start', page - 1, page, page + 1, 'ellipsis-end', totalPages]
}
