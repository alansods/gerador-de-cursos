import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Função para criar uma nova instância do Prisma com reconexão automática
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper para garantir conexão ativa antes de operações
export async function ensureConnection() {
  try {
    await prisma.$connect();
  } catch (error) {
    // Se a conexão estiver fechada, reconectar
    if (error instanceof Error && error.message.includes('Closed')) {
      console.log('[Prisma] Reconectando ao banco de dados...');
      await prisma.$disconnect();
      await prisma.$connect();
    } else {
      throw error;
    }
  }
}

// Garantir que a conexão seja fechada adequadamente ao encerrar
if (typeof window === 'undefined') {
  // Apenas no servidor
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;

