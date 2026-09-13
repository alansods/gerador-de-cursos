import {
  MEDIA_CATEGORIES,
  MEDIA_POLICY,
  packageWeightRange,
  formatBytes,
  validateFile,
} from '@/lib/media'

const MB = 1024 * 1024

describe('media policy', () => {
  it('keeps the hard limit within what Vercel Blob accepts per token', () => {
    for (const category of MEDIA_CATEGORIES) {
      const policy = MEDIA_POLICY[category]
      expect(policy.recommendedLimitBytes).toBeLessThanOrEqual(policy.hardLimitBytes)
      expect(policy.allowedTypes.length).toBeGreaterThan(0)
    }
  })

  it('rejects SVG, which could carry a script inside the LMS iframe', () => {
    expect(MEDIA_POLICY.image.allowedTypes).not.toContain('image/svg+xml')
  })

  it('rejects WAV, which would blow up the package size', () => {
    expect(MEDIA_POLICY.audio.allowedTypes).not.toContain('audio/wav')
    expect(MEDIA_POLICY.audio.allowedTypes).not.toContain('audio/x-wav')
  })

  it('refuses a format outside the allowlist', () => {
    const { error } = validateFile({ type: 'image/svg+xml', size: 1000 }, 'image')
    expect(error).toMatch(/Formato não aceito/)
  })

  it('refuses a file over the hard limit', () => {
    const { error } = validateFile({ type: 'audio/mpeg', size: 30 * MB }, 'audio')
    expect(error).toMatch(/acima do limite/)
  })

  it('accepts with a warning between the recommended and the hard limit', () => {
    const { error, warning } = validateFile({ type: 'audio/mpeg', size: 15 * MB }, 'audio')
    expect(error).toBeNull()
    expect(warning).toMatch(/Arquivo grande/)
  })

  it('accepts with no warning below the recommended limit', () => {
    expect(validateFile({ type: 'application/pdf', size: 2 * MB }, 'document')).toEqual({
      error: null,
      warning: null,
    })
  })

  it('classifies the package weight into the three bands', () => {
    expect(packageWeightRange(20 * MB)).toBe('verde')
    expect(packageWeightRange(70 * MB)).toBe('amarelo')
    expect(packageWeightRange(150 * MB)).toBe('vermelho')
  })

  it('formats bytes in a readable way', () => {
    expect(formatBytes(8 * MB)).toBe('8 MB')
    expect(formatBytes(512 * 1024)).toBe('512 KB')
  })
})
