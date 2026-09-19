import { courseOutline, parseProgress, progressSummary } from '@/lib/tutor/learner-context'
import type { Block, Unit } from '@/types/course'

function unit(title: string, order: number, blocks: Partial<Block>[] = []): Unit {
  return {
    id: `u${order}`,
    title,
    description: '',
    order,
    blocks: blocks.map((block, index) => ({ id: `b${index}`, order: index, ...block }) as Block),
  }
}

const units = [
  unit('Riscos', 2),
  unit('Introdução', 0),
  unit('EPI', 1, [{ type: 'quiz' }, { type: 'true-false' }, { type: 'paragraph' }]),
]

describe('parseProgress', () => {
  it('accepts one percentage per unit and a score', () => {
    expect(parseProgress({ units: [100, 50, 0], score: 70 }, 3)).toEqual({
      units: [100, 50, 0],
      score: 70,
    })
    expect(parseProgress({ units: [0, 0, 0] }, 3)).toEqual({ units: [0, 0, 0], score: null })
  })

  it.each([
    ['missing', undefined],
    ['not an object', 'tudo'],
    ['fewer units than the course (edited after export)', { units: [100, 0], score: null }],
    ['more units than the course', { units: [100, 0, 0, 0], score: null }],
    ['a value above 100', { units: [100, 101, 0], score: null }],
    ['a fraction', { units: [100, 50.5, 0], score: null }],
    ['text instead of numbers', { units: ['Unidade 1', 0, 0], score: null }],
    ['an invalid score', { units: [100, 0, 0], score: 120 }],
  ])('ignores progress that is %s', (_case, value) => {
    expect(parseProgress(value, 3)).toBeNull()
  })
})

describe('courseOutline', () => {
  it('lists the units in course order with their graded activity count', () => {
    expect(courseOutline(units)).toBe(
      [
        'O curso tem 3 unidades:',
        '- Unidade 1 — Introdução',
        '- Unidade 2 — EPI (2 atividades avaliativas)',
        '- Unidade 3 — Riscos',
      ].join('\n')
    )
  })

  it('says when the course has no units', () => {
    expect(courseOutline([])).toBe('O curso ainda não tem unidades.')
  })
})

describe('progressSummary', () => {
  it('splits units into done, started and pending, with the overall percentage and score', () => {
    expect(progressSummary(units, { units: [100, 50, 0], score: 80 })).toBe(
      [
        'Progresso do aluno: 50% do curso.',
        'Unidades concluídas: Unidade 1 — Introdução.',
        'Unidades em andamento: Unidade 2 — EPI (50%).',
        'Unidades não iniciadas: Unidade 3 — Riscos.',
        'Nota nas atividades avaliativas: 80%.',
      ].join('\n')
    )
  })

  it('handles a unit layout course, where each unit is 0 or 100, without a score yet', () => {
    const summary = progressSummary(units, { units: [100, 100, 0], score: null })

    expect(summary).toContain('67% do curso')
    expect(summary).toContain('Unidades em andamento: nenhuma.')
    expect(summary).toContain('ainda sem nota')
  })

  it('says the progress is unavailable when the client sent none', () => {
    expect(progressSummary(units, null)).toBe('Progresso do aluno: indisponível.')
  })
})
