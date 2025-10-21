export interface Aula {
  id: number;
  titulo: string;
  duracao: number; // em minutos
  status: 'concluida' | 'em-andamento' | 'disponivel' | 'nao-iniciada';
  conteudo: ConteudoAula;
  objetivos: string[];
  materialComplementar?: MaterialComplementar[];
}

export interface ConteudoAula {
  video?: {
    url: string;
    titulo: string;
    descricao: string;
  };
  texto: string;
  imagens?: ImagemConteudo[];
  componentes: ComponenteInterativo[];
}

export interface ImagemConteudo {
  id: string;
  src: string;
  alt: string;
  legenda?: string;
  tipo: 'imagem' | 'diagrama' | 'grafico';
}

export interface ComponenteInterativo {
  id: string;
  tipo: 'accordion' | 'slideshow' | 'modal' | 'tooltip' | 'box-atencao' | 'box-sabia' | 'flipcard' | 'quiz';
  titulo?: string;
  conteudo: any;
  posicao: number; // ordem no texto
}

export interface MaterialComplementar {
  id: string;
  titulo: string;
  tipo: 'pdf' | 'video' | 'link' | 'documento';
  url: string;
  descricao: string;
}

export interface ModuloDetalhado {
  id: number;
  titulo: string;
  descricao: string;
  duracao: string;
  aulas: Aula[];
  progresso: number; // 0-100%
  aulasConcluidas: number;
  totalAulas: number;
}

export interface StatusAula {
  id: number;
  status: 'concluida' | 'em-andamento' | 'disponivel' | 'nao-iniciada';
  progresso: number; // 0-100%
  tempoEstudado: number; // em minutos
  dataConclusao?: Date;
}
