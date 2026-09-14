export function learnerFirstName(raw: string | null | undefined): string {
  if (!raw) return ''

  const trimmed = raw.trim()
  const comma = trimmed.indexOf(',')
  const ordered = comma >= 0 ? trimmed.slice(comma + 1) : trimmed

  return ordered.trim().split(/\s+/)[0] ?? ''
}
