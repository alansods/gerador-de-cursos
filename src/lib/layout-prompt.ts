import type { Course, Unit } from '@/types/course'
import type { ReadMode } from '@/lib/markers'
import { BADGE_ICONS, BADGE_NAME_MAX_LENGTH } from '@/lib/trail-progress'

export const COURSE_LAYOUT_IDS = ['classic', 'sidebar', 'trail', 'video-lessons'] as const

export type CourseLayoutId = (typeof COURSE_LAYOUT_IDS)[number]

export function isCourseLayoutId(value: unknown): value is CourseLayoutId {
  return typeof value === 'string' && (COURSE_LAYOUT_IDS as readonly string[]).includes(value)
}

export function layoutPromptSection(layout: string | undefined, mode: ReadMode): string {
  if (layout !== 'trail') return ''

  const activities =
    mode === 'markers'
      ? `- Cada etapa deve ter ao menos uma atividade avaliada. Coloque cada bloco avaliado marcado
  no documento (quiz, matching, categorization, true-false, sequence, fill-blanks, word-search,
  scenario, interactive-video) dentro da etapa do assunto
  dele. Só quando uma etapa ficar sem nenhuma atividade avaliada, acrescente ao fim dela um
  quiz de 1 pergunta baseado apenas no conteúdo daquela etapa.`
      : `- Cada etapa deve terminar com ao menos uma atividade avaliada (quiz, matching,
  categorization, true-false, sequence, fill-blanks, word-search ou scenario) baseada apenas no conteúdo daquela etapa. Neste layout, essa regra substitui
  a de colocar o quiz só na revisão ao final da unidade.`

  return `

## Layout Trilha (gamificado)

O curso será exibido no layout Trilha: cada unidade vira uma missão, e cada bloco "heading"
abre uma etapa dessa missão.

- Em cada unidade, use de 2 a 5 blocos "heading" para dividir o conteúdo em etapas, e comece a
  unidade com um deles.
- O texto de cada "heading" é o nome de uma seção que já existe no documento. Não invente
  seções para chegar ao mínimo: uma unidade com um único assunto pode ter um só "heading".
${activities}
- Em cada Unidade, adicione o campo "badgeName": o nome da medalha que o aluno ganha ao
  concluir a missão. De 2 a 4 palavras, até ${BADGE_NAME_MAX_LENGTH} caracteres, ligado ao tema
  da unidade, sem emoji. Exemplo: { "title": "Higiene na cozinha", "badgeName": "Mãos limpas",
  "description": "...", "blocks": [...] }`
}

export function applyLayoutToGeneratedCourse(course: Course, layout?: CourseLayoutId): Course {
  const units = Array.isArray(course.units) ? course.units : []

  return {
    ...course,
    ...(layout ? { layout } : {}),
    units: units.map((unit) => (layout === 'trail' ? sanitizeBadge(unit) : withoutBadge(unit))),
  }
}

function sanitizeBadge(unit: Unit): Unit {
  const rest = withoutBadge(unit)
  const name =
    typeof unit.badgeName === 'string'
      ? unit.badgeName.trim().slice(0, BADGE_NAME_MAX_LENGTH).trim()
      : ''
  const icon = (BADGE_ICONS as readonly string[]).includes(unit.badgeIcon ?? '')
    ? unit.badgeIcon
    : undefined

  return {
    ...rest,
    ...(name ? { badgeName: name } : {}),
    ...(icon ? { badgeIcon: icon } : {}),
  }
}

function withoutBadge(unit: Unit): Unit {
  const rest = { ...unit }
  delete rest.badgeName
  delete rest.badgeIcon
  return rest
}
