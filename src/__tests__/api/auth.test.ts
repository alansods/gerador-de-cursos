/**
 * Testes de API - Autenticação
 *
 * Testa os endpoints de autenticação:
 * - POST /api/auth/login
 * - GET /api/auth/me
 * - POST /api/auth/logout
 */

import { NextRequest } from 'next/server'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { GET as meHandler } from '@/app/api/auth/me/route'
import { POST as logoutHandler } from '@/app/api/auth/logout/route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock do prisma já está configurado no jest.setup.js
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('API - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      // Arrange - preparar dados de teste
      const hashedPassword = await bcrypt.hash('senha123', 10)
      const mockUser = {
        id: '1',
        usuario: 'testuser',
        senha: hashedPassword,
        nome: 'Test User',
        cargo: 'Desenvolvedor',
        dataCriacao: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          usuario: 'testuser',
          senha: 'senha123',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act - executar a ação
      const response = await loginHandler(request)
      const data = await response.json()

      // Assert - verificar resultados
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toEqual({
        id: '1',
        usuario: 'testuser',
        nome: 'Test User',
        cargo: 'Desenvolvedor',
      })
      expect(response.headers.get('Set-Cookie')).toContain('token=')

      // CRÍTICO: Verificar que não houve requisições duplicadas ao banco
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1)
    })

    it('deve retornar erro com credenciais inválidas', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          usuario: 'wronguser',
          senha: 'wrongpass',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await loginHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Credenciais inválidas')

      // CRÍTICO: Verificar que foi feita apenas UMA consulta ao banco
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1)
    })

    it('deve retornar erro com senha incorreta', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('senhaCorreta', 10)
      const mockUser = {
        id: '1',
        usuario: 'testuser',
        senha: hashedPassword,
        nome: 'Test User',
        cargo: 'Desenvolvedor',
        dataCriacao: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          usuario: 'testuser',
          senha: 'senhaErrada',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await loginHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Credenciais inválidas')
    })

    it('deve retornar erro com campos obrigatórios faltando', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          usuario: '',
          senha: '',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await loginHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Usuário e senha são obrigatórios')
    })
  })

  describe('GET /api/auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        usuario: 'testuser',
        senha: 'hashed',
        nome: 'Test User',
        cargo: 'Desenvolvedor',
        dataCriacao: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      // Criar um token válido
      const { SignJWT } = await import('jose')
      const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
      const token = await new SignJWT({ id: '1' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(JWT_SECRET)

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          Cookie: `token=${token}`,
        },
      })

      // Act
      const response = await meHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toEqual({
        id: '1',
        usuario: 'testuser',
        nome: 'Test User',
        cargo: 'Desenvolvedor',
      })

      // CRÍTICO: Verificar que foi feita apenas UMA consulta ao banco
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1)
    })

    it('deve retornar erro sem token', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/auth/me')

      // Act
      const response = await meHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Token de autenticação não encontrado')
    })

    it('deve retornar erro com token inválido', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        headers: {
          Cookie: 'token=invalid-token',
        },
      })

      // Act
      const response = await meHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('deve fazer logout com sucesso', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      })

      // Act
      const response = await logoutHandler(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Logout realizado com sucesso')

      // Verificar se o cookie foi limpo
      const setCookie = response.headers.get('Set-Cookie')
      expect(setCookie).toContain('token=')
      expect(setCookie).toContain('Max-Age=0')
    })
  })
})
