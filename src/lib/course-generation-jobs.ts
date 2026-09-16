import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { generateCourseFromText } from '@/lib/ai-course-generator'
import { logActivity } from '@/lib/activity-logger'
import { upgradeUnits } from '@/lib/legacy-course'
import type { CourseLayoutId } from '@/lib/layout-prompt'
import type { ReadMode } from '@/lib/markers'
import { generateUniqueSlug, slugifyUnits } from '@/lib/slug'
import type { Unit } from '@/types/course'

export const GENERATION_MAX_DURATION_SECONDS = 300

const STALE_MARGIN_SECONDS = 30

export const STALE_JOB_ERROR = 'A geração excedeu o tempo limite.'

const MAX_ERROR_LENGTH = 500

interface StartGenerationInput {
  userId: string
  text: string
  fileName: string
  mode: ReadMode
  layout?: CourseLayoutId
}

export async function startGenerationJob({
  userId,
  text,
  fileName,
  mode,
  layout,
}: StartGenerationInput) {
  const title = provisionalTitle(fileName)
  const slug = await generateUniqueSlug(title)

  const job = await prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        title,
        slug,
        description: '',
        workload: '',
        modality: '',
        category: '',
        layout: layout ?? 'classic',
        units: [],
        ownerId: userId,
        generationStatus: 'GENERATING',
      },
    })

    return tx.courseGenerationJob.create({
      data: {
        courseId: course.id,
        userId,
        sourceFileName: fileName,
        sourceText: text,
        layout: layout ?? null,
        mode,
      },
    })
  })

  await logActivity({
    type: 'course_created',
    title: 'Novo curso criado',
    description: title,
    entityId: job.courseId,
    entityType: 'course',
    userId,
  })

  return job
}

export async function restartGenerationJob(jobId: string) {
  return prisma.$transaction(async (tx) => {
    const restarted = await tx.courseGenerationJob.updateMany({
      where: { id: jobId, status: 'FAILED' },
      data: {
        status: 'GENERATING',
        error: null,
        startedAt: new Date(),
        finishedAt: null,
        notifiedAt: null,
      },
    })

    if (restarted.count === 0) return null

    const job = await tx.courseGenerationJob.findUniqueOrThrow({ where: { id: jobId } })
    await tx.course.update({
      where: { id: job.courseId },
      data: { generationStatus: 'GENERATING' },
    })

    return job
  })
}

export async function runGenerationJob(jobId: string) {
  const job = await prisma.courseGenerationJob.findUnique({ where: { id: jobId } })
  if (!job || job.status !== 'GENERATING') return

  try {
    const { course, tokenUsage } = await generateCourseFromText(
      job.sourceText,
      job.mode as ReadMode,
      (job.layout ?? undefined) as CourseLayoutId | undefined
    )

    const title = course.title?.trim() || provisionalTitle(job.sourceFileName)
    const slug = await generateUniqueSlug(title, job.courseId)

    await prisma.$transaction(async (tx) => {
      const completed = await tx.courseGenerationJob.updateMany({
        where: { id: job.id, status: 'GENERATING' },
        data: {
          status: 'COMPLETED',
          finishedAt: new Date(),
          model: tokenUsage.model,
          promptTokens: tokenUsage.promptTokens,
          completionTokens: tokenUsage.completionTokens,
        },
      })

      if (completed.count === 0) return

      await tx.course.update({
        where: { id: job.courseId },
        data: {
          title,
          slug,
          description: course.description ?? '',
          workload: course.workload ?? '',
          modality: course.modality ?? '',
          category: course.category ?? '',
          units: normalizeUnits(course.units) as unknown as Prisma.InputJsonValue,
          generationStatus: null,
        },
      })
    })
  } catch (error) {
    console.error(`Course generation job ${job.id} failed:`, error)
    const message = error instanceof Error ? error.message : 'Erro ao gerar curso com IA'
    await failGenerationJob(job.id, job.courseId, message).catch((failure) =>
      console.error(`Could not mark generation job ${job.id} as failed:`, failure)
    )
  }
}

async function failGenerationJob(jobId: string, courseId: string, error: string) {
  await prisma.$transaction(async (tx) => {
    const failed = await tx.courseGenerationJob.updateMany({
      where: { id: jobId, status: 'GENERATING' },
      data: { status: 'FAILED', error: error.slice(0, MAX_ERROR_LENGTH), finishedAt: new Date() },
    })

    if (failed.count === 0) return

    await tx.course.update({ where: { id: courseId }, data: { generationStatus: 'FAILED' } })
  })
}

export async function expireStaleGenerationJobs() {
  const cutoff = new Date(
    Date.now() - (GENERATION_MAX_DURATION_SECONDS + STALE_MARGIN_SECONDS) * 1000
  )

  const stale = await prisma.courseGenerationJob.findMany({
    where: { status: 'GENERATING', startedAt: { lt: cutoff } },
    select: { id: true, courseId: true },
  })

  if (stale.length === 0) return

  await prisma.$transaction([
    prisma.courseGenerationJob.updateMany({
      where: { id: { in: stale.map((job) => job.id) }, status: 'GENERATING' },
      data: { status: 'FAILED', error: STALE_JOB_ERROR, finishedAt: new Date() },
    }),
    prisma.course.updateMany({
      where: { id: { in: stale.map((job) => job.courseId) }, generationStatus: 'GENERATING' },
      data: { generationStatus: 'FAILED' },
    }),
  ])
}

export async function markGenerationJobNotified(jobId: string, userId: string) {
  const marked = await prisma.courseGenerationJob.updateMany({
    where: {
      id: jobId,
      userId,
      notifiedAt: null,
      status: { in: ['COMPLETED', 'FAILED'] },
    },
    data: { notifiedAt: new Date() },
  })

  return marked.count === 1
}

export function provisionalTitle(fileName: string) {
  return fileName.replace(/\.(docx?|DOCX?)$/, '').trim() || 'Curso gerado por IA'
}

function normalizeUnits(units: Unit[] | undefined) {
  const stamp = Date.now()
  const mapped = (upgradeUnits(units ?? []) as unknown as Unit[]).map((unit, index) => ({
    ...unit,
    id: unit.id || `unidade-${stamp}-${index}`,
    order: unit.order ?? index,
    blocks: (unit.blocks ?? []).map((block, blockIndex) => ({
      ...block,
      id: block.id || `conteudo-${stamp}-${index}-${blockIndex}`,
      order: block.order ?? blockIndex,
      type: block.type || 'paragraph',
    })),
  }))

  return slugifyUnits(mapped)
}
