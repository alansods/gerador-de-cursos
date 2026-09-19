import { prisma } from '@/lib/prisma'
import { toVectorLiteral } from '@/lib/tutor/knowledge'
import { getTutorProvider, type Passage, type TutorProvider } from '@/lib/tutor/provider'

export const TUTOR_TOP_K = 5
export const DEFAULT_MIN_SIMILARITY = 0.62
export const TUTOR_MAX_QUESTION_LENGTH = 500
export const NOT_FOUND_ANSWER =
  'Não encontrei isso no conteúdo desta aula. Tente perguntar de outro jeito ou sobre um tema tratado no curso.'

export function minSimilarity(): number {
  const value = Number(process.env.TUTOR_MIN_SIMILARITY)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MIN_SIMILARITY
}

interface ScoredPassage extends Passage {
  similarity: number
}

export async function searchPassages(
  courseId: string,
  vector: number[],
  limit = TUTOR_TOP_K
): Promise<ScoredPassage[]> {
  return prisma.$queryRaw<ScoredPassage[]>`
    SELECT label, text, 1 - (embedding <=> ${toVectorLiteral(vector)}::vector) AS similarity
    FROM knowledge_chunks
    WHERE course_id = ${courseId}
    ORDER BY embedding <=> ${toVectorLiteral(vector)}::vector
    LIMIT ${limit}`
}

export interface TutorReply {
  answer: string
  sources: string[]
  grounded: boolean
}

export async function askTutor(
  courseId: string,
  question: string,
  provider: TutorProvider = getTutorProvider()
): Promise<TutorReply> {
  const vector = await provider.embedQuery(question)
  const threshold = minSimilarity()
  const passages = (await searchPassages(courseId, vector)).filter(
    (passage) => Number(passage.similarity) >= threshold
  )

  if (passages.length === 0) {
    return { answer: NOT_FOUND_ANSWER, sources: [], grounded: false }
  }

  const answer = await provider.answer(
    question,
    passages.map(({ label, text }) => ({ label, text }))
  )

  return {
    answer,
    sources: [...new Set(passages.map((passage) => passage.label))],
    grounded: true,
  }
}
