import {
  CATEGORIAS_MIDIA,
  POLITICA_MIDIAS,
  faixaPesoPacote,
  formatarBytes,
  validarArquivo,
} from '@/lib/midias'

const MB = 1024 * 1024

describe('política de mídias', () => {
  it('mantém o limite rígido dentro do que o Vercel Blob aceita por token', () => {
    for (const categoria of CATEGORIAS_MIDIA) {
      const politica = POLITICA_MIDIAS[categoria]
      expect(politica.limiteRecomendadoBytes).toBeLessThanOrEqual(politica.limiteRigidoBytes)
      expect(politica.tiposPermitidos.length).toBeGreaterThan(0)
    }
  })

  it('não aceita SVG, pelo risco de script dentro do iframe do LMS', () => {
    expect(POLITICA_MIDIAS.imagem.tiposPermitidos).not.toContain('image/svg+xml')
  })

  it('não aceita WAV, que estouraria o peso do pacote', () => {
    expect(POLITICA_MIDIAS.audio.tiposPermitidos).not.toContain('audio/wav')
    expect(POLITICA_MIDIAS.audio.tiposPermitidos).not.toContain('audio/x-wav')
  })

  it('recusa formato fora da allowlist', () => {
    const { erro } = validarArquivo({ type: 'image/svg+xml', size: 1000 }, 'imagem')
    expect(erro).toMatch(/Formato não aceito/)
  })

  it('recusa arquivo acima do limite rígido', () => {
    const { erro } = validarArquivo({ type: 'audio/mpeg', size: 30 * MB }, 'audio')
    expect(erro).toMatch(/acima do limite/)
  })

  it('aceita com aviso entre o recomendado e o rígido', () => {
    const { erro, aviso } = validarArquivo({ type: 'audio/mpeg', size: 15 * MB }, 'audio')
    expect(erro).toBeNull()
    expect(aviso).toMatch(/Arquivo grande/)
  })

  it('aceita sem aviso abaixo do recomendado', () => {
    expect(validarArquivo({ type: 'application/pdf', size: 2 * MB }, 'documento')).toEqual({
      erro: null,
      aviso: null,
    })
  })

  it('classifica o peso do pacote nas três faixas', () => {
    expect(faixaPesoPacote(20 * MB)).toBe('verde')
    expect(faixaPesoPacote(70 * MB)).toBe('amarelo')
    expect(faixaPesoPacote(150 * MB)).toBe('vermelho')
  })

  it('formata bytes de forma legível', () => {
    expect(formatarBytes(8 * MB)).toBe('8 MB')
    expect(formatarBytes(512 * 1024)).toBe('512 KB')
  })
})
