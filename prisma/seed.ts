import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';

// Carregar variáveis de ambiente - tenta .env.local primeiro, depois .env
// IMPORTANTE: Carregar ANTES de criar o PrismaClient
const envPath = resolve(process.cwd(), '.env.local');
const envFallback = resolve(process.cwd(), '.env');
config({ path: envPath, override: true });
config({ path: envFallback });

// Verificar se DATABASE_URL foi carregado
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.includes('placeholder')) {
  console.error('❌ DATABASE_URL não configurado ou está como placeholder');
  console.error(`   Valor atual: ${databaseUrl || 'não encontrado'}`);
  console.error('   Configure DATABASE_URL no arquivo .env.local');
  process.exit(1);
}

console.log(`✅ DATABASE_URL carregado: ${databaseUrl.substring(0, 30)}...`);

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

const cursosExemplo = [
  {
    titulo: 'Fabricação de Pizza Artesanal de Carne de Sol',
    descricao: 'Aprenda a preparar pizzas artesanais com o tradicional sabor nordestino da carne de sol. Este curso aborda desde a preparação da massa até a montagem final da pizza.',
    cargaHoraria: '16 horas',
    modalidade: 'Presencial',
    categoria: 'Gastronomia',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Fundamentos de Desenvolvimento Web',
    descricao: 'Domine os conceitos essenciais do desenvolvimento web moderno. Aprenda HTML5, CSS3, JavaScript e frameworks populares. Construa projetos práticos e desenvolva habilidades profissionais.',
    cargaHoraria: '40 horas',
    modalidade: 'Online',
    categoria: 'Tecnologia',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Marketing Digital para Iniciantes',
    descricao: 'Descubra estratégias eficazes de marketing digital para alavancar seu negócio online. Conheça SEO, redes sociais, email marketing e análise de métricas.',
    cargaHoraria: '24 horas',
    modalidade: 'Híbrido',
    categoria: 'Marketing',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Design UX/UI Avançado',
    descricao: 'Aprenda os princípios fundamentais de design de experiência do usuário e interface. Crie protótipos interativos, conduza pesquisas com usuários e desenvolva interfaces modernas.',
    cargaHoraria: '32 horas',
    modalidade: 'Online',
    categoria: 'Design',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Gestão de Projetos Ágeis',
    descricao: 'Domine metodologias ágeis como Scrum e Kanban. Aprenda a gerenciar times, sprints, backlogs e entregas contínuas. Ideal para gerentes de projeto e líderes de equipe.',
    cargaHoraria: '20 horas',
    modalidade: 'Híbrido',
    categoria: 'Gestão',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Fotografia Digital Profissional',
    descricao: 'Desenvolva suas habilidades fotográficas do básico ao avançado. Aprenda sobre composição, iluminação, edição e diferentes estilos de fotografia profissional.',
    cargaHoraria: '28 horas',
    modalidade: 'Presencial',
    categoria: 'Arte',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Introdução ao Next.js 14',
    descricao: 'Aprenda a construir aplicações modernas com Next.js 14, incluindo App Router, Server Components e muito mais.',
    cargaHoraria: '40 horas',
    modalidade: 'Online',
    categoria: 'Tecnologia',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Culinária Italiana Autêntica',
    descricao: 'Aprenda a preparar pratos tradicionais da culinária italiana. Massas frescas, molhos autênticos e técnicas de cozinha profissional.',
    cargaHoraria: '18 horas',
    modalidade: 'Presencial',
    categoria: 'Gastronomia',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Redes Sociais e Influência Digital',
    descricao: 'Domine estratégias de conteúdo para redes sociais. Aprenda a criar campanhas virais, engajar audiências e construir uma marca pessoal forte.',
    cargaHoraria: '22 horas',
    modalidade: 'Online',
    categoria: 'Marketing',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Figma para Designers',
    descricao: 'Aprenda a usar o Figma para criar interfaces modernas. Prototipagem, design systems e colaboração em equipe.',
    cargaHoraria: '30 horas',
    modalidade: 'Online',
    categoria: 'Design',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Liderança e Gestão de Times',
    descricao: 'Desenvolva habilidades de liderança e gestão. Aprenda a motivar equipes, resolver conflitos e alcançar resultados extraordinários.',
    cargaHoraria: '26 horas',
    modalidade: 'Híbrido',
    categoria: 'Gestão',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Pintura Digital e Ilustração',
    descricao: 'Domine técnicas de pintura digital e ilustração. Use ferramentas profissionais como Photoshop e Illustrator para criar arte digital.',
    cargaHoraria: '34 horas',
    modalidade: 'Online',
    categoria: 'Arte',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'React Avançado e Hooks',
    descricao: 'Aprofunde-se no React com hooks avançados, context API, performance e padrões de código. Construa aplicações escaláveis e eficientes.',
    cargaHoraria: '36 horas',
    modalidade: 'Online',
    categoria: 'Tecnologia',
    unidades: unidadesExemplo,
  },
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Verificar quantos cursos já existem
  const cursosExistentes = await prisma.curso.count();
  console.log(`📊 Cursos existentes no banco: ${cursosExistentes}`);

  // Criar os cursos de exemplo
  console.log('\n✨ Criando cursos de exemplo...\n');
  
  let cursosCriados = 0;
  let cursosExistentesCount = 0;
  
  for (const cursoData of cursosExemplo) {
    try {
      // Verificar se o curso já existe pelo título
      const cursoExistente = await prisma.curso.findFirst({
        where: { titulo: cursoData.titulo },
      });
      
      if (cursoExistente) {
        cursosExistentesCount++;
        console.log(`ℹ️  Curso já existe: ${cursoData.titulo}`);
      } else {
        // Criar o curso
        const curso = await prisma.curso.create({
          data: cursoData,
        });
        cursosCriados++;
        console.log(`✅ Curso criado: ${curso.titulo}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao criar curso ${cursoData.titulo}:`, error);
    }
  }
  
  console.log(`\n✅ ${cursosCriados} cursos criados, ${cursosExistentesCount} já existiam`);

  // Mostrar estatísticas
  const totalCursos = await prisma.curso.count();
  console.log(`\n📊 Total de cursos no banco: ${totalCursos}`);

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

  // Criar usuário convidado (apenas se não existir)
  const usuarioConvidadoExistente = await prisma.user.findUnique({
    where: { usuario: 'convidado' },
  });

  if (!usuarioConvidadoExistente) {
    console.log('\n👤 Criando usuário convidado...');
    const senhaHash = await bcrypt.hash('senai2025', 10);
    
    const usuarioConvidado = await prisma.user.create({
      data: {
        nome: 'Usuário Convidado',
        cargo: 'Convidado',
        usuario: 'convidado',
        senha: senhaHash,
      },
    });

    console.log('✅ Usuário convidado criado com sucesso!');
    console.log(`   Usuário: convidado`);
    console.log(`   Senha: senai2025`);
    console.log(`   ID: ${usuarioConvidado.id}`);
  } else {
    console.log('\n👤 Usuário convidado já existe, pulando criação...');
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
