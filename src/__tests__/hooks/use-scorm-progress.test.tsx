import { act, renderHook } from '@testing-library/react'
import type { Block, Course, Unit } from '@/types/course'
import { useScormProgress } from '@/hooks/useScormProgress'
import { encodeSuspendData, hashCourse } from '@/lib/scorm-progress'

interface FakeScorm {
  suspendData: string
  status: string
  score: number | null
  statusCalls: string[]
  getSuspendData: () => string
  setSuspendData: (v: string) => boolean
  getStatus: () => string
  setStatus: (v: string) => boolean
  setScore: (n: number) => boolean
  setExit: (v: string) => boolean
  getLocation: () => string
  setLocation: (v: string) => boolean
  save: () => boolean
}

const createScorm = (suspendData = ''): FakeScorm => {
  const scorm: FakeScorm = {
    suspendData,
    status: 'not attempted',
    score: null,
    statusCalls: [],
    getSuspendData: () => scorm.suspendData,
    setSuspendData: (v) => {
      scorm.suspendData = v
      return true
    },
    getStatus: () => scorm.status,
    setStatus: (v) => {
      scorm.status = v
      scorm.statusCalls.push(v)
      return true
    },
    setScore: (n) => {
      scorm.score = n
      return true
    },
    setExit: () => true,
    getLocation: () => '',
    setLocation: () => true,
    save: () => true,
  }
  return scorm
}

const block = (type: Block['type'], content = ''): Block => ({
  id: `${type}-${content}`,
  type,
  content,
  order: 0,
})

const unit = (id: string, blocks: Block[]): Unit => ({
  id,
  title: id,
  description: '',
  blocks,
  order: 0,
})

const makeCourse = (layout: string): Course =>
  ({
    id: 'course-1',
    title: 'Curso',
    description: '',
    workload: '',
    modality: '',
    category: '',
    layout,
    units: [
      unit('u1', [block('heading', 'Etapa 1'), block('quiz'), block('heading', 'Etapa 2')]),
      unit('u2', [block('paragraph')]),
    ],
  }) as Course

const install = (scorm: FakeScorm) => {
  ;(window as unknown as { SCORM?: FakeScorm }).SCORM = scorm
}

afterEach(() => {
  delete (window as unknown as { SCORM?: FakeScorm }).SCORM
})

describe('useScormProgress', () => {
  it('keeps completing classic courses when every unit is visited', () => {
    const scorm = createScorm()
    install(scorm)
    const { result } = renderHook(({ course }) => useScormProgress(course), {
      initialProps: { course: makeCourse('classic') },
    })

    act(() => result.current.navigate('u1'))
    act(() => result.current.navigate('u2'))

    expect(scorm.status).toBe('completed')
    expect(result.current.progress.completed).toBe(true)
  })

  it('does not complete a trail course by visits alone', () => {
    const scorm = createScorm()
    install(scorm)
    const { result } = renderHook(({ course }) => useScormProgress(course), {
      initialProps: { course: makeCourse('trail') },
    })

    act(() => result.current.navigate('u1'))
    act(() => result.current.navigate('u2'))

    expect(scorm.status).toBe('incomplete')
    expect(result.current.progress).toEqual({
      visited: 0,
      total: 3,
      percentage: 0,
      completed: false,
    })
  })

  it('completes a trail course only after the last step', () => {
    const scorm = createScorm()
    install(scorm)
    const { result } = renderHook(({ course }) => useScormProgress(course), {
      initialProps: { course: makeCourse('trail') },
    })

    act(() => result.current.completeStep('u1', 0))
    act(() => result.current.completeStep('u1', 1))
    expect(scorm.status).toBe('incomplete')

    act(() => result.current.completeStep('u2', 0))
    expect(scorm.status).toBe('completed')
    expect(scorm.statusCalls.filter((s) => s === 'completed')).toHaveLength(1)
  })

  it('ignores unknown units and repeated steps', () => {
    const scorm = createScorm()
    install(scorm)
    const { result } = renderHook(({ course }) => useScormProgress(course), {
      initialProps: { course: makeCourse('trail') },
    })

    act(() => result.current.completeStep('missing', 0))
    act(() => result.current.completeStep('u1', 0))
    const saved = scorm.suspendData
    act(() => result.current.completeStep('u1', 0))

    expect(scorm.suspendData).toBe(saved)
    expect(result.current.state.steps).toEqual([[true]])
  })

  it('scores the last attempt and keeps the first-attempt flag from the first one', () => {
    const scorm = createScorm()
    install(scorm)
    const { result } = renderHook(({ course }) => useScormProgress(course), {
      initialProps: { course: makeCourse('trail') },
    })

    act(() => result.current.recordQuiz('u1', 1, 1, 2))
    act(() => result.current.recordQuiz('u1', 1, 2, 2))

    expect(scorm.score).toBe(100)
    expect(result.current.state.quizzes['0-1']).toEqual({ correct: 2, total: 2 })
    expect(scorm.suspendData).toContain('0-1:2/2')
    expect(scorm.suspendData).not.toContain('0-1:2/2!')
  })

  it('stores the first-attempt flag decided by the block', () => {
    const scorm = createScorm()
    install(scorm)
    const { result } = renderHook(({ course }) => useScormProgress(course), {
      initialProps: { course: makeCourse('trail') },
    })

    act(() => result.current.recordQuiz('u1', 1, 3, 3, false))

    expect(result.current.state.quizzes['0-1']).toEqual({ correct: 3, total: 3 })
    expect(scorm.suspendData).not.toContain('0-1:3/3!')
  })

  it('stores a completed practice mission without touching the score or completion', () => {
    const scorm = createScorm()
    install(scorm)
    const { result } = renderHook(({ course }) => useScormProgress(course), {
      initialProps: { course: makeCourse('trail') },
    })

    act(() => result.current.completePractice('missing', 2))
    expect(result.current.isPracticeCompleted('u1', 2)).toBe(false)

    act(() => result.current.completePractice('u1', 2))
    const saved = scorm.suspendData
    act(() => result.current.completePractice('u1', 2))

    expect(result.current.isPracticeCompleted('u1', 2)).toBe(true)
    expect(result.current.isPracticeCompleted('u2', 2)).toBe(false)
    expect(scorm.suspendData).toBe(saved)
    expect(saved.endsWith('|0-2')).toBe(true)
    expect(scorm.score).toBeNull()
    expect(result.current.progress.completed).toBe(false)
  })

  it('resumes steps from suspend_data and does not report completion twice', () => {
    const course = makeCourse('trail')
    const hash = hashCourse({ id: course.id, units: course.units })
    const saved = encodeSuspendData(
      { visited: [true, true], quizzes: {}, steps: [[true, true], [true]] },
      hash
    )
    const scorm = createScorm(saved)
    scorm.status = 'completed'
    install(scorm)

    const { result } = renderHook(({ c }) => useScormProgress(c), { initialProps: { c: course } })

    expect(result.current.state.steps).toEqual([[true, true], [true]])
    expect(result.current.progress.completed).toBe(true)

    act(() => result.current.recordQuiz('u1', 1, 2, 2))
    expect(scorm.statusCalls).not.toContain('completed')
  })
})
