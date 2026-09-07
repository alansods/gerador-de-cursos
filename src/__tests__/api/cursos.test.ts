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
} from '@/app/api/cursos/route'
import { GET as getCursoByIdHandler } from '@/app/api/cursos/[id]/route'
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
const usuarioAutenticado = {
  id: '1',
  email: 'testuser@senai.br',
  senha: 'hashed',
  nome: 'Test User',
  cargo: 'Administrador',
  role: 'ADMIN',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('API - Cursos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.user.findUnique.mockResolvedValue(usuarioAutenticado as never)
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
          layout: 'classico',
          slug: null,
          status: 'EM_ANDAMENTO',
          version: 0,
          ownerId: '1',
          owner: { id: '1', nome: 'Test User' },
          revisadoPorId: null,
          revisadoEm: null,
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
          layout: 'classico',
          slug: null,
          status: 'EM_ANDAMENTO',
          version: 0,
          ownerId: '1',
          owner: { id: '1', nome: 'Test User' },
          revisadoPorId: null,
          revisadoEm: null,
          dataCriacao: new Date(),
          dataModificacao: new Date(),
        },
      ]

      mockPrisma.curso.count.mockResolvedValue(2)
      mockPrisma.curso.findMany.mockResolvedValue(mockCursos)

      const request = new NextRequest('http://localhost:3000/api/cursos?page=1&limit=6', {
        headers: await authHeaders(),
      })

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
          layout: 'classico',
          slug: null,
          status: 'EM_ANDAMENTO',
          version: 0,
          ownerId: '1',
          owner: { id: '1', nome: 'Test User' },
          revisadoPorId: null,
          revisadoEm: null,
          dataCriacao: new Date(),
          dataModificacao: new Date(),
        },
      ]

      mockPrisma.curso.count.mockResolvedValue(1)
      mockPrisma.curso.findMany.mockResolvedValue(mockCursos)

      const request = new NextRequest(
        'http://localhost:3000/api/cursos?page=1&limit=6&search=JavaScript&category=Tecnologia&modality=Online',
        { headers: await authHeaders() }
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
        layout: 'classico',
        slug: null,
        status: 'EM_ANDAMENTO',
        version: 0,
        ownerId: '1',
        owner: { id: '1', nome: 'Test User' },
        revisadoPorId: null,
        revisadoEm: null,
        dataCriacao: new Date(),
        dataModificacao: new Date(),
      }

      mockPrisma.curso.findFirst.mockResolvedValue(mockCurso)

      const request = new NextRequest('http://localhost:3000/api/cursos/1', {
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
      expect(data.curso.id).toBe('1')

      // Verificar que foi chamado apenas uma vez
      expect(mockPrisma.curso.findFirst).toHaveBeenCalledTimes(1)
    })

    it('deve retornar 404 se curso não existir', async () => {
      // Arrange
      mockPrisma.curso.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/cursos/999', {
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

  describe('POST /api/cursos', () => {
    it('deve criar curso com autenticação válida', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        senha: 'hashed',
        nome: 'Test User',
        cargo: 'Desenvolvedor',
        role: 'ADMIN',
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
        layout: 'classico',
        slug: null,
        status: 'EM_ANDAMENTO',
        version: 0,
        ownerId: '1',
        owner: { id: '1', nome: 'Test User' },
        revisadoPorId: null,
        revisadoEm: null,
        dataCriacao: new Date(),
        dataModificacao: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.curso.create.mockResolvedValue(mockCurso)

      const request = new NextRequest('http://localhost:3000/api/cursos', {
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

    it('deve usar o papel do banco, não o do token, quando o admin rebaixa o usuário', async () => {
      // Arrange: token emitido enquanto o usuário ainda era ADMIN,
      // mas o banco já registra o rebaixamento para REVISOR
      const token = await createAuthToken('1', 'ADMIN')

      mockPrisma.user.findUnique.mockResolvedValue({
        ...usuarioAutenticado,
        role: 'REVISOR',
      } as never)

      const request = new NextRequest('http://localhost:3000/api/cursos', {
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
      expect(mockPrisma.curso.create).not.toHaveBeenCalled()
    })

    it('deve retornar 401 quando o usuário do token não existe mais no banco', async () => {
      // Arrange
      const token = await createAuthToken()

      mockPrisma.user.findUnique.mockResolvedValue(null as never)

      const request = new NextRequest('http://localhost:3000/api/cursos', {
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
      expect(mockPrisma.curso.create).not.toHaveBeenCalled()
    })

    it('deve retornar 400 com campos obrigatórios faltando', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        senha: 'hashed',
        nome: 'Test User',
        cargo: 'Desenvolvedor',
        role: 'ADMIN',
        dataCriacao: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/cursos', {
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

  describe('PUT /api/cursos', () => {
    async function editar(statusAtual: string) {
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        senha: 'hashed',
        nome: 'Test User',
        role: 'ADMIN',
        dataCriacao: new Date(),
      }
      const mockCurso = {
        id: '1',
        titulo: 'Curso',
        descricao: 'Desc',
        cargaHoraria: '60h',
        modalidade: 'Online',
        categoria: 'Tecnologia',
        unidades: [],
        layout: 'classico',
        slug: null,
        status: statusAtual,
        version: 0,
        ownerId: '1',
        owner: { id: '1', nome: 'Test User' },
        revisadoPorId: 'revisor-1',
        revisadoEm: new Date(),
        dataCriacao: new Date(),
        dataModificacao: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as never)
      mockPrisma.curso.findUnique.mockResolvedValue(mockCurso as never)
      mockPrisma.curso.update.mockResolvedValue(mockCurso as never)

      const request = new NextRequest('http://localhost:3000/api/cursos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: `auth-token=${token}` },
        body: JSON.stringify({ id: '1', titulo: 'Curso Editado', version: 0 }),
      })

      const res = await updateCursoHandler(request)
      return { res, dados: mockPrisma.curso.update.mock.calls[0]?.[0]?.data }
    }

    it('devolve curso APROVADO para EM_ANDAMENTO e limpa a revisão ao editar', async () => {
      const { res, dados } = await editar('APROVADO')

      expect(res.status).toBe(200)
      expect(dados.status).toBe('EM_ANDAMENTO')
      expect(dados.revisadoPorId).toBeNull()
      expect(dados.revisadoEm).toBeNull()
    })

    it('devolve curso REPROVADO para EM_ANDAMENTO ao editar', async () => {
      const { dados } = await editar('REPROVADO')

      expect(dados.status).toBe('EM_ANDAMENTO')
    })

    it('não mexe no status de um curso EM_ANDAMENTO', async () => {
      const { dados } = await editar('EM_ANDAMENTO')

      expect(dados.status).toBeUndefined()
    })

    it('não mexe no status de um curso EM_REVISAO', async () => {
      const { dados } = await editar('EM_REVISAO')

      expect(dados.status).toBeUndefined()
    })

    it('deve atualizar curso com autenticação válida', async () => {
      // Arrange
      const token = await createAuthToken()
      const mockUser = {
        id: '1',
        email: 'testuser@senai.br',
        senha: 'hashed',
        nome: 'Test User',
        cargo: 'Desenvolvedor',
        role: 'ADMIN',
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
        layout: 'classico',
        slug: null,
        status: 'EM_ANDAMENTO',
        version: 0,
        ownerId: '1',
        owner: { id: '1', nome: 'Test User' },
        revisadoPorId: null,
        revisadoEm: null,
        dataCriacao: new Date(),
        dataModificacao: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.curso.findUnique.mockResolvedValue(mockCurso)
      mockPrisma.curso.update.mockResolvedValue(mockCurso)

      const request = new NextRequest('http://localhost:3000/api/cursos', {
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
        email: 'testuser@senai.br',
        senha: 'hashed',
        nome: 'Test User',
        cargo: 'Desenvolvedor',
        role: 'ADMIN',
        dataCriacao: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.curso.delete.mockResolvedValue({ id: '1' } as { id: string })

      const request = new NextRequest('http://localhost:3000/api/cursos?id=1', {
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
