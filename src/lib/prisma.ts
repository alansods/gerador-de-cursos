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
    // Verificar se DATABASE_URL está configurado
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não está configurado no .env.local');
    }

    // Tentar conectar
    await prisma.$connect();
    
    // Verificar se a conexão está ativa fazendo uma query simples
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    // Se a conexão estiver fechada, reconectar
    if (error instanceof Error && error.message.includes('Closed')) {
      console.log('[Prisma] Reconectando ao banco de dados...');
      try {
        await prisma.$disconnect();
        await prisma.$connect();
        // Verificar novamente após reconectar
        await prisma.$queryRaw`SELECT 1`;
      } catch (reconnectError) {
        console.error('[Prisma] Erro ao reconectar:', reconnectError);
        throw reconnectError;
      }
    } else if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      // Erro de configuração
      throw error;
    } else {
      // Outros erros de conexão
      console.error('[Prisma] Erro ao conectar ao banco de dados:', error);
      throw new Error(`Erro ao conectar ao banco de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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

