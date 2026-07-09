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
  console.error('❌ DATABASE_URL não configurado ou está como placeholder')
  console.error(`   Valor atual: ${databaseUrl || 'não encontrado'}`)
  console.error('   Configure DATABASE_URL no arquivo .env.local')
  process.exit(1)
}

console.log(`✅ DATABASE_URL carregado: ${databaseUrl.substring(0, 30)}...`)

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

const unidadesExemplo = [
  {
    id: 'unit-1',
    titulo: 'Fundamentos do Next.js',
    descricao:
      'Nesta unidade você aprenderá os conceitos fundamentais do Next.js, incluindo sua arquitetura, recursos principais e como ele se diferencia do React puro.',
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
        conteudo:
          'Next.js é um framework React para produção criado pela Vercel. Ele oferece renderização híbrida estática e do servidor, otimização automática de imagens, code splitting e muito mais. O Next.js foi projetado para resolver problemas comuns no desenvolvimento React, como configuração complexa, otimização de performance e SEO.',
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
        conteudo:
          '<ul><li><strong>Server-Side Rendering (SSR):</strong> Renderização no servidor para melhor SEO e performance inicial</li><li><strong>Static Site Generation (SSG):</strong> Geração de páginas estáticas em tempo de build</li><li><strong>Image Optimization:</strong> Otimização automática de imagens com lazy loading</li><li><strong>API Routes:</strong> Criação de APIs RESTful diretamente no projeto</li><li><strong>TypeScript Support:</strong> Suporte nativo ao TypeScript</li></ul>',
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
        conteudo:
          'O App Router é a nova arquitetura de roteamento introduzida no Next.js 13 e aprimorada no Next.js 14. Ele utiliza o sistema de arquivos para definir rotas, oferecendo layouts compartilhados, loading states, error boundaries e muito mais. Esta nova abordagem torna o desenvolvimento mais intuitivo e permite melhor organização do código.',
        ordem: 5,
        colunas: 12,
        alinhamento: 'justificado',
      },
    ],
  },
  {
    id: 'unit-2',
    titulo: 'Server Components',
    descricao:
      'Explore os React Server Components e aprenda como renderizar componentes no servidor para melhorar performance e reduzir o tamanho do bundle JavaScript.',
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
        conteudo:
          'Os Server Components são uma nova forma de criar componentes React que são renderizados exclusivamente no servidor. Diferente dos componentes tradicionais que são enviados ao cliente como JavaScript, os Server Components permanecem no servidor, reduzindo significativamente o tamanho do bundle enviado ao navegador.',
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
        conteudo:
          'As principais vantagens incluem: acesso direto a recursos do servidor (como bancos de dados e APIs internas), melhor segurança (código sensível não é enviado ao cliente), e melhor performance (menos JavaScript no cliente significa tempos de carregamento mais rápidos).',
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
        conteudo:
          'Use Server Components quando precisar: buscar dados, acessar recursos do backend, manter informações sensíveis no servidor, ou reduzir JavaScript no cliente.',
        ordem: 5,
        colunas: 6,
        alinhamento: 'justificado',
      },
      {
        id: 'content-2-8',
        tipo: 'paragrafo',
        conteudo:
          'Use Client Components quando precisar: usar hooks do React (useState, useEffect), acessar APIs do navegador, lidar com eventos de usuário, ou usar bibliotecas que dependem do cliente.',
        ordem: 5,
        colunas: 6,
        alinhamento: 'justificado',
      },
    ],
  },
  {
    id: 'unit-3',
    titulo: 'Banco de Dados e APIs',
    descricao:
      'Aprenda a integrar bancos de dados com Next.js usando Prisma ORM e como criar API Routes para construir backends completos.',
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
        conteudo:
          'Prisma é um ORM (Object-Relational Mapping) moderno e type-safe para Node.js e TypeScript. Ele oferece uma camada de abstração para trabalhar com bancos de dados relacionais, fornecendo type-safety completo, migrações automáticas e uma excelente experiência de desenvolvimento.',
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
        conteudo:
          'Para usar o Prisma em um projeto Next.js, você precisa: instalar o Prisma Client, criar um schema.prisma definindo seus modelos, configurar a conexão com o banco de dados, e gerar o cliente Prisma. O Prisma gera tipos TypeScript automaticamente baseados no seu schema, garantindo type-safety em tempo de compilação.',
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
        conteudo:
          'Next.js permite criar APIs RESTful diretamente na pasta app/api (ou pages/api na versão Pages Router). Cada arquivo route.ts (ou route.js) exporta funções nomeadas com os métodos HTTP (GET, POST, PUT, DELETE, etc.), permitindo criar backends completos sem precisar de um servidor separado.',
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
        conteudo:
          'Um exemplo básico de API Route para buscar dados do banco usando Prisma: <pre><code>export async function GET() {\n  const cursos = await prisma.curso.findMany();\n  return NextResponse.json(cursos);\n}</code></pre>',
        ordem: 7,
        colunas: 12,
        alinhamento: 'esquerda',
      },
    ],
  },
]

const cursosExemplo = [
  {
    titulo: 'Fundamentos de Python para Análise de Dados',
    descricao:
      'Aprenda Python desde o básico até análise de dados com Pandas, NumPy e visualização com Matplotlib. Ideal para iniciantes em programação.',
    cargaHoraria: '32 horas',
    modalidade: 'Online',
    categoria: 'Tecnologia',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Liderança e Gestão de Equipes',
    descricao:
      'Desenvolva habilidades essenciais de liderança. Aprenda a motivar equipes, gerenciar conflitos e alcançar resultados através de pessoas.',
    cargaHoraria: '24 horas',
    modalidade: 'Híbrido',
    categoria: 'Gestão',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Design Thinking na Prática',
    descricao:
      'Metodologia para resolver problemas complexos de forma criativa. Aprenda as 5 etapas do Design Thinking através de casos reais e workshops práticos.',
    cargaHoraria: '16 horas',
    modalidade: 'Presencial',
    categoria: 'Inovação',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Marketing Digital e Growth',
    descricao:
      'Estratégias de marketing digital para crescimento acelerado. SEO, tráfego pago, funis de conversão, métricas e otimização de campanhas.',
    cargaHoraria: '28 horas',
    modalidade: 'Online',
    categoria: 'Marketing',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Desenvolvimento Web Full Stack',
    descricao:
      'Construa aplicações web completas do zero. React, Node.js, APIs RESTful, bancos de dados e deploy em produção.',
    cargaHoraria: '80 horas',
    modalidade: 'Online',
    categoria: 'Tecnologia',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Excel Avançado para Negócios',
    descricao:
      'Domine fórmulas avançadas, tabelas dinâmicas, macros e automação. Análise de dados corporativos e relatórios profissionais.',
    cargaHoraria: '20 horas',
    modalidade: 'Híbrido',
    categoria: 'Produtividade',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Comunicação e Oratória',
    descricao:
      'Desenvolva habilidades de comunicação eficaz. Apresentações impactantes, linguagem corporal, storytelling e persuasão.',
    cargaHoraria: '12 horas',
    modalidade: 'Presencial',
    categoria: 'Soft Skills',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'UX/UI Design Moderno',
    descricao:
      'Crie experiências digitais incríveis. Pesquisa com usuários, wireframes, prototipagem no Figma e testes de usabilidade.',
    cargaHoraria: '36 horas',
    modalidade: 'Online',
    categoria: 'Design',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'Finanças Pessoais e Investimentos',
    descricao:
      'Organize suas finanças e aprenda a investir. Orçamento, controle de gastos, renda passiva e estratégias de investimento.',
    cargaHoraria: '16 horas',
    modalidade: 'Online',
    categoria: 'Finanças',
    unidades: unidadesExemplo,
  },
  {
    titulo: 'DevOps e Cloud Computing',
    descricao:
      'Automação de infraestrutura, CI/CD, Docker, Kubernetes e AWS. Práticas modernas de desenvolvimento e operações.',
    cargaHoraria: '40 horas',
    modalidade: 'Online',
    categoria: 'Tecnologia',
    unidades: unidadesExemplo,
  },
]

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n')

  // ========================================
  // PROTEÇÃO: NÃO RODAR EM PRODUÇÃO
  // ========================================

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    console.error('❌ ERRO: Seed não pode ser executado em produção!')
    console.error('   Este seed deleta TODOS os dados existentes.')
    console.error('   Para produção, crie usuários manualmente via interface ou migrations.')
    process.exit(1)
  }

  console.log('✅ Ambiente: desenvolvimento (seed permitido)\n')

  // ========================================
  // LIMPAR DADOS EXISTENTES
  // ========================================

  console.log('🗑️  Limpando cursos existentes...')
  await prisma.curso.deleteMany({})
  console.log('✅ Cursos removidos\n')

  console.log('🗑️  Limpando usuários existentes...')
  await prisma.user.deleteMany({})
  console.log('✅ Usuários removidos\n')

  // ========================================
  // CRIAR USUÁRIOS
  // ========================================

  console.log('👤 Criando usuário administrador...')
  const senhaHashAdmin = await bcrypt.hash('Admin@Senai2025!', 10)

  const usuarioAdmin = await prisma.user.create({
    data: {
      nome: 'Administrador',
      cargo: 'Administrador',
      usuario: 'admin',
      senha: senhaHashAdmin,
    },
  })

  console.log('✅ Usuário admin criado')
  console.log('   Usuário: admin')
  console.log('   Senha: Admin@Senai2025!')
  console.log(`   ID: ${usuarioAdmin.id}\n`)

  console.log('👤 Criando usuário convidado...')
  const senhaHashConvidado = await bcrypt.hash('convidado', 10)

  const usuarioConvidado = await prisma.user.create({
    data: {
      nome: 'Usuário Convidado',
      cargo: 'Convidado',
      usuario: 'convidado',
      senha: senhaHashConvidado,
    },
  })

  console.log('✅ Usuário convidado criado')
  console.log('   Usuário: convidado')
  console.log('   Senha: convidado')
  console.log(`   ID: ${usuarioConvidado.id}\n`)

  // ========================================
  // CRIAR CURSOS
  // ========================================

  console.log('✨ Criando cursos de exemplo...\n')

  let cursosCriados = 0

  for (const cursoData of cursosExemplo) {
    try {
      const curso = await prisma.curso.create({
        data: cursoData,
      })
      cursosCriados++
      console.log(`✅ Curso criado: ${curso.titulo}`)
    } catch (error) {
      console.error(`❌ Erro ao criar curso ${cursoData.titulo}:`, error)
    }
  }

  console.log(`\n✅ ${cursosCriados} cursos criados`)

  // Mostrar estatísticas
  const totalCursos = await prisma.curso.count()
  const totalUsers = await prisma.user.count()
  console.log(`\n📊 Total de cursos no banco: ${totalCursos}`)
  console.log(`📊 Total de usuários no banco: ${totalUsers}`)

  console.log('\n🎉 Seed concluído com sucesso!\n')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
