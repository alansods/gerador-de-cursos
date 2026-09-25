/**
 * @jest-environment node
 */

import { NextRequest, after } from 'next/server'
import { SignJWT } from 'jose'
import { POST, maxDuration } from '@/app/api/generate-course-from-text/route'
import { generateCourseFromText } from '@/lib/ai-course-generator'
import { runGenerationJob } from '@/lib/course-generation-jobs'
import { prisma } from '@/lib/prisma'

const mockGenerateContent = jest.fn()
const mockGetGenerativeModel = jest.fn()

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: (params: unknown) => {
      mockGetGenerativeModel(params)
      return { generateContent: mockGenerateContent }
    },
  })),
}))

jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  after: jest.fn(),
}))

jest.mock('@/lib/course-generation-jobs', () => ({
  ...jest.requireActual('@/lib/course-generation-jobs'),
  runGenerationJob: jest.fn(),
}))

jest.mock('@/lib/slug', () => ({
  ...jest.requireActual('@/lib/slug'),
  generateUniqueSlug: jest.fn().mockResolvedValue('roteiro'),
}))

jest.mock('@/lib/activity-logger', () => ({ logActivity: jest.fn() }))

const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock }
  course: { create: jest.Mock }
  courseGenerationJob: { create: jest.Mock }
}

const aiCourse = {
  title: 'Doces Regionais',
  description: 'Curso',
  units: [
    {
      title: 'Higiene',
      description: '',
      badgeName: '  Mãos limpas ',
      badgeIcon: 'not-an-icon',
      blocks: [
        { title: 'Lavagem', type: 'heading', content: 'Lavagem das mãos' },
        { title: 'Texto', type: 'paragraph', content: '<p>Lave as mãos.</p>' },
      ],
    },
  ],
}

async function authCookie(role = 'ADMIN') {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const token = await new SignJWT({ id: 'user-1', email: 'a@senai.br', name: 'A', role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret)
  return `auth-token=${token}`
}

async function callRoute(body: Record<string, unknown>) {
  const req = new NextRequest('http://localhost:3000/api/generate-course-from-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: await authCookie() },
    body: JSON.stringify(body),
  })
  return POST(req)
}

function sentPrompt(): string {
  return mockGenerateContent.mock.calls[0][0] as string
}

const originalKey = process.env.GEMINI_API_KEY

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'log').mockImplementation(() => {})
  process.env.GEMINI_API_KEY = 'test-key'
  mockPrisma.user.findUnique.mockResolvedValue({ name: 'A', role: 'ADMIN' })
  mockGenerateContent.mockResolvedValue({
    response: { text: () => JSON.stringify(aiCourse), usageMetadata: {} },
  })
})

afterAll(() => {
  process.env.GEMINI_API_KEY = originalKey
})

describe('POST /api/generate-course-from-text', () => {
  beforeEach(() => {
    mockPrisma.course.create.mockResolvedValue({ id: 'course-1' })
    mockPrisma.courseGenerationJob.create.mockResolvedValue({
      id: 'job-1',
      courseId: 'course-1',
    })
  })

  it('creates the course and the job, schedules the generation and answers right away', async () => {
    const response = await callRoute({
      text: 'Conteúdo',
      fileName: 'roteiro.docx',
      layout: 'trail',
    })

    expect(response.status).toBe(202)
    expect(await response.json()).toEqual({
      success: true,
      jobId: 'job-1',
      courseId: 'course-1',
    })
    expect(mockPrisma.course.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'roteiro',
        layout: 'trail',
        ownerId: 'user-1',
        generationStatus: 'GENERATING',
      }),
    })
    expect(mockPrisma.courseGenerationJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        courseId: 'course-1',
        userId: 'user-1',
        sourceFileName: 'roteiro.docx',
        sourceText: 'Conteúdo',
        layout: 'trail',
        mode: 'auto',
      }),
    })
    expect(mockGenerateContent).not.toHaveBeenCalled()

    const scheduled = (after as jest.Mock).mock.calls[0][0] as () => Promise<void>
    await scheduled()
    expect(runGenerationJob).toHaveBeenCalledWith('job-1')
  })

  it('rejects an unknown layout before creating anything', async () => {
    const response = await callRoute({ text: 'Conteúdo', fileName: 'a.docx', layout: 'mosaic' })

    expect(response.status).toBe(400)
    expect(mockPrisma.course.create).not.toHaveBeenCalled()
  })

  it('requires the file name', async () => {
    const response = await callRoute({ text: 'Conteúdo' })

    expect(response.status).toBe(400)
    expect(mockPrisma.course.create).not.toHaveBeenCalled()
  })

  it('refuses to start when no AI key is configured', async () => {
    delete process.env.GEMINI_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY

    const response = await callRoute({ text: 'Conteúdo', fileName: 'a.docx' })

    process.env.OPENAI_API_KEY = openaiKey
    expect(response.status).toBe(500)
    expect(mockPrisma.course.create).not.toHaveBeenCalled()
  })

  it('allows the function to run for up to 300 seconds', () => {
    expect(maxDuration).toBe(300)
  })
})

describe('generateCourseFromText', () => {
  it('asks for the unit blocks under blocks and returns them', async () => {
    const { course, summary } = await generateCourseFromText('Conteúdo', 'auto')

    expect(sentPrompt()).toContain('"blocks": [ <array de Bloco> ]')
    expect(course.units[0].blocks.map((block) => block.type)).toEqual(['heading', 'paragraph'])
    expect(summary.blocks).toBe(2)
  })

  it('adds the trail section to the prompt and keeps the sanitized badge', async () => {
    const { course } = await generateCourseFromText('Conteúdo', 'auto', 'trail')

    expect(sentPrompt()).toContain('## Layout Trilha')
    expect(course.layout).toBe('trail')
    expect(course.units[0].badgeName).toBe('Mãos limpas')
    expect(course.units[0]).not.toHaveProperty('badgeIcon')
  })

  it('keeps the previous prompt and drops badges for other layouts', async () => {
    const { course } = await generateCourseFromText('Conteúdo', 'auto', 'classic')
    const classicPrompt = sentPrompt()

    mockGenerateContent.mockClear()
    await generateCourseFromText('Conteúdo', 'auto')

    expect(classicPrompt).not.toContain('Layout Trilha')
    expect(classicPrompt).toBe(sentPrompt())
    expect(course.units[0]).not.toHaveProperty('badgeName')
  })

  it('builds only video lessons without links for the video lessons layout', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            title: 'C# do zero',
            description: 'Curso',
            units: [
              {
                title: 'Fundamentos',
                description: 'Tipos e variáveis',
                blocks: [
                  {
                    title: 'Tipos',
                    type: 'video',
                    content: '',
                    videoTitle: ' Tipos de dados ',
                    videoDescription: 'Inteiros e textos.\nConversões.',
                    videoUrl: '',
                  },
                  { title: 'Texto', type: 'paragraph', content: '<p>Extra</p>' },
                  {
                    title: 'Quiz',
                    type: 'quiz',
                    content: '',
                    quizData: { questions: [] },
                  },
                  {
                    title: 'Variáveis',
                    type: 'video',
                    content: '',
                    videoTitle: 'Variáveis',
                    videoDescription: 'x'.repeat(2500),
                    videoUrl: 'sem link',
                  },
                  { title: 'Sem título', type: 'video', content: '', videoUrl: '' },
                  {
                    title: 'Do documento',
                    type: 'video',
                    content: '',
                    videoTitle: 'Do documento',
                    videoUrl: 'https://cdn.example.com/aula.mp4',
                  },
                ],
              },
            ],
          }),
        usageMetadata: {},
      },
    })

    const { course, summary } = await generateCourseFromText('Conteúdo', 'auto', 'video-lessons')
    const lessons = course.units[0].blocks

    expect(sentPrompt()).toContain('## Layout Aulas em vídeo')
    expect(course.layout).toBe('video-lessons')
    expect(lessons.map((block) => block.type)).toEqual(['video', 'video', 'video'])
    expect(lessons[0]).toMatchObject({
      videoTitle: 'Tipos de dados',
      videoDescription: 'Inteiros e textos.\nConversões.',
      videoUrl: '',
      videoSource: 'youtube',
    })
    expect(lessons[1].videoUrl).toBe('')
    expect(lessons[1].videoDescription).toHaveLength(2000)
    expect(lessons[2]).toMatchObject({
      videoUrl: 'https://cdn.example.com/aula.mp4',
      videoSource: 'file',
    })
    expect(summary.discarded.map((item) => item.reason)).toEqual([
      'fora do layout',
      'fora do layout',
      'aula sem título',
    ])
  })

  it('tells the model to ignore other markers in the video lessons layout', async () => {
    await generateCourseFromText('QUIZ_INICIO\nQUIZ_FIM', 'markers', 'video-lessons')

    expect(sentPrompt()).toContain('Ignore os marcadores de outros recursos')
  })

  it('asks for three to five quiz options', async () => {
    await generateCourseFromText('Conteúdo', 'auto')

    expect(sentPrompt()).toContain('de 3 a 5 opções por pergunta')
    expect(sentPrompt()).not.toContain('exatamente 5 opções')
  })

  it('copies the Avaliativa marker only in markers mode', async () => {
    await generateCourseFromText('QUIZ_INICIO\nAvaliativa: não\nQUIZ_FIM', 'markers')
    const markersPrompt = sentPrompt()

    mockGenerateContent.mockClear()
    await generateCourseFromText('Conteúdo', 'auto')
    const autoPrompt = sentPrompt()

    expect(markersPrompt).toContain('"não" ou "nao" → "graded": false')
    expect(autoPrompt).toContain('NUNCA use o campo "graded" no modo automático')
    expect(autoPrompt).not.toContain('"graded": false')
  })

  it('caps the model thinking at a fixed budget', async () => {
    await generateCourseFromText('Conteúdo', 'auto')

    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        generationConfig: { thinkingConfig: { thinkingBudget: 2048 } },
      })
    )
  })
})
