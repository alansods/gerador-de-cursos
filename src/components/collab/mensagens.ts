import type { AcaoColab, AlvoColab, EventoColab } from '@/liveblocks.config'

const ROTULO_ALVO: Record<AlvoColab, string> = {
  bloco: 'o bloco',
  unidade: 'a unidade',
}

const ROTULO_ACAO: Record<AcaoColab, string> = {
  adicionou: 'adicionou',
  editou: 'editou',
  excluiu: 'excluiu',
  reordenou: 'reordenou',
}

export function mensagem({ autor, acao, alvo, nome }: EventoColab) {
  const base = `${autor} ${ROTULO_ACAO[acao]} ${ROTULO_ALVO[alvo]}`
  return nome ? `${base} "${nome}"` : base
}
