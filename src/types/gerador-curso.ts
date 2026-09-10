// Tipos para o gerador de cursos
import type { PermissoesCurso, StatusCurso } from '@/lib/permissions'

export type { PermissoesCurso, StatusCurso }

export interface AccordionItem {
  id: string
  titulo: string
  conteudo: string
}

export interface ListaItem {
  id: string
  texto: string
}

export interface TabItem {
  id: string
  titulo: string
  conteudo: string
}

export interface TimelineItem {
  id: string
  data: string
  titulo: string
  descricao: string
}

export interface CarrosselItem {
  id: string
  url: string
  legenda?: string
  fonte?: string
}

export interface FlipcardItem {
  id: string
  tipoFrente: 'imagem' | 'imagem-titulo' | 'titulo'
  imagemFrente?: string
  tituloFrente?: string
  conteudoVerso: string
}

export interface HotspotItem {
  id: string
  x: number
  y: number
  titulo: string
  conteudo: string
}

export interface ParAssociacao {
  id: string
  esquerda: string
  direita: string
}

export interface ItemCategorizado {
  id: string
  texto: string
}

export interface CategoriaItem {
  id: string
  nome: string
  itens: ItemCategorizado[]
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
    | 'objetivos-aprendizagem'
    | 'separador'
    | 'tabs'
    | 'linha-do-tempo'
    | 'carrossel'
    | 'audio'
    | 'pdf'
    | 'imagem-interativa'
    | 'associacao'
    | 'categorizacao'
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
  itensFlipcard?: FlipcardItem[]
  alturaCard?: string // altura compartilhada por todos os cards da grade
  // Campos legados de flipcard de card único — migrados para itensFlipcard em corrigirBloco()
  tipoFrente?: 'imagem' | 'imagem-titulo' | 'titulo'
  imagemFrente?: string
  tituloFrente?: string
  conteudoVerso?: string
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
  // Propriedades específicas para objetivos-aprendizagem
  itensObjetivos?: ListaItem[]
  // Propriedades específicas para separador
  estiloSeparador?: 'linha' | 'espaco' | 'linha-icone'
  // Propriedades específicas para tabs
  itensTabs?: TabItem[]
  // Propriedades específicas para linha-do-tempo
  itensTimeline?: TimelineItem[]
  orientacaoTimeline?: 'vertical' | 'horizontal'
  // Propriedades específicas para carrossel
  itensCarrossel?: CarrosselItem[]
  modoCarrossel?: 'carrossel' | 'grade'
  // Propriedades específicas para audio
  audioUrl?: string
  audioTitulo?: string
  transcricao?: string
  // Propriedades específicas para pdf
  pdfUrl?: string
  pdfTitulo?: string
  permitirDownloadPdf?: boolean
  // Propriedades específicas para imagem-interativa
  imagemBase?: string
  hotspots?: HotspotItem[]
  // Propriedades específicas para associacao
  paresAssociacao?: ParAssociacao[]
  // Propriedades específicas para categorizacao
  categorias?: CategoriaItem[]
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
  layout?: string
  bannerVideoUrl?: string
  status?: StatusCurso
  version?: number
  ownerId?: string
  ownerNome?: string
  permissoes?: PermissoesCurso
  solicitacaoPendente?: boolean
  dataCriacao: Date
  dataModificacao: Date
  unidades: Unidade[]
}

export interface GeradorCursoState {
  cursoAtual: CursoGerado | null
  modoEdicao: boolean
  loading: boolean
}

export interface GeradorCursoContextType {
  state: GeradorCursoState
  criarCurso: (
    curso: Omit<CursoGerado, 'id' | 'dataCriacao' | 'dataModificacao'>
  ) => Promise<string>
  editarCurso: (id: string, curso: Partial<CursoGerado>) => void
  deletarCurso: (id: string) => void
  selecionarCurso: (id: string, forceRefresh?: boolean) => void
  adicionarUnidade: (unidade: Omit<Unidade, 'id' | 'ordem'>) => Promise<void>
  editarUnidade: (id: string, unidade: Partial<Unidade>) => Promise<void>
  deletarUnidade: (id: string) => Promise<void>
  reordenarUnidades: (unidades: Unidade[]) => Promise<void>
  adicionarConteudo: (
    unidadeId: string,
    conteudo: Omit<ConteudoUnidade, 'id' | 'ordem'>
  ) => Promise<void>
  editarConteudo: (
    unidadeId: string,
    conteudoId: string,
    conteudo: Partial<ConteudoUnidade>
  ) => void
  deletarConteudo: (unidadeId: string, conteudoId: string) => void
  reordenarConteudo: (unidadeId: string, conteudo: ConteudoUnidade[]) => void
}
