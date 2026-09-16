/**
 * @jest-environment node
 */

import {
  STALE_JOB_ERROR,
  expireStaleGenerationJobs,
  markGenerationJobNotified,
  restartGenerationJob,
  runGenerationJob,
} from '@/lib/course-generation-jobs'
import { generateCourseFromText } from '@/lib/ai-course-generator'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/ai-course-generator', () => ({ generateCourseFromText: jest.fn() }))

jest.mock('@/lib/slug', () => ({
  ...jest.requireActual('@/lib/slug'),
  generateUniqueSlug: jest.fn().mockResolvedValue('doces-regionais'),
}))

const mockPrisma = prisma as unknown as {
  course: { update: jest.Mock; updateMany: jest.Mock }
  courseGenerationJob: {
    findMany: jest.Mock
    findUnique: jest.Mock
    findUniqueOrThrow: jest.Mock
    updateMany: jest.Mock
  }
}

const mockGenerate = generateCourseFromText as jest.MockedFunction<typeof generateCourseFromText>

const generatingJob = {
  id: 'job-1',
  courseId: 'course-1',
  userId: 'user-1',
  status: 'GENERATING',
  sourceFileName: 'roteiro.docx',
  sourceText: 'Conteúdo',
  layout: 'classic',
  mode: 'auto',
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  mockPrisma.courseGenerationJob.findUnique.mockResolvedValue(generatingJob)
  mockPrisma.courseGenerationJob.updateMany.mockResolvedValue({ count: 1 })
})

describe('runGenerationJob', () => {
  it('fills the course with the generated content and completes the job', async () => {
    mockGenerate.mockResolvedValue({
      course: {
        title: 'Doces Regionais',
        description: 'Curso',
        workload: '20 horas',
        modality: 'Online',
        category: 'Gastronomia',
        units: [{ title: 'Receitas', description: '', blocks: [{ type: 'paragraph' }] }],
      },
      tokenUsage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
        model: 'gemini-2.5-flash',
      },
      summary: {},
    } as unknown as Awaited<ReturnType<typeof generateCourseFromText>>)

    await runGenerationJob('job-1')

    expect(mockGenerate).toHaveBeenCalledWith('Conteúdo', 'auto', 'classic')
    expect(mockPrisma.courseGenerationJob.updateMany).toHaveBeenCalledWith({
      where: { id: 'job-1', status: 'GENERATING' },
      data: expect.objectContaining({ status: 'COMPLETED', model: 'gemini-2.5-flash' }),
    })
    expect(mockPrisma.course.update).toHaveBeenCalledWith({
      where: { id: 'course-1' },
      data: expect.objectContaining({
        title: 'Doces Regionais',
        slug: 'doces-regionais',
        category: 'Gastronomia',
        generationStatus: null,
      }),
    })
  })

  it('marks the job and the course as failed when the generation throws', async () => {
    mockGenerate.mockRejectedValue(new Error('A IA não retornou um curso válido'))

    await runGenerationJob('job-1')

    expect(mockPrisma.courseGenerationJob.updateMany).toHaveBeenCalledWith({
      where: { id: 'job-1', status: 'GENERATING' },
      data: expect.objectContaining({
        status: 'FAILED',
        error: 'A IA não retornou um curso válido',
      }),
    })
    expect(mockPrisma.course.update).toHaveBeenCalledWith({
      where: { id: 'course-1' },
      data: { generationStatus: 'FAILED' },
    })
  })

  it('leaves the course alone when the job was already closed meanwhile', async () => {
    mockGenerate.mockResolvedValue({
      course: { title: 'Doces', description: '', units: [] },
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, model: 'm' },
      summary: {},
    } as unknown as Awaited<ReturnType<typeof generateCourseFromText>>)
    mockPrisma.courseGenerationJob.updateMany.mockResolvedValue({ count: 0 })

    await runGenerationJob('job-1')

    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })

  it('does nothing for a job that is not generating', async () => {
    mockPrisma.courseGenerationJob.findUnique.mockResolvedValue({
      ...generatingJob,
      status: 'COMPLETED',
    })

    await runGenerationJob('job-1')

    expect(mockGenerate).not.toHaveBeenCalled()
  })
})

describe('expireStaleGenerationJobs', () => {
  it('fails jobs that outlived the function limit', async () => {
    mockPrisma.courseGenerationJob.findMany.mockResolvedValue([
      { id: 'job-1', courseId: 'course-1' },
    ])

    await expireStaleGenerationJobs()

    const [{ where }] = mockPrisma.courseGenerationJob.findMany.mock.calls[0]
    const cutoffAgeMs = Date.now() - (where.startedAt.lt as Date).getTime()
    expect(cutoffAgeMs).toBeGreaterThanOrEqual(330_000)
    expect(mockPrisma.courseGenerationJob.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['job-1'] }, status: 'GENERATING' },
      data: expect.objectContaining({ status: 'FAILED', error: STALE_JOB_ERROR }),
    })
    expect(mockPrisma.course.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['course-1'] }, generationStatus: 'GENERATING' },
      data: { generationStatus: 'FAILED' },
    })
  })

  it('skips the writes when nothing is stale', async () => {
    mockPrisma.courseGenerationJob.findMany.mockResolvedValue([])

    await expireStaleGenerationJobs()

    expect(mockPrisma.courseGenerationJob.updateMany).not.toHaveBeenCalled()
  })
})

describe('markGenerationJobNotified', () => {
  it('only marks a finished job of the user that was not notified yet', async () => {
    const notified = await markGenerationJobNotified('job-1', 'user-1')

    expect(notified).toBe(true)
    expect(mockPrisma.courseGenerationJob.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'job-1',
        userId: 'user-1',
        notifiedAt: null,
        status: { in: ['COMPLETED', 'FAILED'] },
      },
      data: { notifiedAt: expect.any(Date) },
    })
  })

  it('reports false when another tab already notified it', async () => {
    mockPrisma.courseGenerationJob.updateMany.mockResolvedValue({ count: 0 })

    expect(await markGenerationJobNotified('job-1', 'user-1')).toBe(false)
  })
})

describe('restartGenerationJob', () => {
  it('puts a failed job and its course back to generating', async () => {
    mockPrisma.courseGenerationJob.findUniqueOrThrow.mockResolvedValue(generatingJob)

    const job = await restartGenerationJob('job-1')

    expect(job).toEqual(generatingJob)
    expect(mockPrisma.courseGenerationJob.updateMany).toHaveBeenCalledWith({
      where: { id: 'job-1', status: 'FAILED' },
      data: expect.objectContaining({ status: 'GENERATING', notifiedAt: null, error: null }),
    })
    expect(mockPrisma.course.update).toHaveBeenCalledWith({
      where: { id: 'course-1' },
      data: { generationStatus: 'GENERATING' },
    })
  })

  it('returns null when the job had not failed', async () => {
    mockPrisma.courseGenerationJob.updateMany.mockResolvedValue({ count: 0 })

    expect(await restartGenerationJob('job-1')).toBeNull()
    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })
})
