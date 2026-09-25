import { BLOCK_CATALOG, isGradableBlock } from '@/lib/blocks'
import { parseFillBlanks } from '@/lib/fill-blanks'
import type { Block, Unit } from '@/types/course'
import type { LabeledSection } from '@/lib/tutor/knowledge'

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
}

export function htmlToText(html: string | undefined | null): string {
  if (!html) return ''

  return html
    .replace(/<(br|\/p|\/li|\/h\d|\/div)[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim()
}

function lines(...parts: (string | undefined | null)[]): string {
  return parts
    .map((part) => htmlToText(part))
    .filter(Boolean)
    .join('\n')
}

export function blockText(block: Block): string {
  if (isGradableBlock(block)) return ''

  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'subheading':
      return lines(block.content)
    case 'list':
      return lines(block.content, ...(block.listItems ?? []).map((item) => item.text))
    case 'learning-objectives':
      return lines(block.content, ...(block.objectiveItems ?? []).map((item) => item.text))
    case 'info-box':
      return lines(block.infoBoxTitle, block.content)
    case 'accordion':
      return lines(...(block.items ?? []).flatMap((item) => [item.title, item.content]))
    case 'tabs':
      return lines(...(block.tabItems ?? []).flatMap((item) => [item.title, item.content]))
    case 'timeline':
      return lines(
        ...(block.timelineItems ?? []).map((item) =>
          [item.date, item.title, htmlToText(item.description)].filter(Boolean).join(' — ')
        )
      )
    case 'flipcard':
      return lines(
        ...(block.flipcardItems ?? []).flatMap((item) => [item.frontTitle, item.backContent])
      )
    case 'carousel':
      return lines(...(block.carouselItems ?? []).map((item) => item.caption))
    case 'image':
      return lines(block.caption)
    case 'audio':
      return lines(block.audioTitle, block.transcript)
    case 'video':
      return lines(block.videoTitle, block.videoDescription)
    case 'pdf':
      return lines(block.pdfTitle)
    case 'interactive-image':
      return lines(...(block.hotspots ?? []).flatMap((item) => [item.title, item.content]))
    case 'technical-sheet':
      return lines(
        block.content,
        block.sheetSummary,
        ...(block.sheetMaterials ?? []).map((item) => `${item.quantity} ${item.name}`.trim()),
        ...(block.sheetSteps ?? []).map((item, index) => `${index + 1}. ${item.text}`)
      )
    default:
      return ''
  }
}

function alphabetical(values: (string | undefined)[]): string[] {
  return values
    .map((value) => htmlToText(value))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function numbered(items: string[]): string[] {
  return items.map((item, index) => `${index + 1}. ${item}`)
}

export function assessmentText(block: Block): string {
  if (!isGradableBlock(block)) return ''

  switch (block.type) {
    case 'quiz':
      return (block.quizData?.questions ?? [])
        .map((question) =>
          lines(
            `Questão: ${htmlToText(question.question)}`,
            ...question.options.map((option) => `- ${htmlToText(option.text)}`),
            question.hint && `Dica do autor: ${htmlToText(question.hint)}`
          )
        )
        .join('\n\n')
    case 'interactive-video':
      return (block.videoQuestions ?? [])
        .map((question) =>
          lines(
            `Questão: ${htmlToText(question.question)}`,
            ...[
              question.optionA,
              question.optionB,
              question.optionC,
              question.optionD,
              question.optionE,
            ]
              .filter(Boolean)
              .map((option) => `- ${htmlToText(option)}`)
          )
        )
        .join('\n\n')
    case 'true-false':
      return lines(
        'Afirmações para julgar como verdadeiras ou falsas:',
        ...(block.trueFalseItems ?? []).map((item) => `- ${htmlToText(item.statement)}`)
      )
    case 'scenario':
      return lines(
        block.scenarioSituation && `Situação: ${htmlToText(block.scenarioSituation)}`,
        ...(block.scenarioOptions ?? []).map((option) => `- ${htmlToText(option.text)}`)
      )
    case 'sequence':
      return lines(
        'Itens para colocar em ordem:',
        ...alphabetical((block.sequenceItems ?? []).map((item) => item.text)).map(
          (item) => `- ${item}`
        )
      )
    case 'matching': {
      const pairs = block.matchingPairs ?? []
      return lines(
        'Associar os itens da coluna A com os da coluna B.',
        'Coluna A:',
        ...numbered(alphabetical(pairs.map((pair) => pair.left))),
        'Coluna B:',
        ...numbered(alphabetical(pairs.map((pair) => pair.right)))
      )
    }
    case 'categorization': {
      const categories = block.categories ?? []
      return lines(
        `Categorias: ${alphabetical(categories.map((category) => category.name)).join('; ')}`,
        `Itens para classificar: ${alphabetical(
          categories.flatMap((category) => category.items.map((item) => item.text))
        ).join('; ')}`
      )
    }
    case 'fill-blanks':
      return lines(
        'Texto para completar:',
        parseFillBlanks(block.fillBlanksText)
          .map((segment) => (segment.kind === 'blank' ? '____' : segment.value))
          .join('')
      )
    case 'word-search':
      return lines(
        'Pistas das palavras escondidas:',
        ...(block.wordSearchItems ?? []).map((item) => `- ${htmlToText(item.clue)}`)
      )
    default:
      return ''
  }
}

function isSectionHeading(block: Block): boolean {
  return block.type === 'heading' || block.type === 'subheading'
}

export function courseSections(units: Unit[]): LabeledSection[] {
  const sections: LabeledSection[] = []

  ;[...units]
    .sort((a, b) => a.order - b.order)
    .forEach((unit, unitIndex) => {
      const unitLabel = `Unidade ${unitIndex + 1} — ${htmlToText(unit.title)}`
      let label = unitLabel
      let parts: string[] = [lines(unit.description)]

      const flush = () => {
        const text = parts.filter(Boolean).join('\n\n')
        if (text) sections.push({ label, text })
        parts = []
      }

      ;[...(unit.blocks ?? [])]
        .sort((a, b) => a.order - b.order)
        .forEach((block) => {
          const activity = assessmentText(block)
          if (activity) {
            flush()
            sections.push({
              label: `${unitLabel} › Atividade avaliativa: ${BLOCK_CATALOG[block.type].label}`,
              text: activity,
            })
            return
          }

          const text = blockText(block)
          if (isSectionHeading(block) && text) {
            flush()
            label = `${unitLabel} › ${text}`
          }
          if (text) parts.push(text)
        })

      flush()
    })

  return sections
}
