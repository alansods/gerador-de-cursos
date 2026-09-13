import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'
import bcrypt from 'bcryptjs'

// Carregar variáveis de ambiente - tenta .env.local primeiro, depois .env
// IMPORTANTE: Carregar ANTES de criar o PrismaClient
const envPath = resolve(process.cwd(), '.env.local')
const envFallback = resolve(process.cwd(), '.env')
config({ path: envPath, override: true })
config({ path: envFallback })

// Verificar se DATABASE_URL foi carregado
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl || databaseUrl.includes('placeholder')) {
  console.error('❌ DATABASE_URL is not set or is still a placeholder')
  console.error(`   Current value: ${databaseUrl || 'not found'}`)
  console.error('   Set DATABASE_URL in .env.local')
  process.exit(1)
}

console.log(`✅ DATABASE_URL loaded: ${databaseUrl.substring(0, 30)}...`)

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

const sampleUnits = [
  {
    id: 'unit-1',
    title: 'Fundamentos do Next.js',
    description:
      'Nesta unidade você aprenderá os conceitos fundamentais do Next.js, incluindo sua arquitetura, recursos principais e como ele se diferencia do React puro.',
    order: 0,
    blocks: [
      {
        id: 'content-1-1',
        type: 'heading',
        content: 'O que é Next.js?',
        order: 0,
        columns: 12,
      },
      {
        id: 'content-1-2',
        type: 'paragraph',
        content:
          'Next.js é um framework React para produção criado pela Vercel. Ele oferece renderização híbrida estática e do servidor, otimização automática de imagens, code splitting e muito mais. O Next.js foi projetado para resolver problemas comuns no desenvolvimento React, como configuração complexa, otimização de performance e SEO.',
        order: 1,
        columns: 12,
        alignment: 'justify',
      },
      {
        id: 'content-1-3',
        type: 'subheading',
        content: 'Principais Características',
        order: 2,
        columns: 12,
      },
      {
        id: 'content-1-4',
        type: 'paragraph',
        content:
          '<ul><li><strong>Server-Side Rendering (SSR):</strong> Renderização no servidor para melhor SEO e performance inicial</li><li><strong>Static Site Generation (SSG):</strong> Geração de páginas estáticas em tempo de build</li><li><strong>Image Optimization:</strong> Otimização automática de imagens com lazy loading</li><li><strong>API Routes:</strong> Criação de APIs RESTful diretamente no projeto</li><li><strong>TypeScript Support:</strong> Suporte nativo ao TypeScript</li></ul>',
        order: 3,
        columns: 12,
        alignment: 'left',
      },
      {
        id: 'content-1-5',
        type: 'heading',
        content: 'App Router',
        order: 4,
        columns: 12,
      },
      {
        id: 'content-1-6',
        type: 'paragraph',
        content:
          'O App Router é a nova arquitetura de roteamento introduzida no Next.js 13 e aprimorada no Next.js 14. Ele utiliza o sistema de arquivos para definir rotas, oferecendo layouts compartilhados, loading states, error boundaries e muito mais. Esta nova abordagem torna o desenvolvimento mais intuitivo e permite melhor organização do código.',
        order: 5,
        columns: 12,
        alignment: 'justify',
      },
    ],
  },
  {
    id: 'unit-2',
    title: 'Server Components',
    description:
      'Explore os React Server Components e aprenda como renderizar componentes no servidor para melhorar performance e reduzir o tamanho do bundle JavaScript.',
    order: 1,
    blocks: [
      {
        id: 'content-2-1',
        type: 'heading',
        content: 'React Server Components',
        order: 0,
        columns: 12,
      },
      {
        id: 'content-2-2',
        type: 'paragraph',
        content:
          'Os Server Components são uma nova forma de criar componentes React que são renderizados exclusivamente no servidor. Diferente dos componentes tradicionais que são enviados ao cliente como JavaScript, os Server Components permanecem no servidor, reduzindo significativamente o tamanho do bundle enviado ao navegador.',
        order: 1,
        columns: 12,
        alignment: 'justify',
      },
      {
        id: 'content-2-3',
        type: 'subheading',
        content: 'Vantagens dos Server Components',
        order: 2,
        columns: 12,
      },
      {
        id: 'content-2-4',
        type: 'paragraph',
        content:
          'As principais vantagens incluem: acesso direto a recursos do servidor (como bancos de dados e APIs internas), melhor segurança (código sensível não é enviado ao cliente), e melhor performance (menos JavaScript no cliente significa tempos de carregamento mais rápidos).',
        order: 3,
        columns: 12,
        alignment: 'justify',
      },
      {
        id: 'content-2-5',
        type: 'subheading',
        content: 'Quando Usar Server Components',
        order: 4,
        columns: 6,
      },
      {
        id: 'content-2-6',
        type: 'subheading',
        content: 'Quando Usar Client Components',
        order: 4,
        columns: 6,
      },
      {
        id: 'content-2-7',
        type: 'paragraph',
        content:
          'Use Server Components quando precisar: buscar dados, acessar recursos do backend, manter informações sensíveis no servidor, ou reduzir JavaScript no cliente.',
        order: 5,
        columns: 6,
        alignment: 'justify',
      },
      {
        id: 'content-2-8',
        type: 'paragraph',
        content:
          'Use Client Components quando precisar: usar hooks do React (useState, useEffect), acessar APIs do navegador, lidar com eventos de usuário, ou usar bibliotecas que dependem do cliente.',
        order: 5,
        columns: 6,
        alignment: 'justify',
      },
    ],
  },
  {
    id: 'unit-3',
    title: 'Banco de Dados e APIs',
    description:
      'Aprenda a integrar bancos de dados com Next.js usando Prisma ORM e como criar API Routes para construir backends completos.',
    order: 2,
    blocks: [
      {
        id: 'content-3-1',
        type: 'heading',
        content: 'Prisma ORM',
        order: 0,
        columns: 12,
      },
      {
        id: 'content-3-2',
        type: 'paragraph',
        content:
          'Prisma é um ORM (Object-Relational Mapping) moderno e type-safe para Node.js e TypeScript. Ele oferece uma camada de abstração para trabalhar com bancos de dados relacionais, fornecendo type-safety completo, migrações automáticas e uma excelente experiência de desenvolvimento.',
        order: 1,
        columns: 12,
        alignment: 'justify',
      },
      {
        id: 'content-3-3',
        type: 'subheading',
        content: 'Configuração do Prisma',
        order: 2,
        columns: 12,
      },
      {
        id: 'content-3-4',
        type: 'paragraph',
        content:
          'Para usar o Prisma em um projeto Next.js, você precisa: instalar o Prisma Client, criar um schema.prisma definindo seus modelos, configurar a conexão com o banco de dados, e gerar o cliente Prisma. O Prisma gera tipos TypeScript automaticamente baseados no seu schema, garantindo type-safety em tempo de compilação.',
        order: 3,
        columns: 12,
        alignment: 'justify',
      },
      {
        id: 'content-3-5',
        type: 'heading',
        content: 'API Routes no Next.js',
        order: 4,
        columns: 12,
      },
      {
        id: 'content-3-6',
        type: 'paragraph',
        content:
          'Next.js permite criar APIs RESTful diretamente na pasta app/api (ou pages/api na versão Pages Router). Cada arquivo route.ts (ou route.js) exporta funções nomeadas com os métodos HTTP (GET, POST, PUT, DELETE, etc.), permitindo criar backends completos sem precisar de um servidor separado.',
        order: 5,
        columns: 12,
        alignment: 'justify',
      },
      {
        id: 'content-3-7',
        type: 'subheading',
        content: 'Exemplo de API Route',
        order: 6,
        columns: 12,
      },
      {
        id: 'content-3-8',
        type: 'paragraph',
        content:
          'Um exemplo básico de API Route para buscar dados do banco usando Prisma: <pre><code>export async function GET() {\n  const cursos = await prisma.curso.findMany();\n  return NextResponse.json(cursos);\n}</code></pre>',
        order: 7,
        columns: 12,
        alignment: 'left',
      },
    ],
  },
]

const sampleCourses = [
  {
    title: 'Fundamentos de Python para Análise de Dados',
    description:
      'Aprenda Python desde o básico até análise de dados com Pandas, NumPy e visualização com Matplotlib. Ideal para iniciantes em programação.',
    workload: '32 horas',
    modality: 'Online',
    category: 'Tecnologia',
    units: sampleUnits,
  },
  {
    title: 'Liderança e Gestão de Equipes',
    description:
      'Desenvolva habilidades essenciais de liderança. Aprenda a motivar equipes, gerenciar conflitos e alcançar resultados através de pessoas.',
    workload: '24 horas',
    modality: 'Híbrido',
    category: 'Gestão',
    units: sampleUnits,
  },
  {
    title: 'Design Thinking na Prática',
    description:
      'Metodologia para resolver problemas complexos de forma criativa. Aprenda as 5 etapas do Design Thinking através de casos reais e workshops práticos.',
    workload: '16 horas',
    modality: 'Presencial',
    category: 'Inovação',
    units: sampleUnits,
  },
  {
    title: 'Marketing Digital e Growth',
    description:
      'Estratégias de marketing digital para crescimento acelerado. SEO, tráfego pago, funis de conversão, métricas e otimização de campanhas.',
    workload: '28 horas',
    modality: 'Online',
    category: 'Marketing',
    units: sampleUnits,
  },
  {
    title: 'Desenvolvimento Web Full Stack',
    description:
      'Construa aplicações web completas do zero. React, Node.js, APIs RESTful, bancos de dados e deploy em produção.',
    workload: '80 horas',
    modality: 'Online',
    category: 'Tecnologia',
    units: sampleUnits,
  },
  {
    title: 'Excel Avançado para Negócios',
    description:
      'Domine fórmulas avançadas, tabelas dinâmicas, macros e automação. Análise de dados corporativos e relatórios profissionais.',
    workload: '20 horas',
    modality: 'Híbrido',
    category: 'Produtividade',
    units: sampleUnits,
  },
  {
    title: 'Comunicação e Oratória',
    description:
      'Desenvolva habilidades de comunicação eficaz. Apresentações impactantes, linguagem corporal, storytelling e persuasão.',
    workload: '12 horas',
    modality: 'Presencial',
    category: 'Soft Skills',
    units: sampleUnits,
  },
  {
    title: 'UX/UI Design Moderno',
    description:
      'Crie experiências digitais incríveis. Pesquisa com usuários, wireframes, prototipagem no Figma e testes de usabilidade.',
    workload: '36 horas',
    modality: 'Online',
    category: 'Design',
    units: sampleUnits,
  },
  {
    title: 'Finanças Pessoais e Investimentos',
    description:
      'Organize suas finanças e aprenda a investir. Orçamento, controle de gastos, renda passiva e estratégias de investimento.',
    workload: '16 horas',
    modality: 'Online',
    category: 'Finanças',
    units: sampleUnits,
  },
  {
    title: 'DevOps e Cloud Computing',
    description:
      'Automação de infraestrutura, CI/CD, Docker, Kubernetes e AWS. Práticas modernas de desenvolvimento e operações.',
    workload: '40 horas',
    modality: 'Online',
    category: 'Tecnologia',
    units: sampleUnits,
  },
]

async function main() {
  console.log('🌱 Seeding the database...\n')

  // ========================================
  // PROTEÇÃO: NÃO RODAR EM PRODUÇÃO
  // ========================================

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    console.error('❌ ERROR: the seed cannot run in production!')
    console.error('   It deletes ALL existing data.')
    console.error('   In production, create users through the UI or a migration.')
    process.exit(1)
  }

  console.log('✅ Environment: development (seed allowed)\n')

  // ========================================
  // LIMPAR DADOS EXISTENTES
  // ========================================

  console.log('🗑️  Removing existing courses...')
  await prisma.course.deleteMany({})
  console.log('✅ Courses removed\n')

  console.log('🗑️  Removing existing users...')
  await prisma.user.deleteMany({})
  console.log('✅ Users removed\n')

  // ========================================
  // CRIAR USUÁRIOS
  // ========================================

  console.log('👤 Creating the admin user...')
  const adminPasswordHash = await bcrypt.hash('Admin@Senai2025!', 10)

  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador',
      role: 'ADMIN',
      email: 'admin@senai.br',
      password: adminPasswordHash,
    },
  })

  console.log('✅ Admin user created')
  console.log('   User: admin')
  console.log('   Password: Admin@Senai2025!')
  console.log(`   ID: ${adminUser.id}\n`)

  console.log('👤 Creating the guest user...')
  const guestPasswordHash = await bcrypt.hash('convidado', 10)

  const guestUser = await prisma.user.create({
    data: {
      name: 'Usuário Convidado',
      role: 'GUEST',
      email: 'convidado@senai.br',
      password: guestPasswordHash,
    },
  })

  console.log('✅ Guest user created')
  console.log('   User: convidado')
  console.log('   Password: convidado')
  console.log(`   ID: ${guestUser.id}\n`)

  // ========================================
  // CRIAR CURSOS
  // ========================================

  console.log('✨ Creating sample courses...\n')

  let createdCourses = 0

  for (const courseData of sampleCourses) {
    try {
      const course = await prisma.course.create({
        data: {
          title: courseData.title,
          description: courseData.description,
          workload: courseData.workload,
          modality: courseData.modality,
          category: courseData.category,
          units: courseData.units,
          ownerId: adminUser.id,
        },
      })
      createdCourses++
      console.log(`✅ Course created: ${course.title}`)
    } catch (error) {
      console.error(`❌ Failed to create course ${courseData.title}:`, error)
    }
  }

  console.log(`\n✅ ${createdCourses} courses created`)

  // Mostrar estatísticas
  const totalCourses = await prisma.course.count()
  const totalUsers = await prisma.user.count()
  console.log(`\n📊 Courses in the database: ${totalCourses}`)
  console.log(`📊 Users in the database: ${totalUsers}`)

  console.log('\n🎉 Seed finished successfully!\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
