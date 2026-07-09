export interface AulaStatusStyles {
  textColor: string
  bgColor: string
  borderColor: string
  iconColor: string
}

export interface MaterialComplementar {
  id: string
  titulo: string
  descricao: string
  tipo: string
  url?: string
}

export interface ComponenteInterativo {
  id: string
  tipo: string
  titulo: string
  conteudo: any
  posicao: number
}
