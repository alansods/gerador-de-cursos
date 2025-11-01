import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente - tenta .env.local primeiro, depois .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const unidadesExemplo = [
  {
    id: 'unit-1',
    titulo: 'Fundamentos do Next.js',
    descricao: 'Nesta unidade você aprenderá os conceitos fundamentais do Next.js, incluindo sua arquitetura, recursos principais e como ele se diferencia do React puro.',
    ordem: 0,
    conteudo: [
      {
        id: 'content-1-1',
        tipo: 'titulo',
        conteudo: 'O que é Next.js?',
        ordem: 0,
        colunas: 12,
      },
      {
        id: 'content-1-2',
        tipo: 'paragrafo',
        conteudo: 'Next.js é um framework React para produção criado pela Vercel. Ele oferece renderização híbrida estática e do servidor, otimização automática de imagens, code splitting e muito mais. O Next.js foi projetado para resolver problemas comuns no desenvolvimento React, como configuração complexa, otimização de performance e SEO.',
        ordem: 1,
        colunas: 12,
        alinhamento: 'justificado',
      },
      {
        id: 'content-1-3',
        tipo: 'subtitulo',
        conteudo: 'Principais Características',
        ordem: 2,
        colunas: 12,
      },
      {
        id: 'content-1-4',
        tipo: 'paragrafo',
        conteudo: '<ul><li><strong>Server-Side Rendering (SSR):</strong> Renderização no servidor para melhor SEO e performance inicial</li><li><strong>Static Site Generation (SSG):</strong> Geração de páginas estáticas em tempo de build</li><li><strong>Image Optimization:</strong> Otimização automática de imagens com lazy loading</li><li><strong>API Routes:</strong> Criação de APIs RESTful diretamente no projeto</li><li><strong>TypeScript Support:</strong> Suporte nativo ao TypeScript</li></ul>',
        ordem: 3,
        colunas: 12,
        alinhamento: 'esquerda',
      },
      {
        id: 'content-1-5',
        tipo: 'titulo',
        conteudo: 'App Router',
        ordem: 4,
        colunas: 12,
      },
      {
        id: 'content-1-6',
        tipo: 'paragrafo',
        conteudo: 'O App Router é a nova arquitetura de roteamento introduzida no Next.js 13 e aprimorada no Next.js 14. Ele utiliza o sistema de arquivos para definir rotas, oferecendo layouts compartilhados, loading states, error boundaries e muito mais. Esta nova abordagem torna o desenvolvimento mais intuitivo e permite melhor organização do código.',
        ordem: 5,
        colunas: 12,
        alinhamento: 'justificado',
      },
    ],
  },
  {
    id: 'unit-2',
    titulo: 'Server Components',
    descricao: 'Explore os React Server Components e aprenda como renderizar componentes no servidor para melhorar performance e reduzir o tamanho do bundle JavaScript.',
    ordem: 1,
    conteudo: [
      {
        id: 'content-2-1',
        tipo: 'titulo',
        conteudo: 'React Server Components',
        ordem: 0,
        colunas: 12,
      },
      {
        id: 'content-2-2',
        tipo: 'paragrafo',
        conteudo: 'Os Server Components são uma nova forma de criar componentes React que são renderizados exclusivamente no servidor. Diferente dos componentes tradicionais que são enviados ao cliente como JavaScript, os Server Components permanecem no servidor, reduzindo significativamente o tamanho do bundle enviado ao navegador.',
        ordem: 1,
        colunas: 12,
        alinhamento: 'justificado',
      },
      {
        id: 'content-2-3',
        tipo: 'subtitulo',
        conteudo: 'Vantagens dos Server Components',
        ordem: 2,
        colunas: 12,
      },
      {
        id: 'content-2-4',
        tipo: 'paragrafo',
        conteudo: 'As principais vantagens incluem: acesso direto a recursos do servidor (como bancos de dados e APIs internas), melhor segurança (código sensível não é enviado ao cliente), e melhor performance (menos JavaScript no cliente significa tempos de carregamento mais rápidos).',
        ordem: 3,
        colunas: 12,
        alinhamento: 'justificado',
      },
      {
        id: 'content-2-5',
        tipo: 'subtitulo',
        conteudo: 'Quando Usar Server Components',
        ordem: 4,
        colunas: 6,
      },
      {
        id: 'content-2-6',
        tipo: 'subtitulo',
        conteudo: 'Quando Usar Client Components',
        ordem: 4,
        colunas: 6,
      },
      {
        id: 'content-2-7',
        tipo: 'paragrafo',
        conteudo: 'Use Server Components quando precisar: buscar dados, acessar recursos do backend, manter informações sensíveis no servidor, ou reduzir JavaScript no cliente.',
        ordem: 5,
        colunas: 6,
        alinhamento: 'justificado',
      },
      {
        id: 'content-2-8',
        tipo: 'paragrafo',
        conteudo: 'Use Client Components quando precisar: usar hooks do React (useState, useEffect), acessar APIs do navegador, lidar com eventos de usuário, ou usar bibliotecas que dependem do cliente.',
        ordem: 5,
        colunas: 6,
        alinhamento: 'justificado',
      },
    ],
  },
  {
    id: 'unit-3',
    titulo: 'Banco de Dados e APIs',
    descricao: 'Aprenda a integrar bancos de dados com Next.js usando Prisma ORM e como criar API Routes para construir backends completos.',
    ordem: 2,
    conteudo: [
      {
        id: 'content-3-1',
        tipo: 'titulo',
        conteudo: 'Prisma ORM',
        ordem: 0,
        colunas: 12,
      },
      {
        id: 'content-3-2',
        tipo: 'paragrafo',
        conteudo: 'Prisma é um ORM (Object-Relational Mapping) moderno e type-safe para Node.js e TypeScript. Ele oferece uma camada de abstração para trabalhar com bancos de dados relacionais, fornecendo type-safety completo, migrações automáticas e uma excelente experiência de desenvolvimento.',
        ordem: 1,
        colunas: 12,
        alinhamento: 'justificado',
      },
      {
        id: 'content-3-3',
        tipo: 'subtitulo',
        conteudo: 'Configuração do Prisma',
        ordem: 2,
        colunas: 12,
      },
      {
        id: 'content-3-4',
        tipo: 'paragrafo',
        conteudo: 'Para usar o Prisma em um projeto Next.js, você precisa: instalar o Prisma Client, criar um schema.prisma definindo seus modelos, configurar a conexão com o banco de dados, e gerar o cliente Prisma. O Prisma gera tipos TypeScript automaticamente baseados no seu schema, garantindo type-safety em tempo de compilação.',
        ordem: 3,
        colunas: 12,
        alinhamento: 'justificado',
      },
      {
        id: 'content-3-5',
        tipo: 'titulo',
        conteudo: 'API Routes no Next.js',
        ordem: 4,
        colunas: 12,
      },
      {
        id: 'content-3-6',
        tipo: 'paragrafo',
        conteudo: 'Next.js permite criar APIs RESTful diretamente na pasta app/api (ou pages/api na versão Pages Router). Cada arquivo route.ts (ou route.js) exporta funções nomeadas com os métodos HTTP (GET, POST, PUT, DELETE, etc.), permitindo criar backends completos sem precisar de um servidor separado.',
        ordem: 5,
        colunas: 12,
        alinhamento: 'justificado',
      },
      {
        id: 'content-3-7',
        tipo: 'subtitulo',
        conteudo: 'Exemplo de API Route',
        ordem: 6,
        colunas: 12,
      },
      {
        id: 'content-3-8',
        tipo: 'paragrafo',
        conteudo: 'Um exemplo básico de API Route para buscar dados do banco usando Prisma: <pre><code>export async function GET() {\n  const cursos = await prisma.curso.findMany();\n  return NextResponse.json(cursos);\n}</code></pre>',
        ordem: 7,
        colunas: 12,
        alinhamento: 'esquerda',
      },
    ],
  },
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Verificar se já existe um curso de exemplo
  const cursoExistente = await prisma.curso.findFirst({
    where: {
      titulo: 'Introdução ao Next.js 14'
    }
  });

  let cursoExemplo;
  
  if (cursoExistente) {
    // Atualizar curso existente com unidades e conteúdo
    console.log('📝 Curso já existe, atualizando com unidades e conteúdos...\n');
    cursoExemplo = await prisma.curso.update({
      where: {
        id: cursoExistente.id
      },
      data: {
        unidades: unidadesExemplo,
      },
    });
    console.log('✅ Curso atualizado com sucesso!');
  } else {
    // Criar novo curso de exemplo
    console.log('✨ Criando novo curso de exemplo...\n');
    cursoExemplo = await prisma.curso.create({
      data: {
        titulo: 'Introdução ao Next.js 14',
        descricao: 'Aprenda a construir aplicações modernas com Next.js 14, incluindo App Router, Server Components e muito mais.',
        cargaHoraria: '40 horas',
        modalidade: 'Online',
        categoria: 'Desenvolvimento Web',
        unidades: unidadesExemplo,
      },
    });
    console.log('✅ Curso criado com sucesso!');
  }

  console.log('\n📊 Informações do curso:');
  console.log(`   ID: ${cursoExemplo.id}`);
  console.log(`   Título: ${cursoExemplo.titulo}`);
  console.log(`   Unidades: ${(cursoExemplo.unidades as any[]).length}`);
  console.log(`   Total de conteúdos: ${(cursoExemplo.unidades as any[]).reduce((acc, u) => acc + (u.conteudo?.length || 0), 0)}`);

  // Criar alguns comentários de exemplo (apenas se não existirem)
  const comentariosExistentes = await prisma.comment.count();
  if (comentariosExistentes === 0) {
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
  }

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
