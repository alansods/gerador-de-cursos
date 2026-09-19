import { createHash, randomUUID } from 'crypto'
import type { KnowledgeSourceKind } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { chunkText } from '@/lib/tutor/chunking'
import { getTutorProvider, type TutorProvider } from '@/lib/tutor/provider'

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
  replaceSourceId?: string
}

export async function indexSource(
  input: IndexSourceInput,
  provider: TutorProvider = getTutorProvider()
) {
  const chunks = prepareChunks(input.sections)
  const contentHash = chunksHash(chunks)
  const vectors = chunks.length > 0 ? await provider.embedDocuments(chunks.map((c) => c.text)) : []

  return prisma.$transaction(async (tx) => {
    if (input.replaceSourceId) {
      await tx.knowledgeSource.deleteMany({ where: { id: input.replaceSourceId } })
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
