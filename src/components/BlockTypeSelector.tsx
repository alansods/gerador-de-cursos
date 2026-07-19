'use client'

import React from 'react'
import {
  Heading2,
  Heading3,
  Type,
  Image,
  List,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  HelpCircle,
  Video,
  Target,
} from 'lucide-react'
import { ConteudoUnidade } from '@/types/gerador-curso'

interface BlockTypeOption {
  tipo: ConteudoUnidade['tipo']
  label: string
  description: string
  icon: React.ElementType
}

const blockTypes: BlockTypeOption[] = [
  {
    tipo: 'titulo',
    label: 'Título',
    description: 'Cabeçalho de seção',
    icon: Heading2,
  },
  {
    tipo: 'paragrafo',
    label: 'Texto',
    description: 'Parágrafo de conteúdo',
    icon: Type,
  },
  {
    tipo: 'imagem',
    label: 'Imagem',
    description: 'Foto com legenda',
    icon: Image,
  },
  {
    tipo: 'video',
    label: 'Vídeo',
    description: 'Vídeo do YouTube',
    icon: Video,
  },
  {
    tipo: 'lista',
    label: 'Lista',
    description: 'Itens ou passos',
    icon: List,
  },
  {
    tipo: 'objetivos-aprendizagem',
    label: 'Objetivos',
    description: 'Objetivos de aprendizagem',
    icon: Target,
  },
  {
    tipo: 'info-box',
    label: 'Destaque',
    description: 'Dica ou aviso',
    icon: AlertTriangle,
  },
  {
    tipo: 'flipcard',
    label: 'Flashcards',
    description: 'Cartões de revisão',
    icon: RotateCcw,
  },
  {
    tipo: 'accordion',
    label: 'Sanfona',
    description: 'Perguntas expansíveis',
    icon: ChevronDown,
  },
  {
    tipo: 'quiz',
    label: 'Quiz',
    description: 'Pergunta com resposta',
    icon: HelpCircle,
  },
  {
    tipo: 'subtitulo',
    label: 'Subtítulo',
    description: 'Subcabeçalho',
    icon: Heading3,
  },
]

interface BlockTypeSelectorProps {
  onSelect: (tipo: ConteudoUnidade['tipo']) => void
}

export function BlockTypeSelector({ onSelect }: BlockTypeSelectorProps) {
  console.log('🔍 BlockTypeSelector - Total de tipos:', blockTypes.length)
  console.log(
    '🔍 BlockTypeSelector - Tipos disponíveis:',
    blockTypes.map((t) => t.tipo)
  )

  const videoType = blockTypes.find((t) => t.tipo === 'video')
  console.log('🔍 BlockTypeSelector - Tipo video encontrado?', videoType ? 'SIM' : 'NÃO', videoType)

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Adicionar conteúdo
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Escolha o tipo de conteúdo que você quer incluir na unidade.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {blockTypes.map((blockType) => {
          console.log('🔍 Renderizando card:', blockType.tipo, blockType.label)
          const Icon = blockType.icon
          return (
            <button
              key={blockType.tipo}
              onClick={() => onSelect(blockType.tipo)}
              className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                {blockType.label}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                {blockType.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
