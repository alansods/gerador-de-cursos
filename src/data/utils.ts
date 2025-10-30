// Utility functions for data handling
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR')
}

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}h ${mins}min`
  }
  return `${mins}min`
}

export const generateId = (): string => {
  return Date.now().toString()
}

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}

export const getAulaById = (_unidadeId: number, aulaId: number) => {
  // Mock function for aula data
  return {
    id: aulaId,
    titulo: `Aula ${aulaId}`,
    descricao: `Descrição da aula ${aulaId}`,
    duracao: 30
  }
}

export const getTotalAulasUnidade = (unidadeId: number): number => {
  // Mock function - return different numbers based on unidade
  const aulasPorUnidade: Record<number, number> = {
    1: 10,
    2: 7,
    3: 7
  }
  return aulasPorUnidade[unidadeId] || 5
}
