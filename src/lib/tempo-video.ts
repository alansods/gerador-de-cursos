const PARTE_VALIDA = /^\d{1,3}$/

export function segundosDeTempo(texto: string | undefined | null): number | null {
  if (typeof texto !== 'string') return null

  const limpo = texto.trim()
  if (!limpo) return null

  const partes = limpo.split(':')
  if (partes.length > 3) return null
  if (!partes.every((parte) => PARTE_VALIDA.test(parte))) return null

  const numeros = partes.map(Number)

  if (numeros.length === 1) return numeros[0]

  const [segundos, minutos] = [...numeros].reverse()
  if (segundos > 59 || minutos > 59) return null

  if (numeros.length === 2) return minutos * 60 + segundos

  return numeros[0] * 3600 + minutos * 60 + segundos
}

export function formatarTempo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos))
  const horas = Math.floor(total / 3600)
  const minutos = Math.floor((total % 3600) / 60)
  const restante = total % 60
  const doisDigitos = (valor: number) => String(valor).padStart(2, '0')

  if (horas > 0) return `${horas}:${doisDigitos(minutos)}:${doisDigitos(restante)}`
  return `${doisDigitos(minutos)}:${doisDigitos(restante)}`
}
