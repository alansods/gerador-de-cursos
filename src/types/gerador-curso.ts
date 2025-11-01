// Tipos para o gerador de cursos
export interface AccordionItem {
  id: string
  titulo: string
  conteudo: string
}

export interface ConteudoUnidade {
  id: string
  tipo: 'titulo' | 'paragrafo' | 'subtitulo' | 'imagem' | 'accordion'
  conteudo: string
  ordem: number
  // Propriedades específicas para imagens
  tamanho?: 'pequena' | 'media' | 'grande'
  legenda?: string
  fonte?: string
  // Propriedades específicas para parágrafos
  corTexto?: string
  alinhamento?: 'esquerda' | 'centro' | 'direita' | 'justificado'
  // Propriedades de layout
  colunas?: 6 | 12
  // Propriedades específicas para accordion
  items?: AccordionItem[]
}

export interface Unidade {
  id: string
  titulo: string
  descricao: string
  conteudo: ConteudoUnidade[]
  ordem: number
}

export interface CursoGerado {
  id: string
  titulo: string
  descricao: string
  cargaHoraria: string
  modalidade: string
  categoria: string
  dataCriacao: Date
  dataModificacao: Date
  unidades: Unidade[]
}

export interface GeradorCursoState {
  cursos: CursoGerado[]
  cursoAtual: CursoGerado | null
  modoEdicao: boolean
  loading: boolean
  error: string | null
}

export interface GeradorCursoContextType {
  state: GeradorCursoState
  criarCurso: (curso: Omit<CursoGerado, 'id' | 'dataCriacao' | 'dataModificacao'>) => void
  editarCurso: (id: string, curso: Partial<CursoGerado>) => void
  deletarCurso: (id: string) => void
  selecionarCurso: (id: string) => void
  adicionarUnidade: (unidade: Omit<Unidade, 'id' | 'ordem'>) => void
  editarUnidade: (id: string, unidade: Partial<Unidade>) => void
  deletarUnidade: (id: string) => void
  reordenarUnidades: (unidades: Unidade[]) => void
  adicionarConteudo: (unidadeId: string, conteudo: Omit<ConteudoUnidade, 'id' | 'ordem'>) => void
  editarConteudo: (unidadeId: string, conteudoId: string, conteudo: Partial<ConteudoUnidade>) => void
  deletarConteudo: (unidadeId: string, conteudoId: string) => void
  reordenarConteudo: (unidadeId: string, conteudo: ConteudoUnidade[]) => void
  salvarCurso: () => void
  carregarCursos: () => void
}
