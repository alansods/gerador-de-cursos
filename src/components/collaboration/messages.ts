import type { CollabAction, CollabTarget, CollabEvent } from '@/liveblocks.config'

const TARGET_LABEL: Record<CollabTarget, string> = {
  block: 'o bloco',
  unit: 'a unidade',
}

const ACTION_LABEL: Record<CollabAction, string> = {
  added: 'adicionou',
  updated: 'editou',
  deleted: 'excluiu',
  reordered: 'reordenou',
}

export function message({ author, action, target, name }: CollabEvent) {
  const base = `${author} ${ACTION_LABEL[action]} ${TARGET_LABEL[target]}`
  return name ? `${base} "${name}"` : base
}
