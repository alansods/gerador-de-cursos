import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const payload = await verifyAuth(request);

    // Buscar usuário no banco para garantir que ainda existe
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        usuario: true,
        nome: true,
        cargo: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        usuario: user.usuario,
        nome: user.nome,
        cargo: user.cargo,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não autenticado';
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}

