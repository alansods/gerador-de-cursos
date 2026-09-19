import { isGradableBlock } from '@/lib/blocks'
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
      return lines(block.videoTitle)
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
      let parts: string[] = [lines(unit.title, unit.description)]

      const flush = () => {
        const text = parts.filter(Boolean).join('\n\n')
        if (text) sections.push({ label, text })
        parts = []
      }

      ;[...(unit.blocks ?? [])]
        .sort((a, b) => a.order - b.order)
        .forEach((block) => {
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
