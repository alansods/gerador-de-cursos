/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { POST } from '@/app/api/tutor/[courseId]/route'
import {
  askTutor,
  splitCitation,
  NOT_FOUND_ANSWER,
  TUTOR_MAX_QUESTION_LENGTH,
} from '@/lib/tutor/ask'
import { getTutorProvider, type TutorProvider } from '@/lib/tutor/provider'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/tutor/provider', () => ({
  ...jest.requireActual('@/lib/tutor/provider'),
  getTutorProvider: jest.fn(),
}))

const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock }
  course: { findUnique: jest.Mock }
  $queryRaw: jest.Mock
}

mockPrisma.$queryRaw = jest.fn()

function fakeProvider(): TutorProvider & { answer: jest.Mock; embedQuery: jest.Mock } {
  return {
    embedDocuments: jest.fn(),
    embedQuery: jest.fn(async () => [0.1, 0.2]),
    answer: jest.fn(async () => 'EPI é equipamento de proteção individual.\n\nFonte: Unidade 1'),
  }
}

let provider: ReturnType<typeof fakeProvider>

beforeEach(() => {
  jest.clearAllMocks()
  delete process.env.TUTOR_MIN_SIMILARITY
  provider = fakeProvider()
  ;(getTutorProvider as jest.Mock).mockReturnValue(provider)
})

function passage(label: string, similarity: number) {
  return { label, text: `Texto de ${label}`, similarity }
}

describe('askTutor', () => {
  it('answers from the passages above the threshold, without calling the LLM for the rest', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      passage('Unidade 1', 0.82),
      passage('Unidade 1', 0.75),
      passage('apostila.docx', 0.64),
      passage('Unidade 3', 0.4),
    ])

    provider.answer.mockResolvedValue('EPI é equipamento de proteção individual.')
    const reply = await askTutor('curso-1', 'O que é EPI?', provider)

    expect(reply.grounded).toBe(true)
    expect(reply.sources).toEqual(['Unidade 1', 'apostila.docx'])
    expect(provider.answer).toHaveBeenCalledWith('O que é EPI?', [
      { label: 'Unidade 1', text: 'Texto de Unidade 1' },
      { label: 'Unidade 1', text: 'Texto de Unidade 1' },
      { label: 'apostila.docx', text: 'Texto de apostila.docx' },
    ])
  })

  it('moves the citation out of the answer and keeps only the cited sources', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      passage('Unidade 1', 0.82),
      passage('apostila.docx', 0.7),
    ])
    provider.answer.mockResolvedValue('Extintor é EPC.\n\nFonte: apostila.docx')

    const reply = await askTutor('curso-1', 'Extintor é EPI?', provider)

    expect(reply.answer).toBe('Extintor é EPC.')
    expect(reply.sources).toEqual(['apostila.docx'])
  })

  it('returns the fixed answer and skips the LLM when nothing is similar enough', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([passage('Unidade 1', 0.3)])

    const reply = await askTutor('curso-1', 'Quem ganhou a Copa?', provider)

    expect(reply).toEqual({ answer: NOT_FOUND_ANSWER, sources: [], grounded: false })
    expect(provider.answer).not.toHaveBeenCalled()
  })

  it('searches only the chunks of the course being asked about', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([])

    await askTutor('curso-1', 'pergunta', provider)

    const [sql, ...values] = mockPrisma.$queryRaw.mock.calls[0]
    expect(sql.join('?')).toContain('WHERE course_id = ?')
    expect(values).toContain('curso-1')
  })

  it('reads the threshold from TUTOR_MIN_SIMILARITY', async () => {
    process.env.TUTOR_MIN_SIMILARITY = '0.9'
    mockPrisma.$queryRaw.mockResolvedValue([passage('Unidade 1', 0.82)])

    expect((await askTutor('curso-1', 'pergunta', provider)).grounded).toBe(false)
  })
})

describe('POST /api/tutor/[courseId]', () => {
  async function ask(body: unknown, { authenticated = true } = {}) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (authenticated) {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', name: 'Aluno', role: 'GUEST' })
      const token = await new SignJWT({
        id: 'u1',
        email: 'a@senai.br',
        name: 'Aluno',
        role: 'GUEST',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(process.env.JWT_SECRET))
      headers.Cookie = `auth-token=${token}`
    }
    const req = new NextRequest('http://localhost:3000/api/tutor/curso-1', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    return POST(req, { params: Promise.resolve({ courseId: 'curso-1' }) })
  }

  beforeEach(() => {
    mockPrisma.course.findUnique.mockResolvedValue({ tutorEnabled: true })
    mockPrisma.$queryRaw.mockResolvedValue([passage('Unidade 1', 0.8)])
  })

  it('answers with the sources', async () => {
    const res = await ask({ question: '  O que é EPI?  ' })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.grounded).toBe(true)
    expect(body.sources).toEqual(['Unidade 1'])
    expect(provider.answer.mock.calls[0][0]).toBe('O que é EPI?')
  })

  it('never forwards anything but the question to the LLM', async () => {
    await ask({ question: 'O que é EPI?', learnerName: 'Maria Silva' })

    expect(JSON.stringify(provider.answer.mock.calls)).not.toContain('Maria')
    expect(JSON.stringify(provider.embedQuery.mock.calls)).not.toContain('Maria')
  })

  it('refuses an empty or too long question', async () => {
    expect((await ask({ question: '   ' })).status).toBe(400)
    expect((await ask({ question: 'x'.repeat(TUTOR_MAX_QUESTION_LENGTH + 1) })).status).toBe(400)
    expect(provider.embedQuery).not.toHaveBeenCalled()
  })

  it('returns 404 for an unknown course', async () => {
    mockPrisma.course.findUnique.mockResolvedValue(null)

    expect((await ask({ question: 'O que é EPI?' })).status).toBe(404)
  })

  it('refuses a course with the tutor turned off, without calling the provider', async () => {
    mockPrisma.course.findUnique.mockResolvedValue({ tutorEnabled: false })

    expect((await ask({ question: 'O que é EPI?' })).status).toBe(403)
    expect(provider.embedQuery).not.toHaveBeenCalled()
  })

  it('returns 503 when the provider fails', async () => {
    provider.embedQuery.mockRejectedValue(new Error('Gemini 429'))

    expect((await ask({ question: 'O que é EPI?' })).status).toBe(503)
  })

  it('requires authentication', async () => {
    expect((await ask({ question: 'O que é EPI?' }, { authenticated: false })).status).toBe(401)
  })
})

describe('splitCitation', () => {
  const labels = ['Unidade 1 — Segurança › EPI', 'apostila.docx']

  it('reads "Fonte" and "Fontes" lines, with or without markdown bold', () => {
    expect(
      splitCitation('Texto.\n**Fontes:** apostila.docx; Unidade 1 — Segurança › EPI', labels)
    ).toEqual({
      text: 'Texto.',
      cited: labels,
    })
  })

  it('keeps the whole answer and cites nothing when there is no citation line', () => {
    expect(splitCitation('Texto sem fonte.', labels)).toEqual({
      text: 'Texto sem fonte.',
      cited: [],
    })
  })
})
