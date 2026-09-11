import { BLOCKS_WITH_MARKER, BLOCK_CATALOG, type BlockType } from './blocks'

export type ReadMode = 'auto' | 'markers'

export interface MarkerDetection {
  found: boolean
  total: number
  byType: Partial<Record<BlockType, number>>
  mode: ReadMode
}

export function detectMarkers(text: string): MarkerDetection {
  const byType: Partial<Record<BlockType, number>> = {}
  let total = 0

  if (typeof text === 'string' && text.length > 0) {
    for (const meta of BLOCKS_WITH_MARKER) {
      const openings = countOccurrences(text, `${meta.marker}_INICIO`)
      const closings = countOccurrences(text, `${meta.marker}_FIM`)
      const pairs = Math.min(openings, closings)

      if (pairs > 0) {
        byType[meta.type] = pairs
        total += pairs
      }
    }
  }

  return {
    found: total > 0,
    total,
    byType,
    mode: total > 0 ? 'markers' : 'auto',
  }
}

export function describeMarkers(detection: MarkerDetection): string {
  const partes = (Object.keys(detection.byType) as BlockType[])
    .map((type) => {
      const count = detection.byType[type] ?? 0
      const meta = BLOCK_CATALOG[type]
      const label = count === 1 ? meta.label.toLowerCase() : meta.pluralLabel
      return `${count} ${label}`
    })
    .sort()

  if (partes.length === 0) return ''
  if (partes.length === 1) return partes[0]

  return `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`
}

function countOccurrences(text: string, marker: string): number {
  const regex = new RegExp(`\\b${marker}\\b`, 'gi')
  return (text.match(regex) ?? []).length
}
