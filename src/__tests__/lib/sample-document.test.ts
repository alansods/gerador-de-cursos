import { BLOCKS_WITH_MARKER } from '@/lib/blocks'
import { SAMPLE_DOCUMENT_TEXT } from '@/lib/sample-document'
import { detectMarkers } from '@/lib/markers'
import { isValidYouTubeUrl } from '@/lib/youtube'

describe('documento de exemplo', () => {
  const detection = detectMarkers(SAMPLE_DOCUMENT_TEXT)

  it('demonstra todos os marcadores suportados', () => {
    const demonstratedTypes = Object.keys(detection.byType).sort()
    const expectedTypes = BLOCKS_WITH_MARKER.map((meta) => meta.type).sort()

    expect(demonstratedTypes).toEqual(expectedTypes)
  })

  it('é lido no modo markers', () => {
    expect(detection.mode).toBe('markers')
  })

  it('fecha todos os marcadores que abre', () => {
    for (const meta of BLOCKS_WITH_MARKER) {
      const openings =
        SAMPLE_DOCUMENT_TEXT.match(new RegExp(`\\b${meta.marker}_INICIO\\b`, 'g')) ?? []
      const closings = SAMPLE_DOCUMENT_TEXT.match(new RegExp(`\\b${meta.marker}_FIM\\b`, 'g')) ?? []

      expect({ tipo: meta.type, aberturas: openings.length }).toEqual({
        tipo: meta.type,
        aberturas: closings.length,
      })
    }
  })

  it('traz o cabeçalho do curso que a IA usa nos metadados', () => {
    expect(SAMPLE_DOCUMENT_TEXT).toContain('CURSO:')
    expect(SAMPLE_DOCUMENT_TEXT).toContain('DESCRIÇÃO:')
    expect(SAMPLE_DOCUMENT_TEXT).toContain('CARGA HORÁRIA:')
    expect(SAMPLE_DOCUMENT_TEXT).toContain('MODALIDADE:')
    expect(SAMPLE_DOCUMENT_TEXT).toContain('CATEGORIA:')
  })

  it('traz o vídeo introdutório do banner com link do YouTube válido', () => {
    const line = SAMPLE_DOCUMENT_TEXT.split('\n').find((l) => l.startsWith('VÍDEO INTRODUTÓRIO:'))

    expect(line).toBeDefined()
    expect(isValidYouTubeUrl(line!.replace('VÍDEO INTRODUTÓRIO:', '').trim())).toBe(true)
  })

  it('tem quiz com cinco opções e resposta correta indicada', () => {
    expect(SAMPLE_DOCUMENT_TEXT).toContain('Opção E:')
    expect(SAMPLE_DOCUMENT_TEXT).toContain('Resposta Correta:')
  })
})
