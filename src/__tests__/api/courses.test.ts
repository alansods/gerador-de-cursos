/**
 * @jest-environment node
 */
/**
 * Testes de API - Cursos
 *
 * Testa os endpoints de cursos:
 * - GET /api/cursos (listar com paginação)
 * - GET /api/cursos/[id] (buscar por ID)
 * - POST /api/cursos (criar)
 * - PUT /api/cursos (atualizar)
 * - DELETE /api/cursos (deletar)
 */

import { NextRequest } from 'next/server'
import {
  GET as listCursosHandler,
  POST as createCursoHandler,
  PUT as updateCursoHandler,
  DELETE as deleteCursoHandler,
} from '@/app/api/courses/route'
import { GET as getCursoByIdHandler } from '@/app/api/courses/[id]/route'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  after: jest.fn(),
}))

// Mock do prisma já está configurado no jest.setup.js
const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Builds an authentication token
async function createAuthToken(userId: string = '1', role: string = 'ADMIN') {
  const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
  return await new SignJWT({
    id: userId,
    email: 'testuser@senai.br',
    name: 'Test User',
    role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

async function authHeaders(role: string = 'ADMIN') {
  const token = await createAuthToken('1', role)
  return { 'Content-Type': 'application/json', Cookie: `auth-token=${token}` }
}

// `requireAuth` re-reads the role from the database on every request, so every test
// authenticated test needs the user matching the token
const authenticatedUser = {
  id: '1',
  email: 'testuser@senai.br',
  password: 'hashed',
  name: 'Test User',
  role: 'ADMIN',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('API - Courses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.user.findUnique.mockResolvedValue(authenticatedUser as never)
  })

  describe('GET /api/courses', () => {
    it('lists courses with pagination', async () => {
      // Arrange
      const mockCourses = [
        {
          id: '1',
          title: 'Curso 1',
          description: 'Descrição 1',
          workload: '40h',
          modality: 'Online',
          category: 'Tecnologia',
          units: [],
          layout: 'classic',
          slug: null,
          status: 'IN_PROGRESS',
          version: 0,
          ownerId: '1',
          owner: { id: '1', name: 'Test User' },
          reviewedById: null,
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Curso 2',
          description: 'Descrição 2',
          workload: '60h',
          modality: 'Presencial',
          category: 'Gestão',
          units: [],
          layout: 'classic',
          slug: null,
          status: 'IN_PROGRESS',
          version: 0,
          ownerId: '1',
          owner: { id: '1', name: 'Test User' },
          reviewedById: null,
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrisma.course.count.mockResolvedValue(2)
      mockPrisma.course.findMany.mockResolvedValue(mockCourses)

      const request = new NextRequest('http://localhost:3000/api/courses?page=1&limit=6', {
        headers: await authHeaders(),
      })

      // Act
      const response = await listCursosHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.courses).toHaveLength(2)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 6,
        total: 2,
        totalPages: 1,
      })

      // Assert a single call, with no duplication
      expect(mockPrisma.course.findMany).toHaveBeenCalledTimes(1)
      expect(mockPrisma.course.count).toHaveBeenCalledTimes(1)
    })

    it('filters courses by search, category and modality', async () => {
      // Arrange
      const mockCourses = [
        {
          id: '1',
          title: 'JavaScript Avançado',
          description: 'Curso avançado',
          workload: '40h',
          modality: 'Online',
          category: 'Tecnologia',
          units: [],
          layout: 'classic',
          slug: null,
          status: 'IN_PROGRESS',
          version: 0,
          ownerId: '1',
          owner: { id: '1', name: 'Test User' },
          reviewedById: null,
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrisma.course.count.mockResolvedValue(1)
      mockPrisma.course.findMany.mockResolvedValue(mockCourses)

      const request = new NextRequest(
        'http://localhost:3000/api/courses?page=1&limit=6&search=JavaScript&category=Tecnologia&modality=Online',
        { headers: await authHeaders() }
      )

      // Act
      const response = await listCursosHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.courses).toHaveLength(1)
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Tecnologia',
            modality: 'Online',
            OR: expect.any(Array),
          }),
        })
      )
    })
  })

  describe('GET /api/courses/[id]', () => {
    it('fetches a course by id', async () => {
      // Arrange
      const mockCourse = {
        id: '1',
        title: 'Curso Teste',
        description: 'Descrição teste',
        workload: '40h',
        modality: 'Online',
        category: 'Tecnologia',
        units: [],
        layout: 'classic',
        slug: null,
        status: 'IN_PROGRESS',
        version: 0,
        ownerId: '1',
        owner: { id: '1', name: 'Test User' },
        collaborators: [],
        reviewedById: null,
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.course.findFirst.mockResolvedValue(mockCourse)

      const request = new NextRequest('http://localhost:3000/api/courses/1', {
        headers: await authHeaders(),
      })

      // Act
      const response = await getCursoByIdHandler(request, {
        params: Promise.resolve({ id: '1' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.course.id).toBe('1')

      // Assert a single call
      expect(mockPrisma.course.findFirst).toHaveBeenCalledTimes(1)
    })

    it('reads the user collaboration in the same query as the course', async () => {
      ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...authenticatedUser,
        role: 'CONTENT_AUTHOR',
      } as never)
      ;(mockPrisma.course.findFirst as jest.Mock).mockResolvedValue({
        id: 'c1',
        title: 'Curso de outra pessoa',
        description: '',
        workload: '',
        modality: 'Online',
        category: '',
        units: [],
        slug: 'curso',
        status: 'IN_PROGRESS',
        version: 0,
        ownerId: 'someone-else',
        owner: { id: 'someone-else', name: 'Outra' },
        collaborators: [{ id: 'collab-1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const response = await getCursoByIdHandler(
        new NextRequest('http://localhost:3000/api/courses/curso', {
          headers: await authHeaders('CONTENT_AUTHOR'),
        }),
        { params: Promise.resolve({ id: 'curso' }) }
      )
      const data = await response.json()

      expect(data.course.permissions.canEdit).toBe(true)
      expect(mockPrisma.course.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            collaborators: { where: { userId: '1' }, select: { id: true } },
          }),
        })
      )
      expect(mockPrisma.courseCollaborator.findUnique).not.toHaveBeenCalled()
      expect(data.course).not.toHaveProperty('collaborators')
    })

    it('returns 404 when the course does not exist', async () => {
      // Arrange
      mockPrisma.course.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/courses/999', {
        headers: await authHeaders(),
      })

      // Act
      const response = await getCursoByIdHandler(request, {
        params: Promise.resolve({ id: '999' }),
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Curso não encontrado')
    })
  })

  describe('POST /api/courses', () => {
    it('creates a course with a valid session', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        password: 'hashed',
        name: 'Test User',
        role: 'ADMIN',
        createdAt: new Date(),
      }

      const mockCourse = {
        id: '1',
        title: 'Novo Curso',
        description: 'Descrição do novo curso',
        workload: '40h',
        modality: 'Online',
        category: 'Tecnologia',
        units: [],
        layout: 'classic',
        slug: null,
        status: 'IN_PROGRESS',
        version: 0,
        ownerId: '1',
        owner: { id: '1', name: 'Test User' },
        reviewedById: null,
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.course.create.mockResolvedValue(mockCourse)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `auth-token=${token}`,
        },
        body: JSON.stringify({
          title: 'Novo Curso',
          description: 'Descrição do novo curso',
          workload: '40h',
          modality: 'Online',
          category: 'Tecnologia',
          units: [],
        }),
      })

      // Act
      const response = await createCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.course.title).toBe('Novo Curso')
      expect(mockPrisma.course.create).toHaveBeenCalledTimes(1)
    })

    it('returns 401 without authentication', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Novo Curso',
          description: 'Descrição',
          workload: '40h',
          modality: 'Online',
          category: 'Tecnologia',
        }),
      })

      // Act
      const response = await createCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(mockPrisma.course.create).not.toHaveBeenCalled()
    })

    it('uses the role from the database, not the token, after an admin demotes the user', async () => {
      // Arrange: token issued while the user was still ADMIN,
      // while the database already records the demotion to REVIEWER
      const token = await createAuthToken('1', 'ADMIN')

      mockPrisma.user.findUnique.mockResolvedValue({
        ...authenticatedUser,
        role: 'REVIEWER',
      } as never)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `auth-token=${token}`,
        },
        body: JSON.stringify({
          title: 'Curso Proibido',
          description: 'Não deve ser criado',
          workload: '40h',
          modality: 'Online',
          category: 'Tecnologia',
          units: [],
        }),
      })

      // Act
      const response = await createCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(mockPrisma.course.create).not.toHaveBeenCalled()
    })

    it('returns 401 when the token user no longer exists', async () => {
      // Arrange
      const token = await createAuthToken()

      mockPrisma.user.findUnique.mockResolvedValue(null as never)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `auth-token=${token}`,
        },
        body: JSON.stringify({
          title: 'Curso Órfão',
          description: 'Autor removido',
          workload: '40h',
          modality: 'Online',
          category: 'Tecnologia',
          units: [],
        }),
      })

      // Act
      const response = await createCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(mockPrisma.course.create).not.toHaveBeenCalled()
    })

    it('returns 400 when a required field is missing', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        password: 'hashed',
        name: 'Test User',
        role: 'ADMIN',
        createdAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `auth-token=${token}`,
        },
        body: JSON.stringify({
          title: '',
          description: '',
        }),
      })

      // Act
      const response = await createCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing required fields')
    })
  })

  describe('PUT /api/courses', () => {
    async function update(currentStatus: string) {
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        password: 'hashed',
        name: 'Test User',
        role: 'ADMIN',
        createdAt: new Date(),
      }
      const mockCourse = {
        id: '1',
        title: 'Curso',
        description: 'Desc',
        workload: '60h',
        modality: 'Online',
        category: 'Tecnologia',
        units: [],
        layout: 'classic',
        slug: null,
        status: currentStatus,
        version: 0,
        ownerId: '1',
        owner: { id: '1', name: 'Test User' },
        reviewedById: 'revisor-1',
        reviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as never)
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse as never)
      mockPrisma.course.update.mockResolvedValue(mockCourse as never)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: `auth-token=${token}` },
        body: JSON.stringify({ id: '1', title: 'Curso Editado', version: 0 }),
      })

      const res = await updateCursoHandler(request)
      return { res, dados: mockPrisma.course.update.mock.calls[0]?.[0]?.data }
    }

    it('sends an APPROVED course back to IN_PROGRESS and clears the review on edit', async () => {
      const { res, dados: data } = await update('APPROVED')

      expect(res.status).toBe(200)
      expect(data.status).toBe('IN_PROGRESS')
      expect(data.reviewedById).toBeNull()
      expect(data.reviewedAt).toBeNull()
    })

    it('sends a REJECTED course back to IN_PROGRESS on edit', async () => {
      const { dados: data } = await update('REJECTED')

      expect(data.status).toBe('IN_PROGRESS')
    })

    it('leaves an IN_PROGRESS course status alone', async () => {
      const { dados: data } = await update('IN_PROGRESS')

      expect(data.status).toBeUndefined()
    })

    it('leaves an IN_REVIEW course status alone', async () => {
      const { dados: data } = await update('IN_REVIEW')

      expect(data.status).toBeUndefined()
    })

    it('updates a course with a valid session', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        password: 'hashed',
        name: 'Test User',
        role: 'ADMIN',
        createdAt: new Date(),
      }

      const mockCourse = {
        id: '1',
        title: 'Curso Atualizado',
        description: 'Descrição atualizada',
        workload: '60h',
        modality: 'Online',
        category: 'Tecnologia',
        units: [],
        layout: 'classic',
        slug: null,
        status: 'IN_PROGRESS',
        version: 0,
        ownerId: '1',
        owner: { id: '1', name: 'Test User' },
        reviewedById: null,
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse)
      mockPrisma.course.update.mockResolvedValue(mockCourse)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `auth-token=${token}`,
        },
        body: JSON.stringify({
          id: '1',
          title: 'Curso Atualizado',
          workload: '60h',
        }),
      })

      // Act
      const response = await updateCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.course.title).toBe('Curso Atualizado')
      expect(mockPrisma.course.update).toHaveBeenCalledTimes(1)
    })

    it('returns 401 without authentication', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: '1',
          title: 'Curso Atualizado',
        }),
      })

      // Act
      const response = await updateCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(mockPrisma.course.update).not.toHaveBeenCalled()
    })
  })

  describe('course objectives', () => {
    const storedCourse = {
      id: '1',
      title: 'Curso',
      description: 'Desc',
      workload: '40h',
      modality: 'Online',
      category: 'Tecnologia',
      units: [],
      layout: 'video-lessons',
      objectives: ['Criar uma API'],
      slug: null,
      status: 'IN_PROGRESS',
      version: 0,
      ownerId: '1',
      owner: { id: '1', name: 'Test User' },
      reviewedById: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('stores the cleaned objectives list on create and returns it', async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce(null as never)
      mockPrisma.course.create.mockResolvedValueOnce(storedCourse as never)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          title: 'Curso',
          description: 'Desc',
          workload: '40h',
          modality: 'Online',
          category: 'Tecnologia',
          units: [],
          objectives: ['  Criar uma API  ', '', 42, 'x'.repeat(200)],
        }),
      })

      const response = await createCursoHandler(request)
      const data = await response.json()
      const saved = mockPrisma.course.create.mock.calls[0][0].data

      expect(response.status).toBe(201)
      expect(saved.objectives).toEqual(['Criar uma API', 'x'.repeat(160)])
      expect(data.course.objectives).toEqual(['Criar uma API'])
    })

    it('defaults to an empty list on create when none is sent', async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce(null as never)
      mockPrisma.course.create.mockResolvedValueOnce(storedCourse as never)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          title: 'Curso',
          description: 'Desc',
          workload: '40h',
          modality: 'Online',
          category: 'Tecnologia',
          units: [],
        }),
      })

      await createCursoHandler(request)

      expect(mockPrisma.course.create.mock.calls[0][0].data.objectives).toEqual([])
    })

    it('updates objectives only when they are sent', async () => {
      const send = async (body: Record<string, unknown>) => {
        mockPrisma.course.findUnique.mockResolvedValueOnce(storedCourse as never)
        mockPrisma.course.update.mockResolvedValueOnce(storedCourse as never)
        const request = new NextRequest('http://localhost:3000/api/courses', {
          method: 'PUT',
          headers: await authHeaders(),
          body: JSON.stringify({ id: '1', version: 0, ...body }),
        })
        await updateCursoHandler(request)
        return mockPrisma.course.update.mock.calls.at(-1)?.[0]?.data
      }

      expect((await send({ objectives: ['Um', 'Dois'] })).objectives).toEqual(['Um', 'Dois'])
      expect((await send({ title: 'Outro' })).objectives).toBeUndefined()
    })

    it('cuts a lesson description longer than the limit when saving units', async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce(storedCourse as never)
      mockPrisma.course.update.mockResolvedValueOnce(storedCourse as never)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'PUT',
        headers: await authHeaders(),
        body: JSON.stringify({
          id: '1',
          version: 0,
          units: [
            {
              id: 'u1',
              title: 'Módulo',
              blocks: [
                { id: 'b1', type: 'video', videoTitle: 'Aula', videoDescription: 'a'.repeat(2500) },
              ],
            },
          ],
        }),
      })

      await updateCursoHandler(request)
      const saved = mockPrisma.course.update.mock.calls[0][0].data.units as {
        blocks: { videoDescription: string }[]
      }[]

      expect(saved[0].blocks[0].videoDescription).toHaveLength(2000)
    })
  })

  describe('video lessons layout blocks', () => {
    const paragraphUnit = {
      id: 'u1',
      title: 'Módulo',
      blocks: [{ id: 'p1', type: 'paragraph', content: 'Texto' }],
    }
    const courseIn = (layout: string) => ({
      id: '1',
      title: 'Curso',
      description: 'Desc',
      workload: '40h',
      modality: 'Online',
      category: 'Tecnologia',
      units: [paragraphUnit],
      layout,
      slug: 'curso',
      status: 'IN_PROGRESS',
      version: 0,
      ownerId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    it('refuses to create a video lessons course with a paragraph', async () => {
      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          title: 'Curso',
          description: 'Desc',
          workload: '40h',
          modality: 'Online',
          category: 'Tecnologia',
          layout: 'video-lessons',
          units: [paragraphUnit],
        }),
      })

      const response = await createCursoHandler(request)

      expect(response.status).toBe(400)
      expect(mockPrisma.course.create).not.toHaveBeenCalled()
    })

    it('refuses to save a paragraph into a video lessons course', async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce(courseIn('video-lessons') as never)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'PUT',
        headers: await authHeaders(),
        body: JSON.stringify({ id: '1', version: 0, units: [paragraphUnit] }),
      })

      const response = await updateCursoHandler(request)

      expect(response.status).toBe(400)
      expect(mockPrisma.course.update).not.toHaveBeenCalled()
    })

    it('refuses to switch a course with other blocks to video lessons', async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce(courseIn('classic') as never)

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'PUT',
        headers: await authHeaders(),
        body: JSON.stringify({ id: '1', version: 0, layout: 'video-lessons' }),
      })

      const response = await updateCursoHandler(request)

      expect(response.status).toBe(400)
      expect(mockPrisma.course.update).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/courses', () => {
    it('deletes a course with a valid session', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        password: 'hashed',
        name: 'Test User',
        role: 'ADMIN',
        createdAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.course.delete.mockResolvedValue({ id: '1' } as { id: string })

      const request = new NextRequest('http://localhost:3000/api/courses?id=1', {
        method: 'DELETE',
        headers: {
          Cookie: `auth-token=${token}`,
        },
      })

      // Act
      const response = await deleteCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.course.delete).toHaveBeenCalledTimes(1)
    })

    it('returns 401 without authentication', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/courses?id=1', {
        method: 'DELETE',
      })

      // Act
      const response = await deleteCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(mockPrisma.course.delete).not.toHaveBeenCalled()
    })

    describe('bulk delete via body { ids }', () => {
      function makeCourse(id: string, ownerId: string = '1') {
        return {
          id,
          title: `Curso ${id}`,
          description: 'Desc',
          workload: '40h',
          modality: 'Online',
          category: 'Tecnologia',
          units: [],
          layout: 'classic',
          slug: null,
          status: 'IN_PROGRESS',
          version: 0,
          ownerId,
          reviewedById: null,
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      it('deletes every course when the user can delete all of them, logging one activity each', async () => {
        const token = await createAuthToken('1', 'ADMIN')
        const courses = [makeCourse('1'), makeCourse('2')]
        mockPrisma.course.findMany.mockResolvedValue(courses as never)
        mockPrisma.course.deleteMany.mockResolvedValue({ count: 2 } as never)

        const request = new NextRequest('http://localhost:3000/api/courses', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Cookie: `auth-token=${token}` },
          body: JSON.stringify({ ids: ['1', '2'] }),
        })

        const response = await deleteCursoHandler(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.deleted).toBe(2)
        expect(data.notFound).toEqual([])
        expect(mockPrisma.course.deleteMany).toHaveBeenCalledWith({
          where: { id: { in: ['1', '2'] } },
        })
        expect(mockPrisma.activity.create).toHaveBeenCalledTimes(2)
      })

      it('deletes nothing and returns 403 when one course cannot be deleted', async () => {
        const token = await createAuthToken('1', 'CONTENT_AUTHOR')
        mockPrisma.user.findUnique.mockResolvedValue({
          ...authenticatedUser,
          role: 'CONTENT_AUTHOR',
        } as never)
        const ownCourse = makeCourse('1', '1')
        const otherCourse = makeCourse('2', 'other-user')
        mockPrisma.course.findMany.mockResolvedValue([ownCourse, otherCourse] as never)

        const request = new NextRequest('http://localhost:3000/api/courses', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Cookie: `auth-token=${token}` },
          body: JSON.stringify({ ids: ['1', '2'] }),
        })

        const response = await deleteCursoHandler(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.success).toBe(false)
        expect(mockPrisma.course.deleteMany).not.toHaveBeenCalled()
        expect(mockPrisma.activity.create).not.toHaveBeenCalled()
      })

      it('reports missing ids in notFound instead of failing', async () => {
        const token = await createAuthToken('1', 'ADMIN')
        const courses = [makeCourse('1')]
        mockPrisma.course.findMany.mockResolvedValue(courses as never)
        mockPrisma.course.deleteMany.mockResolvedValue({ count: 1 } as never)

        const request = new NextRequest('http://localhost:3000/api/courses', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Cookie: `auth-token=${token}` },
          body: JSON.stringify({ ids: ['1', 'does-not-exist'] }),
        })

        const response = await deleteCursoHandler(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.deleted).toBe(1)
        expect(data.notFound).toEqual(['does-not-exist'])
      })

      it.each([
        ['an empty array', []],
        ['a non-array value', 'not-an-array'],
      ])('returns 400 for %s', async (_label, ids) => {
        const token = await createAuthToken('1', 'ADMIN')

        const request = new NextRequest('http://localhost:3000/api/courses', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Cookie: `auth-token=${token}` },
          body: JSON.stringify({ ids }),
        })

        const response = await deleteCursoHandler(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(mockPrisma.course.deleteMany).not.toHaveBeenCalled()
      })

      it('returns 400 when the batch exceeds the maximum size', async () => {
        const token = await createAuthToken('1', 'ADMIN')
        const ids = Array.from({ length: 101 }, (_, i) => `id-${i}`)

        const request = new NextRequest('http://localhost:3000/api/courses', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Cookie: `auth-token=${token}` },
          body: JSON.stringify({ ids }),
        })

        const response = await deleteCursoHandler(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(mockPrisma.course.findMany).not.toHaveBeenCalled()
      })
    })
  })
})
