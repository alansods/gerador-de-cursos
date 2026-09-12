import { BLOCKS_WITH_MARKER } from '@/lib/blocks'
import { SAMPLE_DOCUMENT_TEXT } from '@/lib/sample-document'
import { detectMarkers } from '@/lib/markers'
import { isValidYouTubeUrl } from '@/lib/youtube'

describe('sample document', () => {
  const detection = detectMarkers(SAMPLE_DOCUMENT_TEXT)

  it('demonstrates every supported marker', () => {
    const demonstratedTypes = Object.keys(detection.byType).sort()
    const expectedTypes = BLOCKS_WITH_MARKER.map((meta) => meta.type).sort()

    expect(demonstratedTypes).toEqual(expectedTypes)
  })

  it('is read in markers mode', () => {
    expect(detection.mode).toBe('markers')
  })

  it('closes every marker it opens', () => {
    for (const meta of BLOCKS_WITH_MARKER) {
      const openings =
        SAMPLE_DOCUMENT_TEXT.match(new RegExp(`\\b${meta.marker}_INICIO\\b`, 'g')) ?? []
      const closings = SAMPLE_DOCUMENT_TEXT.match(new RegExp(`\\b${meta.marker}_FIM\\b`, 'g')) ?? []

      expect({ type: meta.type, openings: openings.length }).toEqual({
        type: meta.type,
        openings: closings.length,
      })
    }
  })

  it('carries the course header the AI reads as metadata', () => {
    expect(SAMPLE_DOCUMENT_TEXT).toContain('CURSO:')
    expect(SAMPLE_DOCUMENT_TEXT).toContain('DESCRIÇÃO:')
    expect(SAMPLE_DOCUMENT_TEXT).toContain('CARGA HORÁRIA:')
    expect(SAMPLE_DOCUMENT_TEXT).toContain('MODALIDADE:')
    expect(SAMPLE_DOCUMENT_TEXT).toContain('CATEGORIA:')
  })

  it('carries the banner intro video with a valid YouTube link', () => {
    const line = SAMPLE_DOCUMENT_TEXT.split('\n').find((l) => l.startsWith('VÍDEO INTRODUTÓRIO:'))

    expect(line).toBeDefined()
    expect(isValidYouTubeUrl(line!.replace('VÍDEO INTRODUTÓRIO:', '').trim())).toBe(true)
  })

  it('has a quiz with five options and the correct answer marked', () => {
    expect(SAMPLE_DOCUMENT_TEXT).toContain('Opção E:')
    expect(SAMPLE_DOCUMENT_TEXT).toContain('Resposta Correta:')
  })
})
