import { ComponentType } from 'react'
import { ConteudoUnidade } from '@/types/gerador-curso'
import { TituloBlock } from './TituloBlock'
import { SubtituloBlock } from './SubtituloBlock'
import { ParagrafoBlock } from './ParagrafoBlock'
import { ImagemBlock } from './ImagemBlock'
import { AccordionBlock } from './AccordionBlock'
import { FlipCardBlock } from './FlipCardBlock'
import { ListaBlock } from './ListaBlock'
import { QuizBlock } from './QuizBlock'
import { InfoBoxBlock } from './InfoBoxBlock'
import { VideoBlock } from './VideoBlock'
import { ObjetivosBlock } from './ObjetivosBlock'

export interface BlockProps {
  item: ConteudoUnidade
}

export const blockRegistry: Record<ConteudoUnidade['tipo'], ComponentType<BlockProps>> = {
  titulo: TituloBlock,
  subtitulo: SubtituloBlock,
  paragrafo: ParagrafoBlock,
  imagem: ImagemBlock,
  accordion: AccordionBlock,
  flipcard: FlipCardBlock,
  lista: ListaBlock,
  quiz: QuizBlock,
  'info-box': InfoBoxBlock,
  video: VideoBlock,
  'objetivos-aprendizagem': ObjetivosBlock,
}
