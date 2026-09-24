export const MAX_VIDEO_DESCRIPTION_LENGTH = 2000

export function limitVideoDescription(value: unknown): { videoDescription?: string } {
  return typeof value === 'string'
    ? { videoDescription: value.slice(0, MAX_VIDEO_DESCRIPTION_LENGTH) }
    : {}
}
