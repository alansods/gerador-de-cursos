const VALID_PART = /^\d{1,3}$/

export function timeToSeconds(text: string | undefined | null): number | null {
  if (typeof text !== 'string') return null

  const clean = text.trim()
  if (!clean) return null

  const partes = clean.split(':')
  if (partes.length > 3) return null
  if (!partes.every((part) => VALID_PART.test(part))) return null

  const numeros = partes.map(Number)

  if (numeros.length === 1) return numeros[0]

  const [seconds, minutes] = [...numeros].reverse()
  if (seconds > 59 || minutes > 59) return null

  if (numeros.length === 2) return minutes * 60 + seconds

  return numeros[0] * 3600 + minutes * 60 + seconds
}

export function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const horas = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = total % 60
  const twoDigits = (value: number) => String(value).padStart(2, '0')

  if (horas > 0) return `${horas}:${twoDigits(minutes)}:${twoDigits(rest)}`
  return `${twoDigits(minutes)}:${twoDigits(rest)}`
}
