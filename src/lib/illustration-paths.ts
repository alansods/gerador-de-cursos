const LIBRARY_PATH = /^\/illustrations\/([a-z0-9-]+)\/([a-z0-9-]+)\/([a-z0-9-]+)\.svg$/

export function isLibraryIllustrationPath(value: string | undefined): value is string {
  return typeof value === 'string' && LIBRARY_PATH.test(value)
}

export function libraryPackageFileName(libraryPath: string): string {
  const [, theme, category, name] = libraryPath.match(LIBRARY_PATH) ?? []
  return `illustration-${theme}-${category}-${name}.svg`
}
