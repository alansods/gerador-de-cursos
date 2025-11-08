import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';
import { verifyAuth, createErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await ensureConnection();
    const payload = await verifyAuth(req);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, nome: true, cargo: true, usuario: true },
    });

    if (!user) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error &&
        (error.message.includes('Token') || error.message.includes('autenticação'))) {
      return createErrorResponse(error.message, 401);
    }
    console.error('Erro ao verificar autenticação:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
}
