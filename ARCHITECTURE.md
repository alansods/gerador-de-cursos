# Arquitetura do Gerador de Cursos SCORM

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estrutura de Diretórios](#estrutura-de-diretórios)
4. [Arquitetura do Sistema](#arquitetura-do-sistema)
5. [Processo de Exportação SCORM](#processo-de-exportação-scorm)
6. [Componentes Principais](#componentes-principais)
7. [Serviços e APIs](#serviços-e-apis)
8. [Fluxo de Dados](#fluxo-de-dados)
9. [Banco de Dados](#banco-de-dados)
10. [Autenticação](#autenticação)

---

## 🎯 Visão Geral

Sistema web para criação, edição e exportação de cursos educacionais em formato SCORM 1.2/2004. Permite criar cursos com múltiplas unidades, diversos tipos de conteúdo (texto, imagens, vídeo, quiz, etc.) e exportar pacotes compatíveis com LMS (Moodle, Canvas, Blackboard).

### Características Principais

- ✅ Editor visual de cursos com drag-and-drop
- ✅ Exportação SCORM 1.2/2004
- ✅ Preview em tempo real
- ✅ Geração de PDF
- ✅ Sistema de autenticação
- ✅ Gestão de usuários
- ✅ Modo claro/escuro
- ✅ Responsivo (mobile-first)

---

## 🛠 Stack Tecnológico

### Frontend

- **Next.js 15.1.6** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Lucide React** - Ícones
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas

### Backend

- **Next.js API Routes** - Endpoints serverless
- **Prisma ORM** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados (Vercel Postgres)
- **bcrypt** - Hash de senhas
- **Puppeteer** - Geração de PDF
- **JSZip** - Criação de arquivos ZIP

### Build & Deploy

- **Vercel** - Hospedagem e deploy
- **pnpm** - Gerenciador de pacotes
- **ESLint** - Linting
- **TypeScript Compiler** - Type checking

---

## 📁 Estrutura de Diretórios

```
gerador-de-cursos/
├── .next/                      # Build cache do Next.js (ignorado)
├── .scorm-build/               # Arquivos temporários SCORM (ignorado)
├── node_modules/               # Dependências (ignorado)
├── out/                        # Export estático SCORM (ignorado)
├── prisma/                     # Schema do banco de dados
│   └── schema.prisma          # Definição das tabelas
├── public/                     # Assets estáticos
│   ├── scorm-images/          # Imagens baixadas para SCORM (temp)
│   └── fonts/                 # Fontes customizadas
├── src/
│   ├── app/                   # App Router do Next.js
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # Endpoints de autenticação
│   │   │   │   ├── cadastro/
│   │   │   │   ├── login/
│   │   │   │   ├── logout/
│   │   │   │   └── me/
│   │   │   ├── comments/     # API de comentários
│   │   │   ├── cursos/       # CRUD de cursos
│   │   │   ├── extract-document/  # Extração de documentos
│   │   │   ├── generate-course-from-text/  # IA para gerar cursos
│   │   │   ├── generate-pdf/ # Geração de PDF
│   │   │   ├── generate-scorm/  # ⭐ EXPORTAÇÃO SCORM
│   │   │   ├── init-db/      # Inicialização do DB
│   │   │   ├── seed-unidades/  # Seed de dados
│   │   │   ├── upload-image/ # Upload de imagens
│   │   │   └── users/        # Gestão de usuários
│   │   ├── cadastro/         # Página de registro
│   │   ├── configuracoes/    # Página de configurações
│   │   ├── cursos/           # Páginas de cursos
│   │   │   ├── [id]/
│   │   │   │   ├── editar/   # Editor de curso
│   │   │   │   └── preview/  # Preview do curso
│   │   │   └── novo/         # Criar novo curso
│   │   ├── home/             # Dashboard
│   │   ├── login/            # Página de login
│   │   ├── pdf-preview/      # Preview para PDF (Puppeteer)
│   │   ├── scorm-preview/    # ⭐ Preview standalone SCORM
│   │   │   └── unidade/
│   │   │       └── [unidadeId]/  # Página de unidade SCORM
│   │   ├── usuarios/         # Gestão de usuários
│   │   ├── layout.tsx        # Layout raiz
│   │   └── page.tsx          # Página inicial
│   ├── components/           # Componentes React
│   │   ├── ui/              # Componentes shadcn/ui
│   │   ├── AuthGuard.tsx    # Guarda de autenticação
│   │   ├── PDFTemplate.tsx  # Template PDF
│   │   ├── QuizConteudo.tsx # Componente Quiz
│   │   ├── SCORMNavbar.tsx  # ⭐ Navbar SCORM
│   │   ├── Sidebar.tsx      # Sidebar principal
│   │   ├── UnidadeConteudo.tsx  # Renderizador de conteúdo
│   │   └── ...
│   ├── context/             # Context API
│   │   ├── AuthContext.tsx  # Contexto de autenticação
│   │   └── ProgressoContext.tsx  # Contexto de progresso
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts       # Hook de autenticação
│   │   ├── useCurso.ts      # Hook de curso
│   │   ├── useLMS.ts        # ⭐ Hook SCORM LMS API
│   │   ├── usePDF.ts        # Hook de PDF
│   │   └── useTheme.ts      # Hook de tema
│   ├── lib/                 # Bibliotecas e utilitários
│   │   ├── auth-server.ts   # Autenticação server-side
│   │   ├── pdf-service.ts   # Serviço de PDF
│   │   ├── prisma.ts        # Cliente Prisma
│   │   ├── scorm-build-service.ts  # ⭐ Serviço de build SCORM
│   │   ├── scorm-service.ts        # ⭐ Geração de manifesto SCORM
│   │   └── utils.ts         # Utilitários gerais
│   ├── types/               # Definições TypeScript
│   │   ├── gerador-curso.ts # ⭐ Tipos do curso
│   │   └── ...
│   └── styles/              # Estilos globais
│       └── globals.css
├── .env.local               # Variáveis de ambiente (não commitado)
├── .gitignore
├── eslint.config.mjs        # Configuração ESLint
├── next.config.ts           # ⭐ Configuração Next.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── test-scorm-export.js     # Script de teste SCORM
├── test-scorm-local.js      # Script de teste local
├── ARCHITECTURE.md          # 📖 Este documento
└── SCORM-WORKFLOW.md        # 📖 Workflow SCORM
```

---

## 🏗 Arquitetura do Sistema

### Arquitetura em Camadas

```
┌─────────────────────────────────────────┐
│         Camada de Apresentação          │
│  (Next.js Pages, React Components)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Camada de Aplicação             │
│  (Hooks, Context, State Management)     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Camada de Serviços              │
│  (API Routes, Business Logic)           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Camada de Dados                 │
│  (Prisma ORM, PostgreSQL)               │
└─────────────────────────────────────────┘
```

### Fluxo de Requisição

```
Browser → Next.js Router → API Route → Service Layer → Prisma → PostgreSQL
   ↑                                                                    ↓
   └────────────────────── Response ←──────────────────────────────────┘
```

---

## 🎬 Processo de Exportação SCORM

### Visão Geral do Fluxo

O processo de exportação SCORM é dividido em 5 fases principais:

```
┌────────────┐    ┌─────────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐
│  FASE 1    │ → │   FASE 2    │ → │  FASE 3  │ → │ FASE 4  │ → │ FASE 5  │
│  Imagens   │   │  Build Next │   │Verificar │   │  Criar  │   │ Limpeza │
│            │   │             │   │          │   │   ZIP   │   │         │
└────────────┘   └─────────────┘   └──────────┘   └─────────┘   └─────────┘
```

### Implementação Detalhada

#### 1. Endpoint de Exportação

**Arquivo:** `src/app/api/generate-scorm/route.ts`

```typescript
export async function POST(req: Request) {
  // 1. Receber dados do curso
  const { curso } = await req.json();

  // 2. Processar imagens (FASE 1)
  const { curso: cursoComImagensLocais } = await downloadAndUpdateImages(curso, curso.id);

  // 3. Build estático (FASE 2)
  await executeNextBuild(cursoComImagensLocais, curso.id);

  // 4. Verificar build (FASE 3)
  await verifyBuildOutput();

  // 5. Criar ZIP SCORM (FASE 4)
  const zip = new JSZip();

  // 5.1. Adicionar manifesto
  const manifestContent = generateManifest(cursoComImagensLocais);
  zip.file('imsmanifest.xml', manifestContent);

  // 5.2. Adicionar SCORM API wrapper
  const wrapperContent = generateScormWrapper();
  zip.file('scorm_api_wrapper.js', wrapperContent);

  // 5.3. Adicionar XSDs
  const xsds = getXSDs();
  for (const [filename, content] of Object.entries(xsds)) {
    zip.file(filename, content);
  }

  // 5.4. Copiar arquivos do build
  await copyBuildFilesToZip(zip, curso.id);

  // 5.5. Gerar ZIP
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  // 6. Limpar temporários (FASE 5)
  await cleanupTempFiles(curso.id);

  // 7. Retornar ZIP
  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${curso.titulo}_SCORM.zip"`
    }
  });
}
```

#### FASE 1: Download e Processamento de Imagens

**Arquivo:** `src/lib/scorm-build-service.ts`

**Função:** `downloadAndUpdateImages(curso, cursoId)`

**Objetivo:** Baixar imagens externas (URLs) e convertê-las para caminhos locais.

**Processo:**

```typescript
// 1. Detectar todas as URLs de imagens no curso
const imageUrls = detectImageUrls(curso);
// Exemplo: ["https://example.com/image1.jpg", "https://example.com/image2.png"]

// 2. Criar diretório público para imagens
const publicDir = `public/scorm-images/${cursoId}/`;
await fs.mkdir(publicDir, { recursive: true });

// 3. Baixar cada imagem
for (const url of imageUrls) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  // Gerar nome único baseado no hash da URL
  const filename = `image-${index}-${hash(url)}.jpg`;

  // Salvar no sistema de arquivos
  await fs.writeFile(`${publicDir}/${filename}`, buffer);

  // Mapear URL original → caminho local
  imageMap.set(url, `/scorm-images/${cursoId}/${filename}`);
}

// 4. Atualizar referências no objeto curso
curso.unidades.forEach(unidade => {
  unidade.conteudo.forEach(conteudo => {
    if (conteudo.tipo === 'imagem' && conteudo.conteudo) {
      const newPath = imageMap.get(conteudo.conteudo);
      if (newPath) {
        conteudo.conteudo = newPath;  // Atualiza URL para caminho local
      }
    }
  });
});
```

**Resultado:**
- Imagens baixadas em `public/scorm-images/{cursoId}/`
- Objeto curso com caminhos locais atualizados

#### FASE 2: Build Estático do Next.js

**Função:** `executeNextBuild(curso, cursoId)`

**Objetivo:** Gerar HTML estático do curso usando Next.js export.

**Processo:**

```typescript
// 1. Salvar curso em arquivo temporário
const tempFile = `.scorm-build/curso-${cursoId}.json`;
await fs.writeFile(tempFile, JSON.stringify(curso));

// 2. Ocultar pastas problemáticas
// Mover /api, /pdf-preview, /cursos/[id] para fora de src/app
const hiddenDirs = await hideApiRoutes();
await hideProblematicPages();

// 3. Configurar variáveis de ambiente
const env = {
  NODE_ENV: 'production',
  NEXT_OUTPUT_EXPORT: 'true',           // Ativa modo export
  SCORM_BUILD_CURSO_FILE: tempFile      // Curso a ser renderizado
};

// 4. Executar build
exec('next build --no-lint', { env }, async (error, stdout) => {
  if (error) {
    // Restaurar pastas e retornar erro
    await restoreApiRoutes(hiddenDirs);
    reject(error);
  }

  // 5. Restaurar pastas movidas
  await restoreApiRoutes(hiddenDirs);
  await restoreProblematicPages();

  resolve();
});
```

**Como funciona o Export:**

1. **next.config.ts** detecta `NEXT_OUTPUT_EXPORT='true'`
2. Ativa `output: 'export'` para build estático
3. Next.js gera HTML puro (sem server-side)
4. Arquivos salvos em `out/`

**Estrutura gerada em `out/`:**

```
out/
├── scorm-preview.html          # Página inicial do curso
├── scorm-preview/
│   └── unidade/
│       ├── unidade-1.html      # Unidade 1
│       ├── unidade-2.html      # Unidade 2
│       └── ...
├── _next/
│   └── static/
│       ├── chunks/              # JavaScript bundles
│       ├── css/                 # Estilos CSS
│       └── media/               # Assets (fontes, imagens)
└── ...
```

**Por que ocultar pastas?**

- `/api/` - Não pode ser exportado estaticamente (server-side only)
- `/pdf-preview/` - Usa `useSearchParams()` que requer server
- `/cursos/[id]/` - Rotas dinâmicas que não devem ser exportadas

#### FASE 3: Verificação do Build

**Função:** `verifyBuildOutput()`

**Objetivo:** Garantir que o diretório `out/` foi criado com sucesso.

```typescript
const outDir = path.join(process.cwd(), 'out');
const exists = await fs.stat(outDir).then(() => true).catch(() => false);

if (!exists) {
  throw new Error('Build não foi criado. Diretório out/ não encontrado.');
}
```

#### FASE 4: Criação do Pacote SCORM

**Função:** `copyBuildFilesToZip(zip, cursoId)`

**Objetivo:** Montar o arquivo ZIP SCORM com todos os componentes necessários.

**4.1. Gerar Manifesto SCORM**

**Arquivo:** `src/lib/scorm-service.ts`

**Função:** `generateManifest(curso)`

```typescript
function generateManifest(curso: CursoGerado): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="curso_${curso.id}" version="1.0"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
    <lom>
      <general>
        <title><langstring>${curso.titulo}</langstring></title>
        <description><langstring>${curso.descricao}</langstring></description>
      </general>
    </lom>
  </metadata>

  <organizations default="org_default">
    <organization identifier="org_default">
      <title>${curso.titulo}</title>

      ${curso.unidades.map(unidade => `
      <item identifier="${unidade.id}" identifierref="resource_${unidade.id}">
        <title>${unidade.titulo}</title>
      </item>
      `).join('')}

    </organization>
  </organizations>

  <resources>
    <resource identifier="resource_index" type="webcontent"
              adlcp:scormtype="asset" href="index.html">
      <file href="index.html"/>
      <file href="scorm_api_wrapper.js"/>
    </resource>

    ${curso.unidades.map(unidade => `
    <resource identifier="resource_${unidade.id}" type="webcontent"
              adlcp:scormtype="sco" href="scorm-preview/unidade/${unidade.id}.html">
      <file href="scorm-preview/unidade/${unidade.id}.html"/>
      <file href="scorm_api_wrapper.js"/>
    </resource>
    `).join('')}
  </resources>

</manifest>`;
}
```

**Componentes do Manifesto:**

- **metadata:** Informações sobre o curso
- **organizations:** Hierarquia do curso (unidades)
- **resources:** Arquivos HTML e assets

**4.2. Gerar SCORM API Wrapper**

**Função:** `generateScormWrapper()`

```typescript
function generateScormWrapper(): string {
  return `
// SCORM 1.2 API Wrapper
var API = null;

function findAPI(win) {
  while (win.API == null && win.parent != null && win.parent != win) {
    win = win.parent;
  }
  return win.API;
}

function getAPI() {
  if (API == null) {
    API = findAPI(window);
  }
  return API;
}

function initSCORM() {
  var api = getAPI();
  if (api != null) {
    api.LMSInitialize("");
    api.LMSSetValue("cmi.core.lesson_status", "incomplete");
  }
}

function finishSCORM() {
  var api = getAPI();
  if (api != null) {
    api.LMSSetValue("cmi.core.lesson_status", "completed");
    api.LMSFinish("");
  }
}

// Auto-inicializar quando a página carregar
window.addEventListener('load', initSCORM);
window.addEventListener('beforeunload', finishSCORM);
`;
}
```

**4.3. Adicionar Arquivos XSD**

Schemas de validação SCORM:
- `imscp_rootv1p1p2.xsd`
- `adlcp_rootv1p2.xsd`
- `imsmd_rootv1p2p1.xsd`

**4.4. Copiar Arquivos do Build**

```typescript
async function copyBuildFilesToZip(zip: JSZip, cursoId: string) {
  const outDir = 'out/';

  // 1. Copiar página principal
  let scormPreviewHtml = await fs.readFile('out/scorm-preview.html', 'utf-8');

  // Converter caminhos absolutos para relativos
  scormPreviewHtml = convertAbsolutePathsToRelative(scormPreviewHtml, '../');

  zip.file('scorm-preview/index.html', scormPreviewHtml);

  // 2. Copiar páginas de unidades
  const unidadeFiles = await fs.readdir('out/scorm-preview/unidade/');
  for (const file of unidadeFiles) {
    let content = await fs.readFile(`out/scorm-preview/unidade/${file}`, 'utf-8');
    content = convertAbsolutePathsToRelative(content, '../../');
    zip.file(`scorm-preview/unidade/${file}`, content);
  }

  // 3. Copiar assets estáticos (_next/static)
  await addDirectoryToZip(outDir + '_next/static', '_next/static');

  // 4. Copiar imagens baixadas
  await addDirectoryToZip(`public/scorm-images/${cursoId}`, 'scorm-images');

  // 5. Criar index.html de redirecionamento
  const redirectHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0; url=scorm-preview/index.html">
      </head>
      <body>
        <a href="scorm-preview/index.html">Iniciar curso</a>
      </body>
    </html>
  `;
  zip.file('index.html', redirectHtml);
}
```

**Por que converter caminhos?**

LMS podem colocar o SCORM em subpastas. Caminhos absolutos (`/_next/static/...`) não funcionam.

**Conversão:**
- `/_next/static/chunk.js` → `../_next/static/chunk.js` (1 nível)
- `/_next/static/chunk.js` → `../../_next/static/chunk.js` (2 níveis)

**4.5. Gerar Arquivo ZIP**

```typescript
const zipBuffer = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 }  // Máxima compressão
});
```

#### FASE 5: Limpeza

**Função:** `cleanupTempFiles(cursoId)`

**Objetivo:** Remover arquivos temporários.

```typescript
// 1. Remover imagens baixadas
await fs.rm(`public/scorm-images/${cursoId}`, { recursive: true });

// 2. Remover arquivo JSON do curso
await fs.unlink(`.scorm-build/curso-${cursoId}.json`);

// 3. (Opcional) Remover diretório out/
// await fs.rm('out/', { recursive: true });
```

### Estrutura Final do ZIP SCORM

```
curso-scorm.zip
├── imsmanifest.xml             # ⭐ Manifesto SCORM (obrigatório)
├── index.html                  # Página de entrada
├── scorm_api_wrapper.js        # ⭐ API JavaScript SCORM
├── imscp_rootv1p1p2.xsd       # Schema XSD
├── adlcp_rootv1p2.xsd         # Schema XSD
├── imsmd_rootv1p2p1.xsd       # Schema XSD
├── scorm-preview/
│   ├── index.html             # Página inicial do curso
│   └── unidade/
│       ├── unidade-1.html     # HTML da unidade 1
│       ├── unidade-2.html     # HTML da unidade 2
│       └── unidade-3.html     # HTML da unidade 3
├── _next/
│   └── static/
│       ├── chunks/            # JavaScript bundles
│       │   ├── framework.js
│       │   ├── main.js
│       │   └── ...
│       ├── css/               # Estilos compilados
│       │   └── app.css
│       └── media/             # Fontes e assets
│           └── fonts/
└── scorm-images/              # Imagens do curso (se houver)
    ├── image-1-hash123.jpg
    └── image-2-hash456.png
```

---

## 📦 Componentes Principais

### 1. Editor de Curso

**Arquivo:** `src/app/cursos/[id]/editar/page.tsx`

**Responsabilidades:**
- Editar informações do curso (título, descrição, etc.)
- Adicionar/remover/reordenar unidades
- Adicionar diferentes tipos de conteúdo
- Botão "Exportar SCORM"

**Tipos de Conteúdo Suportados:**

```typescript
type TipoConteudo =
  | 'titulo'
  | 'subtitulo'
  | 'paragrafo'
  | 'lista'
  | 'imagem'
  | 'video'
  | 'citacao'
  | 'destaque'
  | 'codigo'
  | 'tabela'
  | 'separador'
  | 'quiz'
  | 'flipcard'
  | 'acordeao';
```

### 2. Preview SCORM

**Arquivos:**
- `src/app/scorm-preview/page.tsx` - Página inicial
- `src/app/scorm-preview/unidade/[unidadeId]/page.tsx` - Página de unidade

**Como funciona:**

```typescript
// Durante o build SCORM, lê do arquivo temporário
export default async function SCORMPreviewPage() {
  let curso: CursoGerado | null = null;

  if (process.env.SCORM_BUILD_CURSO_FILE) {
    const cursoData = await fs.readFile(process.env.SCORM_BUILD_CURSO_FILE, 'utf-8');
    curso = JSON.parse(cursoData);
  }

  return <div>
    <SCORMNavbar curso={curso} />
    {/* Renderizar unidades */}
  </div>;
}
```

**Geração de Rotas Estáticas:**

```typescript
export async function generateStaticParams() {
  if (process.env.SCORM_BUILD_CURSO_FILE) {
    const curso = JSON.parse(await fs.readFile(process.env.SCORM_BUILD_CURSO_FILE));

    // Retornar array com todas as unidades
    return curso.unidades.map(unidade => ({
      unidadeId: unidade.id
    }));
  }

  return [];
}
```

### 3. SCORM Navbar

**Arquivo:** `src/components/SCORMNavbar.tsx`

**Funcionalidades:**
- Menu lateral com lista de unidades
- Nome do aluno (via SCORM API)
- Integração com LMS

**Hook SCORM LMS:**

```typescript
// src/hooks/useLMS.ts
export function useLMS() {
  const [learnerName, setLearnerName] = useState('Aluno');

  useEffect(() => {
    // Buscar API SCORM do LMS
    let api = null;

    // SCORM 2004
    if (window.parent?.API_1484_11) {
      api = window.parent.API_1484_11;
      const name = api.GetValue('cmi.learner_name');
      setLearnerName(name);
    }

    // SCORM 1.2
    if (window.parent?.API) {
      api = window.parent.API;
      const name = api.LMSGetValue('cmi.core.student_name');
      setLearnerName(name);
    }
  }, []);

  return { learnerName };
}
```

### 4. Renderizador de Conteúdo

**Arquivo:** `src/components/UnidadeConteudo.tsx`

**Responsabilidade:** Renderizar cada tipo de conteúdo da unidade.

```typescript
export function UnidadeConteudo({ unidade }) {
  return (
    <div>
      {unidade.conteudo.map(item => {
        switch (item.tipo) {
          case 'titulo':
            return <h1>{item.conteudo}</h1>;

          case 'paragrafo':
            return <p>{item.conteudo}</p>;

          case 'imagem':
            return <img src={item.conteudo} alt={item.alt} />;

          case 'video':
            return <video src={item.conteudo} controls />;

          case 'quiz':
            return <QuizConteudo quiz={item} />;

          case 'flipcard':
            return <FlipCard {...item} />;

          // ... outros tipos
        }
      })}
    </div>
  );
}
```

---

## 🔌 Serviços e APIs

### API de Cursos

**Endpoint:** `GET /api/cursos`

```typescript
// Listar cursos com paginação e filtros
GET /api/cursos?page=1&limit=10&search=react&category=programacao

Response:
{
  cursos: [...],
  total: 45,
  totalPages: 5,
  currentPage: 1
}
```

**Endpoint:** `POST /api/cursos`

```typescript
// Criar novo curso
POST /api/cursos
Body: {
  titulo: "Curso de React",
  descricao: "Aprenda React do zero",
  cargaHoraria: "40 horas",
  modalidade: "Online",
  categoria: "Programação"
}
```

**Endpoint:** `POST /api/generate-scorm`

```typescript
// Exportar curso para SCORM
POST /api/generate-scorm
Body: {
  curso: {
    id: "abc123",
    titulo: "Meu Curso",
    unidades: [...]
  }
}

Response: ZIP file (application/zip)
```

### API de Autenticação

**Endpoint:** `POST /api/auth/login`

```typescript
POST /api/auth/login
Body: {
  usuario: "admin@edu.com",
  senha: "senha123"
}

Response:
{
  success: true,
  user: {
    id: "xyz",
    nome: "Admin",
    cargo: "Administrador"
  }
}
```

---

## 🔄 Fluxo de Dados

### Fluxo de Exportação SCORM

```
┌──────────────┐
│  Navegador   │
│  (Cliente)   │
└──────┬───────┘
       │ 1. Click "Exportar SCORM"
       ↓
┌──────────────────────────────────────┐
│  Frontend (React)                     │
│  - Pega dados do curso                │
│  - Envia POST /api/generate-scorm     │
└───────────────┬──────────────────────┘
                │ 2. Request com objeto curso
                ↓
┌─────────────────────────────────────────────┐
│  API Route (/api/generate-scorm)            │
│  ┌─────────────────────────────────────┐   │
│  │ FASE 1: Download de Imagens         │   │
│  │ - Detecta URLs externas             │   │
│  │ - Baixa para public/scorm-images/   │   │
│  │ - Atualiza referências no curso     │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ FASE 2: Build Next.js                │   │
│  │ - Salva curso em .scorm-build/       │   │
│  │ - Oculta pastas problemáticas        │   │
│  │ - Executa: next build --no-lint      │   │
│  │ - Gera HTML estático em out/         │   │
│  │ - Restaura pastas                    │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ FASE 3: Verificação                  │   │
│  │ - Verifica se out/ existe            │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ FASE 4: Criar ZIP SCORM              │   │
│  │ - Gera imsmanifest.xml               │   │
│  │ - Adiciona scorm_api_wrapper.js      │   │
│  │ - Adiciona XSDs                      │   │
│  │ - Copia HTML de out/                 │   │
│  │ - Copia assets (_next/static)        │   │
│  │ - Copia imagens baixadas             │   │
│  │ - Gera arquivo ZIP                   │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ FASE 5: Limpeza                      │   │
│  │ - Remove imagens temporárias         │   │
│  │ - Remove arquivo JSON do curso       │   │
│  └─────────────────────────────────────┘   │
└───────────────┬─────────────────────────────┘
                │ 3. Response com ZIP
                ↓
┌──────────────────────────────────────┐
│  Navegador                            │
│  - Recebe arquivo ZIP                 │
│  - Inicia download automático         │
└──────────────────────────────────────┘
```

---

## 🗄 Banco de Dados

### Schema Prisma

**Arquivo:** `prisma/schema.prisma`

```prisma
// Cursos
model Curso {
  id                String   @id @default(cuid())
  titulo            String
  descricao         String?
  cargaHoraria      String?  @map("carga_horaria")
  modalidade        String?
  categoria         String?
  unidades          Json     // Array de unidades serializado
  dataCriacao       DateTime @default(now()) @map("data_criacao")
  dataModificacao   DateTime @updatedAt @map("data_modificacao")

  @@map("cursos")
}

// Usuários
model User {
  id        String   @id @default(cuid())
  nome      String
  cargo     String?
  usuario   String   @unique
  senha     String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

### Estrutura JSON de Unidades

```json
{
  "unidades": [
    {
      "id": "unidade-1",
      "titulo": "Introdução",
      "descricao": "Primeira unidade",
      "ordem": 1,
      "conteudo": [
        {
          "id": "conteudo-1",
          "tipo": "titulo",
          "conteudo": "Bem-vindo",
          "ordem": 1
        },
        {
          "id": "conteudo-2",
          "tipo": "paragrafo",
          "conteudo": "Este é o conteúdo...",
          "ordem": 2
        },
        {
          "id": "conteudo-3",
          "tipo": "imagem",
          "conteudo": "/scorm-images/curso-123/image-1.jpg",
          "alt": "Descrição da imagem",
          "ordem": 3
        }
      ]
    }
  ]
}
```

---

## 🔐 Autenticação

### Fluxo de Autenticação

```
┌─────────┐     ┌──────────┐     ┌─────────┐
│ Cliente │────>│   API    │────>│ Prisma  │
└─────────┘     │  /login  │     └─────────┘
    │           └──────────┘           │
    │ 1. POST                          │
    │    usuario + senha               │
    │                                  │
    │           ┌──────────┐           │
    │<──────────│  Buscar  │<──────────│
    │           │ usuário  │           │
    │           └──────────┘           │
    │                │                 │
    │           ┌────v─────┐           │
    │           │ Verificar│           │
    │           │  bcrypt  │           │
    │           └────┬─────┘           │
    │                │                 │
    │           ┌────v─────┐           │
    │<──────────│  Criar   │           │
    │           │  Cookie  │           │
    │           └──────────┘           │
    │                                  │
    │ 2. Response                      │
    │    Set-Cookie: auth_token=...    │
    │                                  │
```

### Middleware de Autenticação

**Arquivo:** `src/components/AuthGuard.tsx`

```typescript
export function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Verificar se é rota SCORM (não requer autenticação)
  const isScormBuild = process.env.SCORM_BUILD_CURSO_FILE;
  const isScormRoute = pathname?.startsWith('/scorm-preview');

  if (isScormBuild || isScormRoute) {
    return <>{children}</>;
  }

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!loading && !isAuthenticated && !isPublicRoute) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
```

---

## ⚙️ Configuração do Next.js

**Arquivo:** `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  // Ativar export estático apenas durante build SCORM
  ...(process.env.NEXT_OUTPUT_EXPORT === 'true' ? {
    output: 'export',
    distDir: '.next',
  } : {}),

  // Desabilitar otimização de imagens (necessário para export)
  images: {
    unoptimized: true,
  },

  // Headers CORS (apenas em modo normal, não export)
  ...(process.env.NEXT_OUTPUT_EXPORT !== 'true' ? {
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: '*' },
            // ... outros headers
          ],
        },
      ];
    },
  } : {}),
};
```

---

## 🚀 Deploy

### Variáveis de Ambiente Necessárias

```env
# Banco de dados
DATABASE_URL="postgresql://user:pass@host:5432/db"
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# Next.js
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"

# (Opcional) Configurações SCORM
SCORM_BUILD_CURSO_FILE=""  # Usado apenas durante export
NEXT_OUTPUT_EXPORT=""      # Usado apenas durante export
```

### Build e Deploy

```bash
# 1. Instalar dependências
pnpm install

# 2. Gerar Prisma Client
npx prisma generate

# 3. Build de produção (web app)
pnpm build

# 4. Deploy (Vercel)
vercel deploy --prod
```

---

## 📝 Notas Técnicas

### Por que o servidor precisa reiniciar após export SCORM?

O build SCORM executa `next build` com `output: 'export'`, gerando arquivos no diretório `out/`. Isso corrompe o cache do servidor de desenvolvimento (.next/), causando erros 404/500 ao tentar acessar módulos que foram movidos ou deletados.

**Solução:** Sempre limpar o cache e reiniciar.

```bash
rm -rf .next out
pnpm dev
```

### Limitações do SCORM

- ✅ Suporta SCORM 1.2 e 2004
- ❌ Não suporta server-side rendering (SSR)
- ❌ Não suporta API routes
- ❌ Todos os assets devem ser estáticos
- ✅ JavaScript client-side funciona normalmente

### Performance

**Tempo médio de exportação:**
- Curso pequeno (3 unidades): ~15 segundos
- Curso médio (10 unidades): ~30 segundos
- Curso grande (20+ unidades): ~60 segundos

**Tamanho típico do ZIP:**
- Sem imagens: 0.5 - 1 MB
- Com imagens: 2 - 10 MB
- Limite Vercel: 300s (5 minutos)

---

## 📚 Referências

- [SCORM 1.2 Specification](https://scorm.com/scorm-explained/technical-scorm/scorm-12-overview-for-developers/)
- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Deployment](https://vercel.com/docs)

---

**Última atualização:** 2025-11-12
**Versão:** 1.0.0
**Branch:** release/scorm-v1.0-stable
