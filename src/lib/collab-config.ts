/**
 * Limite de pessoas editando o mesmo curso ao mesmo tempo.
 *
 * O valor 2 é uma restrição do plano gratuito do Liveblocks (3.000 minutos de
 * colaboração por mês, marca d'água visível; o plano pago começa em US$ 30/mês).
 * Segurar em 2 mantém o consumo previsível enquanto o app é interno.
 *
 * REVISITAR quando o app virar comercial: subir este número aumenta o consumo
 * de minutos proporcionalmente ao número de pessoas conectadas.
 */
export const MAX_COLAB_SIMULTANEOS = 2

/** Kill switch manual: com a flag desligada, o editor se comporta como antes. */
export const COLAB_HABILITADO = process.env.NEXT_PUBLIC_COLLAB_ENABLED === 'true'

export const SALA_DO_CURSO = (cursoId: string) => `curso:${cursoId}`

/** Cores estáveis por usuário, para o cursor e o avatar não trocarem de cor */
const CORES_COLAB = [
  '#0047BB',
  '#F15A29',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

export function corDoUsuario(userId: string): string {
  let soma = 0
  for (let i = 0; i < userId.length; i++) {
    soma = (soma + userId.charCodeAt(i)) % CORES_COLAB.length
  }
  return CORES_COLAB[soma]
}
