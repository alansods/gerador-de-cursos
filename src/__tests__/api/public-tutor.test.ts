/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { POST, OPTIONS } from '@/app/api/public/tutor/[courseId]/route'
import { POST as regenerate } from '@/app/api/courses/[id]/tutor-token/route'
import { askTutor } from '@/lib/tutor/ask'
import {
  consumeTutorQuota,
  courseDailyLimit,
  sessionLimitPerMinute,
  tokensMatch,
} from '@/lib/tutor/public-access'
import { prisma } from '@/lib/prisma'

jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  after: jest.fn(),
}))

jest.mock('@/lib/tutor/ask', () => ({
  ...jest.requireActual('@/lib/tutor/ask'),
  askTutor: jest.fn(),
}))

const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock }
  course: { findUnique: jest.Mock; update: jest.Mock }
  courseCollaborator: { findUnique: jest.Mock }
  $queryRaw: jest.Mock
}

mockPrisma.$queryRaw = jest.fn()

const TOKEN = 'tok_abcdefghijklmnopqrstuvwx'
const SESSION = 'sessao-12345678'
const url = 'http://localhost:3000/api/public/tutor/curso-1'
const context = { params: Promise.resolve({ courseId: 'curso-1' }) }

function ask(body: Record<string, unknown>, token: string | null = TOKEN) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['x-tutor-token'] = token
  return POST(
    new NextRequest(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ question: 'O que é EPI?', sessionId: SESSION, ...body }),
    }),
    context
  )
}

function counts(session: number, course: number) {
  mockPrisma.$queryRaw
    .mockResolvedValueOnce([{ count: session }])
    .mockResolvedValueOnce([{ count: course }])
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPrisma.$queryRaw.mockReset()
  delete process.env.TUTOR_SESSION_LIMIT_PER_MINUTE
  delete process.env.TUTOR_COURSE_DAILY_LIMIT
  mockPrisma.course.findUnique.mockResolvedValue({ tutorEnabled: true, tutorToken: TOKEN })
  ;(askTutor as jest.Mock).mockResolvedValue({
    answer: 'EPI protege o trabalhador.',
    sources: ['Unidade 1'],
    grounded: true,
  })
})

describe('POST /api/public/tutor/[courseId]', () => {
  it('answers with CORS headers, without sources, when the token and quota are fine', async () => {
    counts(1, 1)

    const res = await ask({})
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
    expect(body).toEqual({ success: true, answer: 'EPI protege o trabalhador.', grounded: true })
    expect(askTutor).toHaveBeenCalledWith('curso-1', 'O que é EPI?')
  })

  it.each([
    ['missing', null],
    ['wrong', 'tok_errado_errado_errado_errado'],
  ])('refuses a %s token without asking', async (_case, token) => {
    const res = await ask({}, token)

    expect(res.status).toBe(401)
    expect(res.headers.get('access-control-allow-origin')).toBe('*')
    expect(askTutor).not.toHaveBeenCalled()
  })

  it('refuses a course without a token even when the header is empty', async () => {
    mockPrisma.course.findUnique.mockResolvedValue({ tutorEnabled: true, tutorToken: null })

    expect((await ask({}, '')).status).toBe(401)
  })

  it('refuses a course with the tutor turned off', async () => {
    mockPrisma.course.findUnique.mockResolvedValue({ tutorEnabled: false, tutorToken: TOKEN })

    expect((await ask({})).status).toBe(403)
    expect(askTutor).not.toHaveBeenCalled()
  })

  it.each([
    ['an empty question', { question: '  ' }],
    ['an invalid session id', { sessionId: 'x' }],
  ])('refuses %s', async (_case, body) => {
    expect((await ask(body)).status).toBe(400)
    expect(askTutor).not.toHaveBeenCalled()
  })

  it('limits questions per session and minute, with Retry-After', async () => {
    counts(sessionLimitPerMinute() + 1, 1)

    const res = await ask({})

    expect(res.status).toBe(429)
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0)
    expect((await res.json()).error).toMatch(/Aguarde/)
    expect(askTutor).not.toHaveBeenCalled()
  })

  it('caps the questions per course and day', async () => {
    counts(1, courseDailyLimit() + 1)

    const res = await ask({})

    expect(res.status).toBe(429)
    expect((await res.json()).error).toMatch(/limite de perguntas de hoje/)
  })

  it('reads the limits from the environment', async () => {
    process.env.TUTOR_SESSION_LIMIT_PER_MINUTE = '2'
    counts(3, 1)

    expect((await ask({})).status).toBe(429)
  })

  it('answers the CORS preflight', () => {
    const res = OPTIONS()

    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-headers')).toContain('x-tutor-token')
  })

  it('returns 503 when the tutor fails', async () => {
    counts(1, 1)
    ;(askTutor as jest.Mock).mockRejectedValue(new Error('Gemini 500'))

    expect((await ask({})).status).toBe(503)
  })
})

describe('consumeTutorQuota', () => {
  it('counts the session per minute and the course per day', async () => {
    counts(1, 1)

    await expect(
      consumeTutorQuota('curso-1', SESSION, new Date('2026-09-19T12:00:30Z'))
    ).resolves.toEqual({
      allowed: true,
    })

    const [sessionKey, courseKey] = mockPrisma.$queryRaw.mock.calls.map((call) => call[1])
    expect(sessionKey).toMatch(/^session:curso-1:sessao-12345678:\d+$/)
    expect(courseKey).toMatch(/^course:curso-1:\d+$/)
  })
})

describe('tokensMatch', () => {
  it('compares tokens safely and refuses empty values', () => {
    expect(tokensMatch(TOKEN, TOKEN)).toBe(true)
    expect(tokensMatch(TOKEN, TOKEN.slice(0, -1))).toBe(false)
    expect(tokensMatch(null, TOKEN)).toBe(false)
    expect(tokensMatch(TOKEN, null)).toBe(false)
  })
})

describe('POST /api/courses/[id]/tutor-token', () => {
  async function as(userId: string, role: string) {
    mockPrisma.user.findUnique.mockResolvedValue({ id: userId, name: 'X', role })
    mockPrisma.course.findUnique.mockResolvedValue({
      id: 'curso-1',
      ownerId: 'user-dono',
      owner: null,
    })
    mockPrisma.courseCollaborator.findUnique.mockResolvedValue(null)
    const token = await new SignJWT({ id: userId, email: 'x@senai.br', name: 'X', role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET))
    return { Cookie: `auth-token=${token}` }
  }

  function call(headers: Record<string, string>) {
    return regenerate(
      new NextRequest('http://localhost:3000/api/courses/curso-1/tutor-token', {
        method: 'POST',
        headers,
      }),
      { params: Promise.resolve({ id: 'curso-1' }) }
    )
  }

  it('lets the owner generate a new token', async () => {
    const res = await call(await as('user-dono', 'CONTENT_AUTHOR'))

    expect(res.status).toBe(200)
    const { data } = mockPrisma.course.update.mock.calls[0][0]
    expect(data.tutorToken).toMatch(/^[A-Za-z0-9_-]{32}$/)
    expect(JSON.stringify(await res.json())).not.toContain(data.tutorToken)
  })

  it.each(['MANAGER', 'REVIEWER', 'GUEST'])('refuses %s', async (role) => {
    expect((await call(await as(`user-${role}`, role))).status).toBe(403)
    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })
})
