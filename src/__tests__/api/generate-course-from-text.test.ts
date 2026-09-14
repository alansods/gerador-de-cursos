/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { POST } from '@/app/api/generate-course-from-text/route'
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
})
