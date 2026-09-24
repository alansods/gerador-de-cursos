import type { Block, Course, Unit } from '@/types/course'

export type BlockType = Block['type']

export const VIDEO_LESSONS_LAYOUT_ID = 'video-lessons'

const LAYOUT_ALLOWED_BLOCK_TYPES: Partial<Record<string, readonly BlockType[]>> = {
  [VIDEO_LESSONS_LAYOUT_ID]: ['video'],
}

export function allowedBlockTypes(layoutId: string | undefined): readonly BlockType[] | null {
  return (layoutId && LAYOUT_ALLOWED_BLOCK_TYPES[layoutId]) || null
}

export function blocksOutsideLayout(
  units: Pick<Unit, 'blocks'>[] | undefined,
  layoutId: string | undefined
): number {
  const allowed = allowedBlockTypes(layoutId)
  if (!allowed) return 0

  return (units ?? []).reduce(
    (count, unit) =>
      count + (unit.blocks ?? []).filter((block) => !allowed.includes(block.type)).length,
    0
  )
}

export function canUseLayout(course: Pick<Course, 'units'>, layoutId: string): boolean {
  return blocksOutsideLayout(course.units, layoutId) === 0
}
