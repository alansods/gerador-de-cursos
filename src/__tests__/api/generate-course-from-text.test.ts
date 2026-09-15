/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { POST } from '@/app/api/generate-course-from-text/route'
import { createCourseWithAi } from '@/app/(app)/courses/new/actions'
import { prisma } from '@/lib/prisma'

const mockGenerateContent = jest.fn()

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({ generateContent: mockGenerateContent }),
  })),
}))

const mockPrisma = prisma as unknown as { user: { findUnique: jest.Mock } }

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

async function authCookie() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const token = await new SignJWT({ id: 'user-1', email: 'a@senai.br', name: 'A', role: 'ADMIN' })
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

describe('POST /api/generate-course-from-text', () => {
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

  it('asks for the unit blocks under blocks and returns them', async () => {
    const response = await callRoute({ text: 'Conteúdo' })
    const data = await response.json()

    expect(sentPrompt()).toContain('"blocks": [ <array de Bloco> ]')
    expect(data.course.units[0].blocks.map((block: { type: string }) => block.type)).toEqual([
      'heading',
      'paragraph',
    ])
    expect(data.summary.blocks).toBe(2)
  })

  it('rejects an unknown layout before calling the AI', async () => {
    const response = await callRoute({ text: 'Conteúdo', layout: 'mosaic' })

    expect(response.status).toBe(400)
    expect(mockGenerateContent).not.toHaveBeenCalled()
  })

  it('adds the trail section to the prompt and keeps the sanitized badge', async () => {
    const response = await callRoute({ text: 'Conteúdo', layout: 'trail' })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(sentPrompt()).toContain('## Layout Trilha')
    expect(data.course.layout).toBe('trail')
    expect(data.course.units[0].badgeName).toBe('Mãos limpas')
    expect(data.course.units[0]).not.toHaveProperty('badgeIcon')
  })

  it('keeps the previous prompt and drops badges for other layouts', async () => {
    const response = await callRoute({ text: 'Conteúdo', layout: 'classic' })
    const data = await response.json()
    const classicPrompt = sentPrompt()

    mockGenerateContent.mockClear()
    await callRoute({ text: 'Conteúdo' })

    expect(classicPrompt).not.toContain('Layout Trilha')
    expect(classicPrompt).toBe(sentPrompt())
    expect(data.course.units[0]).not.toHaveProperty('badgeName')
  })

  it('asks for three to five quiz options', async () => {
    await callRoute({ text: 'Conteúdo', mode: 'auto' })

    expect(sentPrompt()).toContain('de 3 a 5 opções por pergunta')
    expect(sentPrompt()).not.toContain('exatamente 5 opções')
  })

  it('copies the Avaliativa marker only in markers mode', async () => {
    await callRoute({ text: 'QUIZ_INICIO\nAvaliativa: não\nQUIZ_FIM', mode: 'markers' })
    const markersPrompt = sentPrompt()

    mockGenerateContent.mockClear()
    await callRoute({ text: 'Conteúdo', mode: 'auto' })
    const autoPrompt = sentPrompt()

    expect(markersPrompt).toContain('"não" ou "nao" → "graded": false')
    expect(autoPrompt).toContain('NUNCA use o campo "graded" no modo automático')
    expect(autoPrompt).not.toContain('"graded": false')
  })
})

describe('createCourseWithAi', () => {
  it('sends the chosen layout with the text', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ course: aiCourse, summary: {} }), {
        headers: { 'content-type': 'application/json' },
      })
    )

    await createCourseWithAi('Conteúdo', 'trail')

    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(String(init?.body))).toEqual({ text: 'Conteúdo', layout: 'trail' })
    fetchMock.mockRestore()
  })
})
