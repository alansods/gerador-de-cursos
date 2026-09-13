import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Builds a Prisma client that reconnects on its own
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Ensures the connection is live before running an operation
export async function ensureConnection() {
  try {
    // Check that DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não está configurado no .env.local')
    }

    // Try to connect
    await prisma.$connect()

    // Probe the connection with a trivial query
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    // Reconnect when the connection is closed
    if (error instanceof Error && error.message.includes('Closed')) {
      console.log('[Prisma] Reconnecting to the database...')
      try {
        await prisma.$disconnect()
        await prisma.$connect()
        // Probe again after reconnecting
        await prisma.$queryRaw`SELECT 1`
      } catch (reconnectError) {
        console.error('[Prisma] Reconnection failed:', reconnectError)
        throw reconnectError
      }
    } else if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      // Configuration error
      throw error
    } else {
      // Any other connection error
      console.error('[Prisma] Failed to connect to the database:', error)
      throw new Error(
        `Erro ao conectar ao banco de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    }
  }
}

// Close the connection cleanly on shutdown
if (typeof window === 'undefined') {
  // Apenas no servidor
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

export default prisma
