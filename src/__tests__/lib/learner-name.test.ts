import { learnerFirstName } from '@/lib/learner-name'

describe('learnerFirstName', () => {
  it('reads the LMS "Last, First" format', () => {
    expect(learnerFirstName('Santos, Alan')).toBe('Alan')
    expect(learnerFirstName('Santos, Alan Pedro')).toBe('Alan')
  })

  it('takes the first word of a full name', () => {
    expect(learnerFirstName('Alan Santos')).toBe('Alan')
    expect(learnerFirstName('  Alan   Santos ')).toBe('Alan')
  })

  it('returns an empty string when there is no name', () => {
    expect(learnerFirstName('')).toBe('')
    expect(learnerFirstName('   ')).toBe('')
    expect(learnerFirstName(null)).toBe('')
    expect(learnerFirstName(undefined)).toBe('')
    expect(learnerFirstName('Santos,')).toBe('')
  })
})
