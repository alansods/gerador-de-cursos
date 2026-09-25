export const MAX_COURSE_OBJECTIVES = 8

export const MAX_OBJECTIVE_LENGTH = 160

export function normalizeObjectives(value: unknown): string[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, MAX_OBJECTIVE_LENGTH))
    .filter((item) => item.length > 0)
    .slice(0, MAX_COURSE_OBJECTIVES)
}
