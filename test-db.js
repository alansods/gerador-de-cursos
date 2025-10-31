#!/usr/bin/env node

/**
 * Script de teste para verificar conexão com banco de dados
 * 
 * Uso:
 * node test-db.js
 * 
 * ou com DATABASE_URL:
 * DATABASE_URL="..." node test-db.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function main() {
  console.log('\n🔍 Testando conexão com banco de dados...\n');

  // Verificar se DATABASE_URL está configurado
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não está configurado!');
    console.log('\n📝 Para testar, configure a variável:');
    console.log('   DATABASE_URL="postgresql://user:pass@host/db" node test-db.js\n');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL encontrado:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

  try {
    // Teste 1: Verificar conexão
    console.log('\n📊 Teste 1: Verificando conexão...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Teste 2: Criar um comentário
    console.log('\n💬 Teste 2: Criando comentário de teste...');
    const comment = await prisma.comment.create({
      data: {
        text: `Teste de conexão - ${new Date().toISOString()}`,
      },
    });
    console.log('✅ Comentário criado:', comment);

    // Teste 3: Listar comentários
    console.log('\n📋 Teste 3: Listando todos os comentários...');
    const allComments = await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log(`✅ Total de comentários: ${allComments.length}`);
    console.log('Últimos comentários:');
    allComments.forEach((c, i) => {
      console.log(`   ${i + 1}. [ID: ${c.id}] ${c.text}`);
    });

    // Teste 4: Deletar comentário de teste
    console.log('\n🗑️  Teste 4: Deletando comentário de teste...');
    await prisma.comment.delete({
      where: { id: comment.id },
    });
    console.log('✅ Comentário de teste deletado!');

    console.log('\n✨ Todos os testes passaram com sucesso!\n');
  } catch (error) {
    console.error('\n❌ Erro durante os testes:');
    console.error(error);
    
    if (error.code === 'P2021') {
      console.log('\n💡 Dica: Execute as migrações:');
      console.log('   npx prisma migrate dev --name init\n');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

