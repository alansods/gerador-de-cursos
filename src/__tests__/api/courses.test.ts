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

// Mock do prisma já está configurado no jest.setup.js
const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Helper para criar token de autenticação
async function createAuthToken(userId: string = '1', role: string = 'ADMIN') {
  const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
  return await new SignJWT({
    id: userId,
    email: 'testuser@senai.br',
    nome: 'Test User',
    cargo: 'Administrador',
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

// `requireAuth` relê o papel do banco a cada requisição, então todo teste
// autenticado precisa do usuário correspondente ao token
const authenticatedUser = {
  id: '1',
  email: 'testuser@senai.br',
  password: 'hashed',
  name: 'Test User',
  cargo: 'Administrador',
  role: 'ADMIN',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('API - Cursos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.user.findUnique.mockResolvedValue(authenticatedUser as never)
  })

  describe('GET /api/courses', () => {
    it('deve listar cursos com paginação', async () => {
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
          layout: 'classico',
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
          layout: 'classico',
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

      // Verificar que foi chamado apenas uma vez (sem duplicação)
      expect(mockPrisma.course.findMany).toHaveBeenCalledTimes(1)
      expect(mockPrisma.course.count).toHaveBeenCalledTimes(1)
    })

    it('deve filtrar cursos por busca, categoria e modalidade', async () => {
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
          layout: 'classico',
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
    it('deve buscar curso por ID', async () => {
      // Arrange
      const mockCourse = {
        id: '1',
        title: 'Curso Teste',
        description: 'Descrição teste',
        workload: '40h',
        modality: 'Online',
        category: 'Tecnologia',
        units: [],
        layout: 'classico',
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

      // Verificar que foi chamado apenas uma vez
      expect(mockPrisma.course.findFirst).toHaveBeenCalledTimes(1)
    })

    it('deve retornar 404 se curso não existir', async () => {
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
    it('deve criar curso com autenticação válida', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        password: 'hashed',
        name: 'Test User',
        cargo: 'Desenvolvedor',
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
        layout: 'classico',
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
          titulo: 'Novo Curso',
          descricao: 'Descrição do novo curso',
          cargaHoraria: '40h',
          modalidade: 'Online',
          categoria: 'Tecnologia',
          unidades: [],
        }),
      })

      // Act
      const response = await createCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.course.titulo).toBe('Novo Curso')
      expect(mockPrisma.course.create).toHaveBeenCalledTimes(1)
    })

    it('deve retornar 401 sem autenticação', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: 'Novo Curso',
          descricao: 'Descrição',
          cargaHoraria: '40h',
          modalidade: 'Online',
          categoria: 'Tecnologia',
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

    it('deve usar o papel do banco, não o do token, quando o admin rebaixa o usuário', async () => {
      // Arrange: token emitido enquanto o usuário ainda era ADMIN,
      // mas o banco já registra o rebaixamento para REVIEWER
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
          titulo: 'Curso Proibido',
          descricao: 'Não deve ser criado',
          cargaHoraria: '40h',
          modalidade: 'Online',
          categoria: 'Tecnologia',
          unidades: [],
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

    it('deve retornar 401 quando o usuário do token não existe mais no banco', async () => {
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
          titulo: 'Curso Órfão',
          descricao: 'Autor removido',
          cargaHoraria: '40h',
          modalidade: 'Online',
          categoria: 'Tecnologia',
          unidades: [],
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

    it('deve retornar 400 com campos obrigatórios faltando', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        password: 'hashed',
        name: 'Test User',
        cargo: 'Desenvolvedor',
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
          titulo: '',
          descricao: '',
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
        layout: 'classico',
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
        body: JSON.stringify({ id: '1', titulo: 'Curso Editado', version: 0 }),
      })

      const res = await updateCursoHandler(request)
      return { res, dados: mockPrisma.course.update.mock.calls[0]?.[0]?.data }
    }

    it('devolve curso APPROVED para IN_PROGRESS e limpa a revisão ao editar', async () => {
      const { res, dados: data } = await update('APPROVED')

      expect(res.status).toBe(200)
      expect(data.status).toBe('IN_PROGRESS')
      expect(data.reviewedById).toBeNull()
      expect(data.reviewedAt).toBeNull()
    })

    it('devolve curso REJECTED para IN_PROGRESS ao editar', async () => {
      const { dados: data } = await update('REJECTED')

      expect(data.status).toBe('IN_PROGRESS')
    })

    it('não mexe no status de um curso IN_PROGRESS', async () => {
      const { dados: data } = await update('IN_PROGRESS')

      expect(data.status).toBeUndefined()
    })

    it('não mexe no status de um curso IN_REVIEW', async () => {
      const { dados: data } = await update('IN_REVIEW')

      expect(data.status).toBeUndefined()
    })

    it('deve atualizar curso com autenticação válida', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        password: 'hashed',
        name: 'Test User',
        cargo: 'Desenvolvedor',
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
        layout: 'classico',
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
          titulo: 'Curso Atualizado',
          cargaHoraria: '60h',
        }),
      })

      // Act
      const response = await updateCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.course.titulo).toBe('Curso Atualizado')
      expect(mockPrisma.course.update).toHaveBeenCalledTimes(1)
    })

    it('deve retornar 401 sem autenticação', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: '1',
          titulo: 'Curso Atualizado',
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

  describe('DELETE /api/courses', () => {
    it('deve deletar curso com autenticação válida', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        password: 'hashed',
        name: 'Test User',
        cargo: 'Desenvolvedor',
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

    it('deve retornar 401 sem autenticação', async () => {
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
  })
})
