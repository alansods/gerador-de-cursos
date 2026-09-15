import {
  buildCourseListQuery,
  DEFAULT_PAGE_SIZE,
  normalizePage,
  normalizePageSize,
  parseCourseListParams,
} from '@/lib/course-list-params'

const parse = (query: string) => parseCourseListParams(new URLSearchParams(query))

describe('course list params', () => {
  it('falls back to the defaults on an empty query', () => {
    expect(parse('')).toEqual({
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      search: '',
      category: undefined,
      modality: undefined,
      status: undefined,
    })
  })

  it('reads every valid parameter', () => {
    expect(
      parse('page=3&perPage=50&search=react&category=Tecnologia&modality=Online&status=IN_REVIEW')
    ).toEqual({
      page: 3,
      perPage: 50,
      search: 'react',
      category: 'Tecnologia',
      modality: 'Online',
      status: 'IN_REVIEW',
    })
  })

  it('discards values that are not allowed', () => {
    expect(parse('page=-2&perPage=10000&category=Hacker&modality=x&status=todos')).toEqual({
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      search: '',
      category: undefined,
      modality: undefined,
      status: undefined,
    })
  })

  it('omits the defaults when building the query', () => {
    expect(buildCourseListQuery(parse(''))).toBe('')
    expect(buildCourseListQuery({ ...parse(''), page: 2, status: 'APPROVED' })).toBe(
      'page=2&status=APPROVED'
    )
  })

  it('round-trips a full query', () => {
    const query = 'page=3&perPage=100&search=js+b%C3%A1sico&category=Gest%C3%A3o&status=REJECTED'
    expect(parse(buildCourseListQuery(parse(query)))).toEqual(parse(query))
  })

  it('normalizes page and page size coming from the client', () => {
    expect(normalizePage(2.5)).toBe(1)
    expect(normalizePage('4')).toBe(4)
    expect(normalizePageSize(100)).toBe(100)
    expect(normalizePageSize(7)).toBe(DEFAULT_PAGE_SIZE)
  })
})
