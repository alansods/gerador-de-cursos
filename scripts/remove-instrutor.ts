import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Carregar variáveis de ambiente do .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Removendo campo instrutor do banco de dados...\n');

  try {
    // 1. Apagar todos os cursos
    console.log('🗑️  Apagando todos os cursos...');
    const deleted = await prisma.$executeRaw`DELETE FROM cursos`;
    console.log(`✅ ${deleted} curso(s) apagado(s)\n`);

    // 2. Remover a coluna instrutor
    console.log('🔧 Removendo coluna instrutor da tabela cursos...');
    await prisma.$executeRaw`ALTER TABLE cursos DROP COLUMN IF EXISTS instrutor`;
    console.log('✅ Coluna instrutor removida com sucesso!\n');

    console.log('✨ Processo concluído!');
  } catch (error) {
    console.error('❌ Erro ao processar:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

