import {
  MEDIA_CATEGORIES,
  MEDIA_POLICY,
  packageWeightRange,
  formatBytes,
  validateFile,
} from '@/lib/media'

const MB = 1024 * 1024

describe('política de mídias', () => {
  it('mantém o limite rígido dentro do que o Vercel Blob aceita por token', () => {
    for (const category of MEDIA_CATEGORIES) {
      const policy = MEDIA_POLICY[category]
      expect(policy.recommendedLimitBytes).toBeLessThanOrEqual(policy.hardLimitBytes)
      expect(policy.allowedTypes.length).toBeGreaterThan(0)
    }
  })

  it('não aceita SVG, pelo risco de script dentro do iframe do LMS', () => {
    expect(MEDIA_POLICY.image.allowedTypes).not.toContain('image/svg+xml')
  })

  it('não aceita WAV, que estouraria o peso do pacote', () => {
    expect(MEDIA_POLICY.audio.allowedTypes).not.toContain('audio/wav')
    expect(MEDIA_POLICY.audio.allowedTypes).not.toContain('audio/x-wav')
  })

  it('recusa formato fora da allowlist', () => {
    const { error } = validateFile({ type: 'image/svg+xml', size: 1000 }, 'image')
    expect(error).toMatch(/Formato não aceito/)
  })

  it('recusa arquivo acima do limite rígido', () => {
    const { error } = validateFile({ type: 'audio/mpeg', size: 30 * MB }, 'audio')
    expect(error).toMatch(/acima do limite/)
  })

  it('aceita com aviso entre o recomendado e o rígido', () => {
    const { error, warning } = validateFile({ type: 'audio/mpeg', size: 15 * MB }, 'audio')
    expect(error).toBeNull()
    expect(warning).toMatch(/Arquivo grande/)
  })

  it('aceita sem aviso abaixo do recomendado', () => {
    expect(validateFile({ type: 'application/pdf', size: 2 * MB }, 'document')).toEqual({
      error: null,
      warning: null,
    })
  })

  it('classifica o peso do pacote nas três faixas', () => {
    expect(packageWeightRange(20 * MB)).toBe('verde')
    expect(packageWeightRange(70 * MB)).toBe('amarelo')
    expect(packageWeightRange(150 * MB)).toBe('vermelho')
  })

  it('formata bytes de forma legível', () => {
    expect(formatBytes(8 * MB)).toBe('8 MB')
    expect(formatBytes(512 * 1024)).toBe('512 KB')
  })
})
