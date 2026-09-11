import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('👤 Criando usuário convidado...\n')

  try {
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'convidado@senai.br' },
    })

    if (existingUser) {
      console.log('⚠️  Usuário convidado já existe!')
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Nome: ${existingUser.name}`)
      console.log(`   Usuário: ${existingUser.email}`)
      return
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash('senai2025', 10)

    // Criar usuário
    const guestUser = await prisma.user.create({
      data: {
        name: 'Usuário Convidado',
        email: 'convidado@senai.br',
        password: passwordHash,
      },
    })

    console.log('✅ Usuário convidado criado com sucesso!')
    console.log(`   ID: ${guestUser.id}`)
    console.log(`   Nome: ${guestUser.name}`)
    console.log(`   Usuário: ${guestUser.email}`)
    console.log(`   Senha: senai2025`)
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
