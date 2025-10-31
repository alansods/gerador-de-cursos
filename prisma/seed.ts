import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Criar curso de exemplo
  const cursoExemplo = await prisma.curso.create({
    data: {
      titulo: 'Introdução ao Next.js 14',
      descricao: 'Aprenda a construir aplicações modernas com Next.js 14, incluindo App Router, Server Components e muito mais.',
      cargaHoraria: '40 horas',
      instrutor: 'João Silva',
      modalidade: 'Online',
      categoria: 'Desenvolvimento Web',
      unidades: [
        {
          id: '1',
          titulo: 'Fundamentos do Next.js',
          conteudo: [
            {
              id: '1-1',
              tipo: 'texto',
              titulo: 'O que é Next.js?',
              subtitulo: 'Introdução ao framework',
              paragrafo: 'Next.js é um framework React para produção que oferece renderização híbrida estática e do servidor.',
            },
            {
              id: '1-2',
              tipo: 'texto',
              titulo: 'App Router',
              subtitulo: 'Nova arquitetura de roteamento',
              paragrafo: 'O App Router é a nova forma de criar rotas no Next.js 14, oferecendo layouts, loading states e muito mais.',
            },
          ],
        },
        {
          id: '2',
          titulo: 'Server Components',
          conteudo: [
            {
              id: '2-1',
              tipo: 'texto',
              titulo: 'React Server Components',
              subtitulo: 'Renderização no servidor',
              paragrafo: 'Os Server Components permitem renderizar componentes no servidor, reduzindo o bundle JavaScript enviado ao cliente.',
            },
          ],
        },
        {
          id: '3',
          titulo: 'Banco de Dados e APIs',
          conteudo: [
            {
              id: '3-1',
              tipo: 'texto',
              titulo: 'Prisma ORM',
              subtitulo: 'ORM type-safe para Node.js',
              paragrafo: 'Prisma é um ORM moderno que oferece type-safety completo e uma excelente experiência de desenvolvimento.',
            },
            {
              id: '3-2',
              tipo: 'texto',
              titulo: 'API Routes',
              subtitulo: 'Criando endpoints RESTful',
              paragrafo: 'Next.js permite criar APIs diretamente na pasta app/api, facilitando a criação de backends.',
            },
          ],
        },
      ],
    },
  });

  console.log('✅ Curso de exemplo criado:');
  console.log(`   ID: ${cursoExemplo.id}`);
  console.log(`   Título: ${cursoExemplo.titulo}`);
  console.log(`   Instrutor: ${cursoExemplo.instrutor}`);
  console.log(`   Unidades: ${(cursoExemplo.unidades as any[]).length}`);

  // Criar alguns comentários de exemplo
  const comentarios = [
    'Primeiro comentário de teste!',
    'Prisma + Neon funcionando perfeitamente!',
    'Sistema configurado com sucesso 🎉',
  ];

  for (const texto of comentarios) {
    await prisma.comment.create({
      data: { text: texto },
    });
  }

  console.log(`\n✅ ${comentarios.length} comentários de exemplo criados`);

  console.log('\n🎉 Seed concluído com sucesso!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

