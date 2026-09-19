/**
 * @jest-environment node
 */
import { NextRequest, after } from 'next/server'
import { SignJWT } from 'jose'
import { PUT } from '@/app/api/courses/route'
import { prisma } from '@/lib/prisma'
import { reindexCourseContent } from '@/lib/tutor/knowledge'

jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  after: jest.fn(),
}))

jest.mock('@/lib/tutor/knowledge', () => ({
  reindexCourseContent: jest.fn().mockResolvedValue('indexed'),
}))

const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock }
  course: { findUnique: jest.Mock; update: jest.Mock }
  courseCollaborator: { findUnique: jest.Mock }
  activity: { create: jest.Mock }
}

const OWNER_ID = 'user-dono'
const units = [{ id: 'u1', title: 'Unidade', description: '', order: 0, blocks: [] }]

function storedCourse(tutorEnabled: boolean) {
  return {
    id: 'curso-1',
    title: 'Curso',
    description: 'Desc',
    workload: '20h',
    modality: 'Online',
    category: 'Tecnologia',
    layout: 'classic',
    slug: 'curso',
    units,
    status: 'IN_PROGRESS',
    version: 0,
    ownerId: OWNER_ID,
    tutorEnabled,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

async function save(
  { userId, role }: { userId: string; role: string },
  stored: boolean,
  body: Record<string, unknown>,
  tutorToken: string | null = null
) {
  mockPrisma.user.findUnique.mockResolvedValue({ id: userId, name: 'X', role })
  mockPrisma.course.findUnique.mockResolvedValue({ ...storedCourse(stored), tutorToken })
  mockPrisma.course.update.mockImplementation(async ({ data }) => ({
    ...storedCourse(stored),
    ...(typeof data.tutorEnabled === 'boolean' && { tutorEnabled: data.tutorEnabled }),
  }))

  const token = await new SignJWT({ id: userId, email: 'x@senai.br', name: 'X', role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET))

  const res = await PUT(
    new NextRequest('http://localhost:3000/api/courses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: `auth-token=${token}` },
      body: JSON.stringify({ id: 'curso-1', ...body }),
    })
  )

  for (const [task] of (after as jest.Mock).mock.calls) {
    await task()
  }

  return { res, data: mockPrisma.course.update.mock.calls[0]?.[0]?.data }
}

const owner = { userId: OWNER_ID, role: 'CONTENT_AUTHOR' }
const manager = { userId: 'user-gestor', role: 'MANAGER' }

beforeEach(() => {
  jest.clearAllMocks()
  mockPrisma.activity.create.mockResolvedValue({})
})

describe('PUT /api/courses — Tutor IA setting', () => {
  it('lets the owner turn the tutor on and indexes the course right away', async () => {
    const { res, data } = await save(owner, false, { tutorEnabled: true })

    expect(res.status).toBe(200)
    expect(data.tutorEnabled).toBe(true)
    expect(reindexCourseContent).toHaveBeenCalledWith('curso-1', units)
  })

  it('creates the package access token the first time the tutor is turned on', async () => {
    const { data } = await save(owner, false, { tutorEnabled: true })

    expect(data.tutorToken).toMatch(/^[A-Za-z0-9_-]{32}$/)
  })

  it('issues a new access token when the tutor is turned on again, cutting off old packages', async () => {
    const { data } = await save(owner, false, { tutorEnabled: true }, 'antigo')

    expect(data.tutorEnabled).toBe(true)
    expect(data.tutorToken).toMatch(/^[A-Za-z0-9_-]{32}$/)
    expect(data.tutorToken).not.toBe('antigo')
  })

  it('keeps the access token when the tutor stays on', async () => {
    const { data } = await save(owner, true, { units }, 'atual')

    expect(data.tutorToken).toBeUndefined()
  })

  it('refuses a MANAGER turning the tutor on, even though a MANAGER edits the course', async () => {
    const { res } = await save(manager, false, { tutorEnabled: true })

    expect(res.status).toBe(403)
    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })

  it('lets a MANAGER save other settings when the tutor value did not change', async () => {
    const { res, data } = await save(manager, true, { title: 'Novo', tutorEnabled: true })

    expect(res.status).toBe(200)
    expect(data.tutorEnabled).toBeUndefined()
  })

  it('does not reindex a saved course while the tutor is off', async () => {
    await save(owner, false, { units })

    expect(reindexCourseContent).not.toHaveBeenCalled()
  })

  it('reindexes a saved course while the tutor is on', async () => {
    await save(owner, true, { units })

    expect(reindexCourseContent).toHaveBeenCalledTimes(1)
  })

  it('turning the tutor off does not reindex', async () => {
    const { data } = await save(owner, true, { tutorEnabled: false })

    expect(data.tutorEnabled).toBe(false)
    expect(reindexCourseContent).not.toHaveBeenCalled()
  })
})
