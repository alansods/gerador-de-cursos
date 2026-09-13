import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

// Carregar variáveis de ambiente do .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Dropping the instructor field from the database...\n')

  try {
    // 1. Delete every course
    console.log('🗑️  Deleting every course...')
    const deleted = await prisma.$executeRaw`DELETE FROM cursos`
    console.log(`✅ ${deleted} course(s) deleted\n`)

    // 2. Remover a coluna instrutor
    console.log('🔧 Dropping the instrutor column from the cursos table...')
    await prisma.$executeRaw`ALTER TABLE cursos DROP COLUMN IF EXISTS instrutor`
    console.log('✅ Column dropped\n')

    console.log('✨ Done!')
  } catch (error) {
    console.error('❌ Failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
