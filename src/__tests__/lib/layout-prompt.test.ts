import type { Course, Unit } from '@/types/course'
import { layoutRegistry } from '@/components/course/layouts/registry'
import {
  COURSE_LAYOUT_IDS,
  applyLayoutToGeneratedCourse,
  isCourseLayoutId,
  layoutPromptSection,
} from '@/lib/layout-prompt'

const unit = (extra: Partial<Unit> = {}): Unit => ({
  id: 'u1',
  title: 'Higiene',
  description: '',
  order: 0,
  blocks: [],
  ...extra,
})

const course = (units: Unit[]): Course =>
  ({ title: 'Curso', description: 'Desc', units }) as unknown as Course

describe('course layout ids', () => {
  it('match the layout registry', () => {
    expect([...COURSE_LAYOUT_IDS].sort()).toEqual(Object.keys(layoutRegistry).sort())
  })

  it('accept only known ids', () => {
    expect(isCourseLayoutId('trail')).toBe(true)
    expect(isCourseLayoutId('video-lessons')).toBe(true)
    expect(isCourseLayoutId('mosaic')).toBe(false)
    expect(isCourseLayoutId(3)).toBe(false)
  })
})

describe('layoutPromptSection', () => {
  it('is empty for layouts other than trail', () => {
    expect(layoutPromptSection(undefined, 'auto')).toBe('')
    expect(layoutPromptSection('classic', 'markers')).toBe('')
    expect(layoutPromptSection('sidebar', 'auto')).toBe('')
  })

  it('asks for steps, scored activities and badge names with trail', () => {
    const section = layoutPromptSection('trail', 'auto')

    expect(section).toContain('## Layout Trilha')
    expect(section).toContain('de 2 a 5 blocos "heading"')
    expect(section).toContain('atividade avaliada')
    expect(section).toContain('"badgeName"')
    expect(section).toContain('até 40 caracteres')
  })

  it('prefers the marked activities in markers mode', () => {
    expect(layoutPromptSection('trail', 'markers')).toContain('bloco avaliado marcado')
    expect(layoutPromptSection('trail', 'auto')).not.toContain('bloco avaliado marcado')
  })
})

describe('applyLayoutToGeneratedCourse', () => {
  it('keeps a trimmed badge name and a curated icon with trail', () => {
    const result = applyLayoutToGeneratedCourse(
      course([
        unit({ badgeName: '  Mãos limpas  ', badgeIcon: 'sparkles' }),
        unit({ badgeName: 'x'.repeat(60), badgeIcon: 'rocket-ship' }),
        unit({ badgeName: 42 as unknown as string }),
      ]),
      'trail'
    )

    expect(result.layout).toBe('trail')
    expect(result.units[0]).toMatchObject({ badgeName: 'Mãos limpas', badgeIcon: 'sparkles' })
    expect(result.units[1].badgeName).toHaveLength(40)
    expect(result.units[1]).not.toHaveProperty('badgeIcon')
    expect(result.units[2]).not.toHaveProperty('badgeName')
  })

  it('drops badge fields with other layouts', () => {
    const result = applyLayoutToGeneratedCourse(
      course([unit({ badgeName: 'Mãos limpas', badgeIcon: 'sparkles' })]),
      'classic'
    )

    expect(result.layout).toBe('classic')
    expect(result.units[0]).not.toHaveProperty('badgeName')
    expect(result.units[0]).not.toHaveProperty('badgeIcon')
  })

  it('leaves the layout unset when none was sent', () => {
    expect(applyLayoutToGeneratedCourse(course([unit()]))).not.toHaveProperty('layout')
  })
})
