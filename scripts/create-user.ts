import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('👤 Creating the guest user...\n')

  try {
    // Check whether the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'convidado@senai.br' },
    })

    if (existingUser) {
      console.log('⚠️  The guest user already exists!')
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Name: ${existingUser.name}`)
      console.log(`   Email: ${existingUser.email}`)
      return
    }

    // Hash the password
    const passwordHash = await bcrypt.hash('senai2025', 10)

    // Create the user
    const guestUser = await prisma.user.create({
      data: {
        name: 'Usuário Convidado',
        email: 'convidado@senai.br',
        password: passwordHash,
      },
    })

    console.log('✅ Guest user created')
    console.log(`   ID: ${guestUser.id}`)
    console.log(`   Name: ${guestUser.name}`)
    console.log(`   Email: ${guestUser.email}`)
    console.log(`   Password: senai2025`)
  } catch (error) {
    console.error('❌ Failed to create the user:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
