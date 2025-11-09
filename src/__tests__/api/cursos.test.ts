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
import { GET as listCursosHandler, POST as createCursoHandler, PUT as updateCursoHandler, DELETE as deleteCursoHandler } from '@/app/api/cursos/route'
import { GET as getCursoByIdHandler } from '@/app/api/cursos/[id]/route'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'

// Mock do prisma já está configurado no jest.setup.js
const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Helper para criar token de autenticação
async function createAuthToken(userId: string = '1') {
  const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
  return await new SignJWT({ id: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

describe('API - Cursos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/cursos', () => {
    it('deve listar cursos com paginação', async () => {
      // Arrange
      const mockCursos = [
        {
          id: '1',
          titulo: 'Curso 1',
          descricao: 'Descrição 1',
          cargaHoraria: '40h',
          modalidade: 'Online',
          categoria: 'Tecnologia',
          unidades: [],
          dataCriacao: new Date(),
          dataModificacao: new Date(),
        },
        {
          id: '2',
          titulo: 'Curso 2',
          descricao: 'Descrição 2',
          cargaHoraria: '60h',
          modalidade: 'Presencial',
          categoria: 'Gestão',
          unidades: [],
          dataCriacao: new Date(),
          dataModificacao: new Date(),
        },
      ]

      mockPrisma.curso.count.mockResolvedValue(2)
      mockPrisma.curso.findMany.mockResolvedValue(mockCursos)

      const request = new NextRequest('http://localhost:3000/api/cursos?page=1&limit=6')

      // Act
      const response = await listCursosHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.cursos).toHaveLength(2)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 6,
        total: 2,
        totalPages: 1,
      })

      // Verificar que foi chamado apenas uma vez (sem duplicação)
      expect(mockPrisma.curso.findMany).toHaveBeenCalledTimes(1)
      expect(mockPrisma.curso.count).toHaveBeenCalledTimes(1)
    })

    it('deve filtrar cursos por busca, categoria e modalidade', async () => {
      // Arrange
      const mockCursos = [
        {
          id: '1',
          titulo: 'JavaScript Avançado',
          descricao: 'Curso avançado',
          cargaHoraria: '40h',
          modalidade: 'Online',
          categoria: 'Tecnologia',
          unidades: [],
          dataCriacao: new Date(),
          dataModificacao: new Date(),
        },
      ]

      mockPrisma.curso.count.mockResolvedValue(1)
      mockPrisma.curso.findMany.mockResolvedValue(mockCursos)

      const request = new NextRequest(
        'http://localhost:3000/api/cursos?page=1&limit=6&search=JavaScript&category=Tecnologia&modality=Online'
      )

      // Act
      const response = await listCursosHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.cursos).toHaveLength(1)
      expect(mockPrisma.curso.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoria: 'Tecnologia',
            modalidade: 'Online',
            OR: expect.any(Array),
          }),
        })
      )
    })
  })

  describe('GET /api/cursos/[id]', () => {
    it('deve buscar curso por ID', async () => {
      // Arrange
      const mockCurso = {
        id: '1',
        titulo: 'Curso Teste',
        descricao: 'Descrição teste',
        cargaHoraria: '40h',
        modalidade: 'Online',
        categoria: 'Tecnologia',
        unidades: [],
        dataCriacao: new Date(),
        dataModificacao: new Date(),
      }

      mockPrisma.curso.findUnique.mockResolvedValue(mockCurso)

      const request = new NextRequest('http://localhost:3000/api/cursos/1')

      // Act
      const response = await getCursoByIdHandler(request, {
        params: Promise.resolve({ id: '1' })
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.curso.id).toBe('1')

      // Verificar que foi chamado apenas uma vez
      expect(mockPrisma.curso.findUnique).toHaveBeenCalledTimes(1)
    })

    it('deve retornar 404 se curso não existir', async () => {
      // Arrange
      mockPrisma.curso.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/cursos/999')

      // Act
      const response = await getCursoByIdHandler(request, {
        params: Promise.resolve({ id: '999' })
      })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Curso não encontrado')
    })
  })

  describe('POST /api/cursos', () => {
    it('deve criar curso com autenticação válida', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        usuario: 'testuser',
        senha: 'hashed',
        nome: 'Test User',
        cargo: 'Desenvolvedor',
        dataCriacao: new Date(),
      }

      const mockCurso = {
        id: '1',
        titulo: 'Novo Curso',
        descricao: 'Descrição do novo curso',
        cargaHoraria: '40h',
        modalidade: 'Online',
        categoria: 'Tecnologia',
        unidades: [],
        dataCriacao: new Date(),
        dataModificacao: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.curso.create.mockResolvedValue(mockCurso)

      const request = new NextRequest('http://localhost:3000/api/cursos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${token}`,
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
      expect(data.curso.titulo).toBe('Novo Curso')
      expect(mockPrisma.curso.create).toHaveBeenCalledTimes(1)
    })

    it('deve retornar 401 sem autenticação', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/cursos', {
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
      expect(mockPrisma.curso.create).not.toHaveBeenCalled()
    })

    it('deve retornar 400 com campos obrigatórios faltando', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        usuario: 'testuser',
        senha: 'hashed',
        nome: 'Test User',
        cargo: 'Desenvolvedor',
        dataCriacao: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/cursos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${token}`,
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

  describe('PUT /api/cursos', () => {
    it('deve atualizar curso com autenticação válida', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        usuario: 'testuser',
        senha: 'hashed',
        nome: 'Test User',
        cargo: 'Desenvolvedor',
        dataCriacao: new Date(),
      }

      const mockCurso = {
        id: '1',
        titulo: 'Curso Atualizado',
        descricao: 'Descrição atualizada',
        cargaHoraria: '60h',
        modalidade: 'Online',
        categoria: 'Tecnologia',
        unidades: [],
        dataCriacao: new Date(),
        dataModificacao: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.curso.update.mockResolvedValue(mockCurso)

      const request = new NextRequest('http://localhost:3000/api/cursos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${token}`,
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
      expect(data.curso.titulo).toBe('Curso Atualizado')
      expect(mockPrisma.curso.update).toHaveBeenCalledTimes(1)
    })

    it('deve retornar 401 sem autenticação', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/cursos', {
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
      expect(mockPrisma.curso.update).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/cursos', () => {
    it('deve deletar curso com autenticação válida', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        usuario: 'testuser',
        senha: 'hashed',
        nome: 'Test User',
        cargo: 'Desenvolvedor',
        dataCriacao: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.curso.delete.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/cursos?id=1', {
        method: 'DELETE',
        headers: {
          Cookie: `token=${token}`,
        },
      })

      // Act
      const response = await deleteCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.curso.delete).toHaveBeenCalledTimes(1)
    })

    it('deve retornar 401 sem autenticação', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/cursos?id=1', {
        method: 'DELETE',
      })

      // Act
      const response = await deleteCursoHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(mockPrisma.curso.delete).not.toHaveBeenCalled()
    })
  })
})
