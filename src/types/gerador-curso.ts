// Tipos para o gerador de cursos
export interface AccordionItem {
  id: string
  titulo: string
  conteudo: string
}

export interface ListaItem {
  id: string
  texto: string
}

export interface QuizItem {
  id: string
  texto: string // texto da opção de resposta
  isCorrect: boolean // se esta é a resposta correta
  feedback: string // feedback específico para esta resposta
}

export interface QuizQuestion {
  id: string // ID único para a pergunta
  pergunta: string // pergunta do quiz
  dica?: string // dica opcional para a pergunta
  opcoes: QuizItem[] // array com exatamente 5 opções
}

export interface QuizData {
  questions: QuizQuestion[] // Array de perguntas do quiz
}

export interface ConteudoUnidade {
  id: string
  tipo:
    | 'titulo'
    | 'paragrafo'
    | 'subtitulo'
    | 'imagem'
    | 'accordion'
    | 'flipcard'
    | 'lista'
    | 'quiz'
    | 'info-box'
    | 'video'
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
  // Propriedades específicas para flipcard
  tipoFrente?: 'imagem' | 'imagem-titulo' | 'titulo'
  imagemFrente?: string
  tituloFrente?: string
  conteudoVerso?: string
  alturaCard?: string // altura do card em pixels ou viewport units
  // Propriedades específicas para lista
  itensLista?: ListaItem[]
  tipoLista?: 'ordenada' | 'nao-ordenada' | 'check' // lista ordenada (numerada), não ordenada (bullets) ou com ícone de check
  // Propriedades específicas para quiz
  quizData?: QuizData
  // Propriedades específicas para info-box
  tipoInfoBox?: 'atencao' | 'saiba_mais' | 'info' | 'curiosidade'
  tituloInfoBox?: string
  // Propriedades específicas para video
  videoUrl?: string
  videoTitulo?: string
}

export interface Unidade {
  id: string
  slug?: string
  titulo: string
  descricao: string
  conteudo: ConteudoUnidade[]
  ordem: number
}

export interface CursoGerado {
  id: string
  slug?: string
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
  selecionarCurso: (id: string, forceRefresh?: boolean) => void
  adicionarUnidade: (unidade: Omit<Unidade, 'id' | 'ordem'>) => void
  editarUnidade: (id: string, unidade: Partial<Unidade>) => void
  deletarUnidade: (id: string) => void
  reordenarUnidades: (unidades: Unidade[]) => void
  adicionarConteudo: (unidadeId: string, conteudo: Omit<ConteudoUnidade, 'id' | 'ordem'>) => void
  editarConteudo: (
    unidadeId: string,
    conteudoId: string,
    conteudo: Partial<ConteudoUnidade>
  ) => void
  deletarConteudo: (unidadeId: string, conteudoId: string) => void
  reordenarConteudo: (unidadeId: string, conteudo: ConteudoUnidade[]) => void
  salvarCurso: () => void
  carregarCursos: () => void
}
