import { BLOCOS_COM_MARCADOR, CATALOGO_BLOCOS, type TipoBloco } from './blocos'

export type ModoLeitura = 'auto' | 'markers'

export interface DeteccaoMarcadores {
  encontrados: boolean
  total: number
  porTipo: Partial<Record<TipoBloco, number>>
  modo: ModoLeitura
}

export function detectarMarcadores(texto: string): DeteccaoMarcadores {
  const porTipo: Partial<Record<TipoBloco, number>> = {}
  let total = 0

  if (typeof texto === 'string' && texto.length > 0) {
    for (const meta of BLOCOS_COM_MARCADOR) {
      const aberturas = contarOcorrencias(texto, `${meta.marcador}_INICIO`)
      const fechamentos = contarOcorrencias(texto, `${meta.marcador}_FIM`)
      const pares = Math.min(aberturas, fechamentos)

      if (pares > 0) {
        porTipo[meta.tipo] = pares
        total += pares
      }
    }
  }

  return {
    encontrados: total > 0,
    total,
    porTipo,
    modo: total > 0 ? 'markers' : 'auto',
  }
}

export function descreverMarcadores(deteccao: DeteccaoMarcadores): string {
  const partes = (Object.keys(deteccao.porTipo) as TipoBloco[])
    .map((tipo) => {
      const quantidade = deteccao.porTipo[tipo] ?? 0
      const meta = CATALOGO_BLOCOS[tipo]
      const rotulo = quantidade === 1 ? meta.rotulo.toLowerCase() : meta.rotuloPlural
      return `${quantidade} ${rotulo}`
    })
    .sort()

  if (partes.length === 0) return ''
  if (partes.length === 1) return partes[0]

  return `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`
}

function contarOcorrencias(texto: string, marcador: string): number {
  const regex = new RegExp(`\\b${marcador}\\b`, 'gi')
  return (texto.match(regex) ?? []).length
}
