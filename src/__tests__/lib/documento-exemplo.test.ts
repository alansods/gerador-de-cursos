import { BLOCOS_COM_MARCADOR } from '@/lib/blocos'
import { TEXTO_DOCUMENTO_EXEMPLO } from '@/lib/documento-exemplo'
import { detectarMarcadores } from '@/lib/marcadores'
import { ehUrlYouTubeValida } from '@/lib/youtube'

describe('documento de exemplo', () => {
  const deteccao = detectarMarcadores(TEXTO_DOCUMENTO_EXEMPLO)

  it('demonstra todos os marcadores suportados', () => {
    const tiposDemonstrados = Object.keys(deteccao.porTipo).sort()
    const tiposEsperados = BLOCOS_COM_MARCADOR.map((meta) => meta.tipo).sort()

    expect(tiposDemonstrados).toEqual(tiposEsperados)
  })

  it('é lido no modo markers', () => {
    expect(deteccao.modo).toBe('markers')
  })

  it('fecha todos os marcadores que abre', () => {
    for (const meta of BLOCOS_COM_MARCADOR) {
      const aberturas =
        TEXTO_DOCUMENTO_EXEMPLO.match(new RegExp(`\\b${meta.marcador}_INICIO\\b`, 'g')) ?? []
      const fechamentos =
        TEXTO_DOCUMENTO_EXEMPLO.match(new RegExp(`\\b${meta.marcador}_FIM\\b`, 'g')) ?? []

      expect({ tipo: meta.tipo, aberturas: aberturas.length }).toEqual({
        tipo: meta.tipo,
        aberturas: fechamentos.length,
      })
    }
  })

  it('traz o cabeçalho do curso que a IA usa nos metadados', () => {
    expect(TEXTO_DOCUMENTO_EXEMPLO).toContain('CURSO:')
    expect(TEXTO_DOCUMENTO_EXEMPLO).toContain('DESCRIÇÃO:')
    expect(TEXTO_DOCUMENTO_EXEMPLO).toContain('CARGA HORÁRIA:')
    expect(TEXTO_DOCUMENTO_EXEMPLO).toContain('MODALIDADE:')
    expect(TEXTO_DOCUMENTO_EXEMPLO).toContain('CATEGORIA:')
  })

  it('traz o vídeo introdutório do banner com link do YouTube válido', () => {
    const linha = TEXTO_DOCUMENTO_EXEMPLO.split('\n').find((l) =>
      l.startsWith('VÍDEO INTRODUTÓRIO:')
    )

    expect(linha).toBeDefined()
    expect(ehUrlYouTubeValida(linha!.replace('VÍDEO INTRODUTÓRIO:', '').trim())).toBe(true)
  })

  it('tem quiz com cinco opções e resposta correta indicada', () => {
    expect(TEXTO_DOCUMENTO_EXEMPLO).toContain('Opção E:')
    expect(TEXTO_DOCUMENTO_EXEMPLO).toContain('Resposta Correta:')
  })
})
