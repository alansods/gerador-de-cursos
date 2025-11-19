import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('👤 Criando usuário convidado...\n');

  try {
    // Verificar se usuário já existe
    const usuarioExistente = await prisma.user.findUnique({
      where: { usuario: 'convidado' },
    });

    if (usuarioExistente) {
      console.log('⚠️  Usuário convidado já existe!');
      console.log(`   ID: ${usuarioExistente.id}`);
      console.log(`   Nome: ${usuarioExistente.nome}`);
      console.log(`   Cargo: ${usuarioExistente.cargo}`);
      console.log(`   Usuário: ${usuarioExistente.usuario}`);
      return;
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash('senai2025', 10);

    // Criar usuário
    const usuarioConvidado = await prisma.user.create({
      data: {
        nome: 'Usuário Convidado',
        cargo: 'Convidado',
        usuario: 'convidado',
        senha: senhaHash,
      },
    });

    console.log('✅ Usuário convidado criado com sucesso!');
    console.log(`   ID: ${usuarioConvidado.id}`);
    console.log(`   Nome: ${usuarioConvidado.nome}`);
    console.log(`   Cargo: ${usuarioConvidado.cargo}`);
    console.log(`   Usuário: ${usuarioConvidado.usuario}`);
    console.log(`   Senha: senai2025`);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

