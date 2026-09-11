import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { logActivity } from '@/lib/activity-logger'
import { requireAuth, createErrorResponse } from '@/lib/auth'
import { can, ROLES, type UserRole } from '@/lib/permissions'
import type { JWTPayload } from '@/lib/auth'

function normalizeRole(role: unknown): UserRole {
  return typeof role === 'string' && ROLES.includes(role as UserRole)
    ? (role as UserRole)
    : 'CONTENT_AUTHOR'
}

function denyUnlessCanManage(user: JWTPayload) {
  if (can(user, 'user:manage')) return null
  return createErrorResponse('Você não tem permissão para gerenciar usuários', 403)
}

// GET: Listar usuários com paginação e filtros
const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const withoutPermission = denyUnlessCanManage(authResult.user)
  if (withoutPermission) return withoutPermission

  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const role = searchParams.get('role')

    const skip = (page - 1) * limit

    // Construir filtro
    const where: Prisma.UserWhereInput = {}

    if (role && ROLES.includes(role as UserRole)) {
      where.role = role as UserRole
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    // Buscar total e dados
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao buscar usuários' },
      { status: 500 }
    )
  }
}

// POST: Criar usuário
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const withoutPermission = denyUnlessCanManage(authResult.user)
  if (withoutPermission) return withoutPermission

  try {
    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    if (!VALID_EMAIL.test(normalizedEmail)) {
      return NextResponse.json({ success: false, error: 'E-mail inválido' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'E-mail já cadastrado' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: normalizeRole(role),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    // Registrar atividade
    await logActivity({
      type: 'usuario_criado',
      title: 'Novo usuário criado',
      description: name,
      entityId: user.id,
      entityType: 'usuario',
      userId: authResult.user.id,
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao criar usuário' },
      { status: 500 }
    )
  }
}

// PUT: Atualizar usuário
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const withoutPermission = denyUnlessCanManage(authResult.user)
  if (withoutPermission) return withoutPermission

  try {
    const body = await request.json()
    const { id, name, email, password, role } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    const updateData: Prisma.UserUpdateInput = {
      name,
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase()

      if (!VALID_EMAIL.test(normalizedEmail)) {
        return NextResponse.json({ success: false, error: 'E-mail inválido' }, { status: 400 })
      }

      updateData.email = normalizedEmail
    }

    if (role !== undefined) {
      updateData.role = normalizeRole(role)
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    // Registrar atividade
    await logActivity({
      type: 'usuario_editado',
      title: 'Usuário editado',
      description: user.name,
      entityId: user.id,
      entityType: 'usuario',
      userId: authResult.user.id,
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    // Verificar erro de duplicidade (P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Nome de usuário já está em uso' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Erro interno ao atualizar usuário' },
      { status: 500 }
    )
  }
}

// DELETE: Deletar usuário
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const withoutPermission = denyUnlessCanManage(authResult.user)
  if (withoutPermission) return withoutPermission

  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar usuário antes de deletar para obter o nome
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { name: true },
    })

    await prisma.user.delete({
      where: { id },
    })

    // Registrar atividade
    await logActivity({
      type: 'usuario_deletado',
      title: 'Usuário deletado',
      description: existingUser?.name || 'Usuário',
      entityId: id,
      entityType: 'usuario',
      userId: authResult.user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao deletar usuário' },
      { status: 500 }
    )
  }
}
