import type { Block, Unit } from '@/types/course'
import { completeStep, createEmptyState, quizKey, type ProgressState } from '@/lib/scorm-progress'
import {
  BADGE_ICONS,
  TRAIL_LEVELS,
  courseXp,
  deriveSteps,
  isScoredBlock,
  isStepAnswered,
  isStepCompleted,
  isUnitCompleted,
  maxCourseXp,
  reviewTrailSteps,
  MAX_RECOMMENDED_STEPS,
  trailCompletionRule,
  trailLevel,
  unitBadge,
  unitStars,
  unitXp,
} from '@/lib/trail-progress'

const block = (type: Block['type'], content = ''): Block => ({
  id: `${type}-${Math.random().toString(36).slice(2)}`,
  type,
  content,
  order: 0,
})

const unit = (title: string, blocks: Block[], extra: Partial<Unit> = {}): Unit => ({
  id: title,
  title,
  description: '',
  blocks,
  order: 0,
  ...extra,
})

const withResult = (
  state: ProgressState,
  unitIndex: number,
  blockIndex: number,
  firstTry: boolean
): ProgressState => ({
  ...state,
  quizzes: {
    ...state.quizzes,
    [quizKey(unitIndex, blockIndex)]: firstTry
      ? { correct: 2, total: 2, firstTry: true }
      : { correct: 1, total: 2 },
  },
})

describe('deriveSteps', () => {
  it('starts a step at each heading and keeps the original block indices', () => {
    const u = unit('Boas práticas', [
      block('heading', 'O que são'),
      block('paragraph'),
      block('quiz'),
      block('heading', 'Contaminação'),
      block('categorization'),
    ])

    expect(deriveSteps(u)).toEqual([
      { title: 'O que são', blockIndices: [0, 1, 2] },
      { title: 'Contaminação', blockIndices: [3, 4] },
    ])
  })

  it('groups blocks before the first heading into a step named after the unit', () => {
    const u = unit('Utensílios', [block('paragraph'), block('heading', 'Fouet'), block('image')])

    expect(deriveSteps(u)).toEqual([
      { title: 'Utensílios', blockIndices: [0] },
      { title: 'Fouet', blockIndices: [1, 2] },
    ])
  })

  it('turns a unit with no heading into a single step', () => {
    expect(deriveSteps(unit('Boas-vindas', [block('paragraph'), block('list')]))).toEqual([
      { title: 'Boas-vindas', blockIndices: [0, 1] },
    ])
    expect(deriveSteps(unit('Vazia', []))).toEqual([{ title: 'Vazia', blockIndices: [] }])
  })

  it('falls back to the unit title for an empty heading', () => {
    expect(deriveSteps(unit('Receitas', [block('heading', '   ')]))[0].title).toBe('Receitas')
  })
})

describe('isScoredBlock', () => {
  it('follows the avaliativo catalog category', () => {
    expect(isScoredBlock(block('quiz'))).toBe(true)
    expect(isScoredBlock(block('matching'))).toBe(true)
    expect(isScoredBlock(block('categorization'))).toBe(true)
    expect(isScoredBlock(block('interactive-video'))).toBe(true)
    expect(isScoredBlock(block('flipcard'))).toBe(false)
    expect(isScoredBlock(block('interactive-image'))).toBe(false)
    expect(isScoredBlock(block('paragraph'))).toBe(false)
  })
})

describe('step state', () => {
  const u = unit('BPF', [
    block('heading', 'Etapa 1'),
    block('quiz'),
    block('flipcard'),
    block('matching'),
    block('heading', 'Etapa 2'),
    block('paragraph'),
  ])
  const [first, second] = deriveSteps(u)

  it('is answered only when every scored block has a result, right or wrong', () => {
    const one = withResult(createEmptyState(1), 0, 1, true)
    const both = withResult(one, 0, 3, false)

    expect(isStepAnswered(one, u, 0, first)).toBe(false)
    expect(isStepAnswered(both, u, 0, first)).toBe(true)
  })

  it('treats a step with no scored block as answered', () => {
    expect(isStepAnswered(createEmptyState(1), u, 0, second)).toBe(true)
  })

  it('tracks completed steps and units', () => {
    const state = completeStep(createEmptyState(1), 0, 0)

    expect(isStepCompleted(state, 0, 0)).toBe(true)
    expect(isStepCompleted(state, 0, 1)).toBe(false)
    expect(isUnitCompleted(state, u, 0)).toBe(false)
    expect(isUnitCompleted(completeStep(state, 0, 1), u, 0)).toBe(true)
  })

  it('builds the completion rule from derived step counts', () => {
    expect(trailCompletionRule({ units: [u, unit('Sem título', [block('paragraph')])] })).toEqual({
      kind: 'steps',
      stepCounts: [2, 1],
    })
  })
})

describe('XP', () => {
  const units = [
    unit('A', [block('heading', '1'), block('quiz'), block('heading', '2'), block('matching')]),
    unit('B', [block('paragraph'), block('categorization')]),
  ]
  const course = { units }

  it('gives 20 for a first-attempt 100%, 10 otherwise, and 10 per completed step', () => {
    let state = createEmptyState(2)
    state = withResult(state, 0, 1, true)
    state = withResult(state, 0, 3, false)
    state = completeStep(state, 0, 0)

    expect(unitXp(state, units[0], 0)).toBe(20 + 10 + 10)
    expect(courseXp(state, course)).toBe(40)
  })

  it('computes the course maximum from steps and scored blocks', () => {
    expect(maxCourseXp(course)).toBe(3 * 10 + 3 * 20)
  })

  it('ignores results of blocks that are not scored', () => {
    const state = withResult(createEmptyState(2), 1, 0, true)

    expect(courseXp(state, course)).toBe(0)
  })
})

describe('trailLevel', () => {
  it('uses percentages of the course maximum', () => {
    expect(trailLevel(0, 100)).toEqual({ number: 1, name: 'Iniciante', nextAt: 20 })
    expect(trailLevel(19, 100).number).toBe(1)
    expect(trailLevel(20, 100)).toEqual({ number: 2, name: 'Aprendiz', nextAt: 40 })
    expect(trailLevel(79, 100).number).toBe(4)
    expect(trailLevel(80, 100)).toEqual({ number: 5, name: 'Mestre', nextAt: null })
  })

  it('scales with course size', () => {
    expect(trailLevel(400, 2000).number).toBe(2)
    expect(trailLevel(30, 150).number).toBe(2)
    expect(trailLevel(1600, 2000).number).toBe(5)
  })

  it('rounds the next threshold up', () => {
    expect(trailLevel(0, 90).nextAt).toBe(18)
    expect(trailLevel(0, 95).nextAt).toBe(19)
  })

  it('stays at the first level when the course has no XP', () => {
    expect(trailLevel(0, 0)).toEqual({ number: 1, name: TRAIL_LEVELS[0].name, nextAt: null })
  })
})

describe('unitStars', () => {
  const scoredUnit = (count: number) =>
    unit(
      'U',
      Array.from({ length: count }, () => block('quiz'))
    )

  const withFirsts = (count: number, firsts: number) => {
    let state = createEmptyState(1)
    for (let i = 0; i < count; i++) state = withResult(state, 0, i, i < firsts)
    return state
  }

  it('gives 3 stars at 90% or more first-attempt activities', () => {
    expect(unitStars(withFirsts(10, 9), scoredUnit(10), 0)).toBe(3)
  })

  it('gives 2 stars from 60%', () => {
    expect(unitStars(withFirsts(10, 8), scoredUnit(10), 0)).toBe(2)
    expect(unitStars(withFirsts(10, 6), scoredUnit(10), 0)).toBe(2)
  })

  it('gives 1 star below 60%', () => {
    expect(unitStars(withFirsts(10, 5), scoredUnit(10), 0)).toBe(1)
    expect(unitStars(createEmptyState(1), scoredUnit(3), 0)).toBe(1)
  })

  it('gives 3 stars to a unit with no scored activity', () => {
    expect(unitStars(createEmptyState(1), unit('U', [block('paragraph')]), 0)).toBe(3)
  })
})

describe('unitBadge', () => {
  it('uses the author values when present', () => {
    expect(unitBadge(unit('U', [], { badgeName: ' Mãos limpas ', badgeIcon: 'flame' }), 0)).toEqual(
      {
        name: 'Mãos limpas',
        icon: 'flame',
      }
    )
  })

  it('falls back to a positional icon and a generic name', () => {
    expect(unitBadge(unit('U', []), 2)).toEqual({
      name: 'Unidade 3 concluída',
      icon: BADGE_ICONS[2],
    })
    expect(unitBadge(unit('U', []), BADGE_ICONS.length).icon).toBe(BADGE_ICONS[0])
  })

  it('ignores an icon outside the curated list', () => {
    expect(unitBadge(unit('U', [], { badgeIcon: 'skull' }), 1).icon).toBe(BADGE_ICONS[1])
  })
})

describe('reviewTrailSteps', () => {
  it('counts steps and lists the ones without a scored activity', () => {
    const u = unit('BPF', [
      block('heading', 'Introdução'),
      block('paragraph'),
      block('heading', 'Contaminação'),
      block('categorization'),
    ])

    const review = reviewTrailSteps(u)

    expect(review.stepCount).toBe(2)
    expect(review.stepsWithoutScored.map((step) => step.title)).toEqual(['Introdução'])
    expect(review.tooManySteps).toBe(false)
  })

  it('flags units with more steps than recommended', () => {
    const blocks = Array.from({ length: MAX_RECOMMENDED_STEPS + 1 }, (_, i) => [
      block('heading', `Etapa ${i + 1}`),
      block('quiz'),
    ]).flat()

    expect(reviewTrailSteps(unit('Longa', blocks)).tooManySteps).toBe(true)
    expect(reviewTrailSteps(unit('Longa', blocks.slice(0, -2))).tooManySteps).toBe(false)
  })
})
