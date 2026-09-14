const LIBRARY_PATH = /^\/illustrations\/([a-z0-9-]+)\/([a-z0-9-]+)\/([a-z0-9-]+)\.svg$/

export function isLibraryIllustrationPath(value: string | undefined): value is string {
  return typeof value === 'string' && LIBRARY_PATH.test(value)
}

const PACKAGED_ILLUSTRATION = /(^|\/)images\/illustration-[a-z0-9-]+\.svg$/

export const ILLUSTRATION_CARD_COLOR = '#FBF4E6'

export function isIllustrationSource(value: string | undefined): boolean {
  return isLibraryIllustrationPath(value) || (!!value && PACKAGED_ILLUSTRATION.test(value))
}

export function illustrationCardStyle(
  value: string | undefined
): { backgroundColor: string } | undefined {
  return isIllustrationSource(value) ? { backgroundColor: ILLUSTRATION_CARD_COLOR } : undefined
}

export function libraryPackageFileName(libraryPath: string): string {
  const [, theme, category, name] = libraryPath.match(LIBRARY_PATH) ?? []
  return `illustration-${theme}-${category}-${name}.svg`
}
