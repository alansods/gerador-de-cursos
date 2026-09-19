import { createHash, randomUUID } from 'crypto'
import type { KnowledgeSourceKind } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { chunkText } from '@/lib/tutor/chunking'
import { getTutorProvider, type TutorProvider } from '@/lib/tutor/provider'
import { courseSections } from '@/lib/tutor/course-text'
import type { Unit } from '@/types/course'

export interface LabeledSection {
  label: string
  text: string
}

export interface PreparedChunk {
  label: string
  text: string
}

export function chunksHash(chunks: PreparedChunk[]): string {
  return createHash('sha256').update(JSON.stringify(chunks)).digest('hex')
}

export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(',')}]`
}

export function prepareChunks(sections: LabeledSection[]): PreparedChunk[] {
  return sections.flatMap((section) =>
    chunkText(section.text).map((text) => ({ label: section.label, text }))
  )
}

interface IndexSourceInput {
  courseId: string
  kind: KnowledgeSourceKind
  name: string
  sections: LabeledSection[]
  reusableVectors?: Map<string, number[]>
}

export function embeddingInput(chunk: PreparedChunk): string {
  return `${chunk.label}\n\n${chunk.text}`
}

function chunkKey(chunk: PreparedChunk): string {
  return `${chunk.label}\u0000${chunk.text}`
}

async function embedMissing(
  chunks: PreparedChunk[],
  reusable: Map<string, number[]>,
  provider: TutorProvider
): Promise<number[][]> {
  const missing = chunks.filter((chunk) => !reusable.has(chunkKey(chunk)))
  const fresh = missing.length > 0 ? await provider.embedDocuments(missing.map(embeddingInput)) : []
  const vectors = new Map(reusable)
  missing.forEach((chunk, index) => vectors.set(chunkKey(chunk), fresh[index]))
  return chunks.map((chunk) => vectors.get(chunkKey(chunk)) as number[])
}

export async function indexSource(
  input: IndexSourceInput,
  provider: TutorProvider = getTutorProvider()
) {
  const chunks = prepareChunks(input.sections)
  const contentHash = chunksHash(chunks)
  const vectors = await embedMissing(chunks, input.reusableVectors ?? new Map(), provider)

  return prisma.$transaction(async (tx) => {
    if (input.kind === 'COURSE') {
      await tx.knowledgeSource.deleteMany({ where: { courseId: input.courseId, kind: 'COURSE' } })
    }

    const source = await tx.knowledgeSource.create({
      data: { courseId: input.courseId, kind: input.kind, name: input.name, contentHash },
    })

    if (chunks.length > 0) {
      await tx.$executeRaw`
        INSERT INTO knowledge_chunks (id, source_id, course_id, label, text, embedding)
        SELECT id, ${source.id}, ${input.courseId}, label, text, embedding::vector
        FROM unnest(
          ${chunks.map(() => randomUUID())}::text[],
          ${chunks.map((chunk) => chunk.label)}::text[],
          ${chunks.map((chunk) => chunk.text)}::text[],
          ${vectors.map(toVectorLiteral)}::text[]
        ) AS rows(id, label, text, embedding)`
    }

    return { ...source, chunkCount: chunks.length }
  })
}

export async function listSources(courseId: string) {
  const sources = await prisma.knowledgeSource.findMany({
    where: { courseId },
    orderBy: [{ kind: 'asc' }, { createdAt: 'asc' }],
    include: { _count: { select: { chunks: true } } },
  })

  return sources.map(({ _count, ...source }) => ({ ...source, chunkCount: _count.chunks }))
}

export const COURSE_SOURCE_NAME = 'Conteúdo do curso'

async function courseChunkVectors(sourceId: string): Promise<Map<string, number[]>> {
  const rows = await prisma.$queryRaw<{ label: string; text: string; embedding: string }[]>`
    SELECT label, text, embedding::text AS embedding FROM knowledge_chunks WHERE source_id = ${sourceId}`

  return new Map(rows.map((row) => [chunkKey(row), JSON.parse(row.embedding) as number[]]))
}

export async function reindexCourseContent(
  courseId: string,
  units: Unit[],
  provider?: TutorProvider
): Promise<'unchanged' | 'removed' | 'indexed'> {
  const sections = courseSections(units)
  const chunks = prepareChunks(sections)
  const existing = await prisma.knowledgeSource.findFirst({
    where: { courseId, kind: 'COURSE' },
    select: { id: true, contentHash: true },
  })

  if (chunks.length === 0) {
    if (!existing) return 'unchanged'
    await prisma.knowledgeSource.deleteMany({ where: { courseId, kind: 'COURSE' } })
    return 'removed'
  }

  if (existing?.contentHash === chunksHash(chunks)) return 'unchanged'

  await indexSource(
    {
      courseId,
      kind: 'COURSE',
      name: COURSE_SOURCE_NAME,
      sections,
      reusableVectors: existing ? await courseChunkVectors(existing.id) : undefined,
    },
    provider
  )

  return 'indexed'
}
