# Estrutura do Projeto - Gerador de Cursos SCORM

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Componentes Principais](#componentes-principais)
5. [Contextos (State Management)](#contextos-state-management)
6. [Hooks Customizados](#hooks-customizados)
7. [API Routes](#api-routes)
8. [Banco de Dados](#banco-de-dados)
9. [Tipos TypeScript](#tipos-typescript)
10. [Fluxo de Dados](#fluxo-de-dados)
11. [Funcionalidades Principais](#funcionalidades-principais)

---

## 🎯 Visão Geral

Este é um projeto **Next.js 16** com **App Router** para criação e gerenciamento de cursos online. O sistema permite:

- ✅ Criar e editar cursos com múltiplas unidades
- ✅ Adicionar diversos tipos de conteúdo (texto, imagens, quizzes, flipcards, etc.)
- ✅ Exportar cursos em formato PDF
- ✅ Exportar cursos em formato SCORM 1.2
- ✅ Visualizar prévia dos cursos
- ✅ Autenticação de usuários
- ✅ Gerenciamento de cursos com busca e filtros

**Stack Tecnológica:**
- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **Banco de Dados:** PostgreSQL com Prisma ORM
- **UI:** React 19, Tailwind CSS, Radix UI
- **Autenticação:** JWT (JSON Web Tokens)
- **PDF:** jsPDF, Puppeteer
- **SCORM:** JSZip, SCORM 1.2 API
- **IA:** Google Generative AI (Gemini)

---

## 🏗️ Arquitetura

O projeto segue a arquitetura do **Next.js App Router**:

```
src/
├── app/              # App Router (rotas e páginas)
├── components/        # Componentes React reutilizáveis
├── context/          # Context API para estado global
├── hooks/            # Custom hooks
├── lib/              # Utilitários e serviços
└── types/            # Definições TypeScript
```

**Fluxo de Arquitetura:**
1. **Páginas** (`app/`) → Renderizam componentes
2. **Componentes** → Usam contextos e hooks
3. **Contextos** → Gerenciam estado global
4. **Hooks** → Lógica reutilizável
5. **API Routes** → Backend (Server Actions)
6. **Prisma** → Acesso ao banco de dados

---

## 📁 Estrutura de Pastas

### **Raiz do Projeto**

```
Gerador-de-Cursos/
├── prisma/              # Schema e migrações do Prisma
│   ├── schema.prisma    # Schema do banco de dados
│   └── migrations/      # Histórico de migrações
├── public/              # Arquivos estáticos
│   ├── roteiro/        # Exemplos de roteiros de curso
│   └── scorm/          # Arquivos SCORM (se houver)
├── scripts/             # Scripts utilitários
│   ├── create-user.ts  # Script para criar usuários
│   └── create-docx-example.js  # Exemplo de criação de DOCX
├── src/                 # Código-fonte principal
└── package.json        # Dependências e scripts
```

### **src/app/** - App Router (Páginas)

```
app/
├── layout.tsx              # Layout raiz (providers)
├── page.tsx                # Página inicial (redireciona)
├── globals.css             # Estilos globais
│
├── api/                    # API Routes (Backend)
│   ├── auth/              # Autenticação
│   │   ├── login/route.ts
│   │   ├── logout/route.ts
│   │   ├── cadastro/route.ts
│   │   └── me/route.ts
│   ├── cursos/            # CRUD de cursos
│   │   └── [id]/route.ts
│   ├── generate-course-from-text/route.ts  # Geração por IA
│   ├── generate-pdf/route.ts               # Exportação PDF
│   ├── generate-scorm/route.ts             # Exportação SCORM
│   ├── upload-image/route.ts               # Upload de imagens
│   ├── extract-document/route.ts           # Extração de DOCX
│   └── seed-unidades/route.ts              # Seed de dados
│
├── home/                   # Dashboard
│   └── page.tsx
├── login/                  # Página de login
│   └── page.tsx
├── cadastro/               # Página de cadastro
│   └── page.tsx
├── cursos/                 # Gestão de cursos
│   ├── page.tsx           # Lista de cursos
│   ├── novo/page.tsx      # Criar novo curso
│   └── [id]/              # Detalhes/Edição
│       ├── editar/page.tsx
│       └── preview/       # Visualização
│           ├── page.tsx
│           └── unidade/[unidadeId]/page.tsx
├── usuarios/                # Gestão de usuários
│   └── page.tsx
└── configuracoes/          # Configurações
    └── page.tsx
```

### **src/components/** - Componentes React

```
components/
├── ui/                     # Componentes base (Radix UI)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
│
├── layout/                 # Componentes de layout
│   ├── Navbar.tsx
│   └── PageLayout.tsx
│
├── Sidebar.tsx             # Menu lateral
├── CourseCard.tsx          # Card de curso
├── ExportModal.tsx         # Modal de exportação
├── PreviewCurso.tsx        # Preview de curso
├── MenuConteudo.tsx        # Menu de conteúdo (edição)
├── MenuUnidade.tsx         # Menu de unidade (edição)
├── QuizConteudo.tsx        # Editor de quiz
├── AuthGuard.tsx           # Proteção de rotas
└── ...
```

### **src/context/** - State Management

```
context/
├── AuthContext.tsx         # Autenticação e usuário
├── GeradorCursoContext.tsx # Estado dos cursos
└── ProgressoContext.tsx    # Progresso dos alunos
```

### **src/hooks/** - Custom Hooks

```
hooks/
├── usePDF.ts               # Geração de PDF
├── useSCORM.ts             # Geração de SCORM
├── usePreview.ts           # Preview de cursos
├── useTheme.ts             # Tema (dark/light)
├── useModalAnimation.ts    # Animações de modal
├── useUnidadeFromRoute.ts  # Extração de unidade da rota
└── index.ts                # Re-exportações
```

### **src/lib/** - Utilitários e Serviços

```
lib/
├── prisma.ts               # Cliente Prisma (singleton)
├── pdf-service.ts          # Serviço de geração de PDF
├── scorm-service.ts        # Serviço de geração de SCORM
├── api.ts                  # Cliente API (se houver)
└── utils.ts                # Funções utilitárias
```

### **src/types/** - Definições TypeScript

```
types/
├── gerador-curso.ts        # Tipos de cursos, unidades, conteúdo
├── curso.ts                # Tipos relacionados a cursos
├── aula.ts                 # Tipos de aulas
└── modulo.ts               # Tipos de módulos
```

---

## 🧩 Componentes Principais

### **1. Sidebar.tsx**
**Localização:** `src/components/Sidebar.tsx`

**Função:** Menu lateral da aplicação com navegação principal.

**Funcionalidades:**
- Navegação entre páginas (Início, Cursos, Usuários, Configurações)
- Toggle de modo escuro/claro
- Fixar/desafixar sidebar
- Informações do usuário logado
- Responsivo (colapsa quando não está fixado)

**Props:** Nenhuma (usa hooks internos)

**Hooks utilizados:**
- `useTheme()` - Gerenciamento de tema
- `useAuth()` - Autenticação
- `useRouter()` - Navegação

---

### **2. CourseCard.tsx**
**Localização:** `src/components/CourseCard.tsx`

**Função:** Card exibido na lista de cursos.

**Props:**
```typescript
interface CourseCardProps {
  title: string;
  description: string;
  category: string;
  duration: string;
  units: number;
  format: string;
  onPreview?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}
```

**Funcionalidades:**
- Exibe informações do curso (título, descrição, categoria, etc.)
- Botões de ação (Preview, Editar, Excluir, Exportar)
- Truncamento de texto longo
- Tooltips informativos

---

### **3. ExportModal.tsx**
**Localização:** `src/components/ExportModal.tsx`

**Função:** Modal para exportação de cursos (PDF, SCORM).

**Props:**
```typescript
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPDF: (filename: string) => Promise<void> | void;
  onExportSCORM?: (filename: string) => Promise<void> | void;
  courseName: string;
  isGeneratingPDF?: boolean;
  isGeneratingSCORM?: boolean;
}
```

**Funcionalidades:**
- Seleção de formato de exportação (PDF, SCORM)
- Input de nome do arquivo
- Validação e sanitização de nomes
- Estados de loading para PDF e SCORM
- Suporte completo para exportação SCORM 1.2

---

### **4. PreviewCurso.tsx**
**Localização:** `src/components/PreviewCurso.tsx`

**Função:** Componente para visualizar curso completo.

**Funcionalidades:**
- Renderiza todas as unidades e conteúdos
- Navegação entre unidades
- Suporte a todos os tipos de conteúdo (quiz, flipcard, etc.)

---

### **5. MenuConteudo.tsx**
**Localização:** `src/components/MenuConteudo.tsx`

**Função:** Menu de ações para conteúdo dentro de uma unidade.

**Funcionalidades:**
- Editar conteúdo
- Deletar conteúdo
- Mover conteúdo para cima/baixo
- Alterar layout (colunas)

**Props:**
```typescript
{
  unidade: Unidade;
  item: ConteudoUnidade;
  itemIndex: number;
  handleMoverConteudoAcima: (unidadeId: string, index: number) => void;
  handleMoverConteudoAbaixo: (unidadeId: string, index: number) => void;
  handleDeletarConteudo: (unidadeId: string, conteudoId: string) => void;
  editarConteudo: (unidadeId: string, conteudoId: string, data: Partial<ConteudoUnidade>) => void;
  setEditandoConteudo: (data: {...}) => void;
}
```

---

### **6. QuizConteudo.tsx**
**Localização:** `src/components/QuizConteudo.tsx`

**Função:** Editor e visualizador de quizzes.

**Funcionalidades:**
- Criar/editar perguntas
- Adicionar opções de resposta
- Marcar resposta correta
- Adicionar feedback por opção
- Adicionar dicas

---

### **7. AuthGuard.tsx**
**Localização:** `src/components/AuthGuard.tsx`

**Função:** Proteção de rotas que requerem autenticação.

**Funcionalidades:**
- Verifica se usuário está autenticado
- Redireciona para login se não autenticado
- Mostra loading durante verificação

---

## 🔄 Contextos (State Management)

### **1. AuthContext.tsx**
**Localização:** `src/context/AuthContext.tsx`

**Função:** Gerenciamento de autenticação e sessão do usuário.

**Estado:**
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (usuario: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

**Funcionalidades:**
- Login/logout
- Verificação de autenticação
- Armazenamento de token JWT
- Atualização automática ao mudar de rota

**Uso:**
```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

---

### **2. GeradorCursoContext.tsx**
**Localização:** `src/context/GeradorCursoContext.tsx`

**Função:** Gerenciamento centralizado de todos os cursos.

**Estado:**
```typescript
interface GeradorCursoState {
  cursos: CursoGerado[];
  cursoAtual: CursoGerado | null;
  modoEdicao: boolean;
  loading: boolean;
  error: string | null;
}
```

**Ações disponíveis:**
- `criarCurso()` - Criar novo curso
- `editarCurso()` - Editar curso existente
- `deletarCurso()` - Deletar curso
- `selecionarCurso()` - Selecionar curso para edição
- `adicionarUnidade()` - Adicionar unidade ao curso
- `editarUnidade()` - Editar unidade
- `deletarUnidade()` - Deletar unidade
- `adicionarConteudo()` - Adicionar conteúdo à unidade
- `editarConteudo()` - Editar conteúdo
- `deletarConteudo()` - Deletar conteúdo
- `reordenarUnidades()` - Reordenar unidades
- `reordenarConteudo()` - Reordenar conteúdo
- `salvarCurso()` - Salvar curso no banco
- `carregarCursos()` - Carregar cursos do banco

**Uso:**
```typescript
const { state, criarCurso, editarCurso, adicionarUnidade } = useGeradorCurso();
```

**Arquitetura:**
- Usa `useReducer` para gerenciar estado
- Sincroniza com banco de dados via API
- Otimistic updates (atualiza UI antes de confirmar no servidor)

---

### **3. ProgressoContext.tsx**
**Localização:** `src/context/ProgressoContext.tsx`

**Função:** Gerenciamento de progresso dos alunos nos cursos.

**Funcionalidades:**
- Rastreamento de progresso
- Marcação de conclusão de unidades
- Estatísticas de progresso

---

## 🪝 Hooks Customizados

### **1. usePDF.ts**
**Localização:** `src/hooks/usePDF.ts`

**Função:** Hook para geração de PDF.

**Retorno:**
```typescript
{
  generatePDF: (curso: CursoGerado, filename: string) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
}
```

**Uso:**
```typescript
const { generatePDF, isGenerating } = usePDF();
await generatePDF(curso, 'meu-curso.pdf');
```

**Funcionalidades:**
- Gera PDF usando jsPDF e Puppeteer
- Mostra loading durante geração
- Tratamento de erros
- Download automático

---

### **2. usePreview.ts**
**Localização:** `src/hooks/usePreview.ts`

**Função:** Hook para abrir preview de curso.

**Retorno:**
```typescript
{
  openPreview: (curso: CursoGerado) => void;
}
```

**Uso:**
```typescript
const { openPreview } = usePreview();
openPreview(curso);
```

---

### **3. useTheme.ts**
**Localização:** `src/hooks/useTheme.ts`

**Função:** Gerenciamento de tema (dark/light mode).

**Retorno:**
```typescript
{
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}
```

**Funcionalidades:**
- Persiste tema no localStorage
- Aplica tema ao body/html
- Toggle entre dark e light

---

### **4. useModalAnimation.ts**
**Localização:** `src/hooks/useModalAnimation.ts`

**Função:** Animações para modais.

**Funcionalidades:**
- Animações de entrada/saída
- Transições suaves

---

### **5. useSCORM.ts**
**Localização:** `src/hooks/useSCORM.ts`

**Função:** Hook para geração de pacotes SCORM 1.2.

**Retorno:**
```typescript
{
  generateSCORM: (curso: CursoGerado, filename: string) => Promise<void>;
  isGeneratingSCORM: boolean;
  error: string | null;
}
```

**Uso:**
```typescript
const { generateSCORM, isGeneratingSCORM } = useSCORM();
await generateSCORM(curso, 'meu-curso-scorm');
```

**Funcionalidades:**
- Gera pacote SCORM 1.2 completo (ZIP)
- Inclui HTML SPA com layout fiel ao design React
- SCORM API wrapper para comunicação com LMS
- Manifesto XML conforme padrão SCORM 1.2
- Download automático do arquivo ZIP
- Estados de loading e tratamento de erros

---

### **6. useUnidadeFromRoute.ts**
**Localização:** `src/hooks/useUnidadeFromRoute.ts`

**Função:** Extrai informações de unidade da rota atual.

**Uso:**
```typescript
const { unidadeId, cursoId } = useUnidadeFromRoute();
```

---

## 🛣️ API Routes

### **Autenticação** (`src/app/api/auth/`)

#### **POST /api/auth/login**
**Arquivo:** `src/app/api/auth/login/route.ts`

**Função:** Login de usuário.

**Request:**
```json
{
  "usuario": "admin@edu.com",
  "senha": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": { "id", "nome", "cargo", "usuario" }
}
```

**Funcionalidades:**
- Valida credenciais
- Gera JWT token
- Retorna dados do usuário

---

#### **POST /api/auth/logout**
**Arquivo:** `src/app/api/auth/logout/route.ts`

**Função:** Logout do usuário.

**Response:**
```json
{
  "success": true
}
```

---

#### **POST /api/auth/cadastro**
**Arquivo:** `src/app/api/auth/cadastro/route.ts`

**Função:** Cadastro de novo usuário.

**Request:**
```json
{
  "nome": "Nome Completo",
  "cargo": "Administrador",
  "usuario": "email@exemplo.com",
  "senha": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "user": { "id", "nome", "cargo", "usuario" }
}
```

---

#### **GET /api/auth/me**
**Arquivo:** `src/app/api/auth/me/route.ts`

**Função:** Retorna usuário autenticado atual.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": { "id", "nome", "cargo", "usuario" }
}
```

---

### **Cursos** (`src/app/api/cursos/`)

#### **GET /api/cursos**
**Arquivo:** `src/app/api/cursos/route.ts` (implícito)

**Função:** Lista cursos com paginação e filtros.

**Query Params:**
- `page` - Número da página
- `limit` - Itens por página
- `search` - Busca por título
- `category` - Filtro por categoria
- `modality` - Filtro por modalidade

**Response:**
```json
{
  "success": true,
  "cursos": [...],
  "pagination": {
    "total": 100,
    "totalPages": 10,
    "currentPage": 1,
    "limit": 10
  }
}
```

---

#### **GET /api/cursos/[id]**
**Arquivo:** `src/app/api/cursos/[id]/route.ts`

**Função:** Busca curso por ID.

**Response:**
```json
{
  "success": true,
  "curso": { ... }
}
```

---

#### **POST /api/cursos**
**Função:** Cria novo curso.

**Request:**
```json
{
  "titulo": "Novo Curso",
  "descricao": "Descrição",
  "categoria": "Tecnologia",
  "cargaHoraria": "40 horas",
  "modalidade": "Online",
  "unidades": []
}
```

---

#### **PUT /api/cursos/[id]**
**Função:** Atualiza curso existente.

**Request:**
```json
{
  "titulo": "Título Atualizado",
  ...
}
```

---

#### **DELETE /api/cursos/[id]**
**Função:** Deleta curso.

**Response:**
```json
{
  "success": true
}
```

---

### **Geração de Conteúdo** (`src/app/api/generate-course-from-text/`)

#### **POST /api/generate-course-from-text**
**Arquivo:** `src/app/api/generate-course-from-text/route.ts`

**Função:** Gera curso completo usando IA (Google Gemini).

**Request:**
```json
{
  "prompt": "Crie um curso sobre Next.js"
}
```

**Response:**
```json
{
  "success": true,
  "curso": {
    "titulo": "...",
    "descricao": "...",
    "unidades": [...]
  }
}
```

**Funcionalidades:**
- Usa Google Generative AI (Gemini)
- Gera estrutura completa de curso
- Cria unidades e conteúdos variados
- Retorna JSON estruturado

**Configuração:**
- Variável de ambiente: `GOOGLE_API_KEY`
- Timeout: 60 segundos (Vercel Pro)

---

### **Exportação PDF** (`src/app/api/generate-pdf/`)

#### **POST /api/generate-pdf**
**Arquivo:** `src/app/api/generate-pdf/route.ts`

**Função:** Gera PDF do curso.

**Request:**
```json
{
  "cursoId": "curso_id_here"
}
```

**Response:**
```typescript
// Retorna Buffer do PDF
Response: PDF Buffer
Content-Type: application/pdf
```

**Funcionalidades:**
- Busca curso do banco
- Gera PDF usando Puppeteer
- Retorna PDF para download
- Suporta todos os tipos de conteúdo

---

### **Upload de Imagens** (`src/app/api/upload-image/`)

#### **POST /api/upload-image**
**Arquivo:** `src/app/api/upload-image/route.ts`

**Função:** Upload de imagens para Vercel Blob Storage.

**Request:**
```
FormData:
  file: File
```

**Response:**
```json
{
  "success": true,
  "url": "https://blob.vercel-storage.com/..."
}
```

**Funcionalidades:**
- Upload para Vercel Blob
- Validação de tipo de arquivo
- Retorna URL pública

---

### **Extração de Documentos** (`src/app/api/extract-document/`)

#### **POST /api/extract-document**
**Arquivo:** `src/app/api/extract-document/route.ts`

**Função:** Extrai conteúdo de arquivo DOCX.

**Request:**
```
FormData:
  file: File (.docx)
```

**Response:**
```json
{
  "success": true,
  "text": "Texto extraído..."
}
```

**Funcionalidades:**
- Usa biblioteca `mammoth` para extrair texto
- Converte DOCX para texto plano
- Remove formatação

---

### **Exportação SCORM** (`src/app/api/generate-scorm/`)

#### **POST /api/generate-scorm**
**Arquivo:** `src/app/api/generate-scorm/route.ts`

**Função:** Gera pacote SCORM 1.2 do curso.

**Request:**
```json
{
  "curso": {
    "id": "curso_id",
    "titulo": "Título do Curso",
    "descricao": "...",
    "categoria": "...",
    "cargaHoraria": "...",
    "modalidade": "...",
    "unidades": [...]
  }
}
```

**Response:**
```typescript
// Retorna Buffer do ZIP
Response: ZIP Buffer
Content-Type: application/zip
Content-Disposition: attachment; filename="curso_SCORM.zip"
```

**Funcionalidades:**
- Recebe objeto `curso` completo do frontend
- Gera pacote SCORM 1.2 usando `scorm-service.ts`
- Cria arquivo ZIP com:
  - `index.html` - Player SPA (Single Page Application)
  - `imsmanifest.xml` - Manifesto SCORM
  - `scorm_api_wrapper.js` - Wrapper da API SCORM
  - Arquivos XSD para validação
- Retorna ZIP para download

**Características do Player SCORM:**
- **SPA (Single Page Application):** Navegação sem recarregar página
- **Layout fiel:** Hero Section e Sheet de navegação idênticos ao design React
- **Tailwind CSS:** Via CDN para estilização
- **SCORM 1.2 API:** Comunicação completa com LMS
- **Progresso:** Salva localização atual e status de conclusão
- **Navegação:** Menu Hero, Sheet (drawer), botões Anterior/Próxima

---

## 🗄️ Banco de Dados

### **Schema Prisma**
**Arquivo:** `prisma/schema.prisma`

### **Modelo: User**

```prisma
model User {
  id        String   @id @default(cuid())
  nome      String
  cargo     String
  usuario   String   @unique
  senha     String   // Hash bcrypt
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Campos:**
- `id` - ID único (cuid)
- `nome` - Nome completo
- `cargo` - Cargo/função
- `usuario` - Email/usuário (único)
- `senha` - Hash da senha (bcrypt)
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização

---

### **Modelo: Curso**

```prisma
model Curso {
  id               String   @id @default(cuid())
  titulo           String
  descricao        String
  cargaHoraria     String
  modalidade       String
  categoria        String
  unidades         Json     @default("[]")  // Array de Unidades
  dataCriacao      DateTime @default(now())
  dataModificacao  DateTime @updatedAt
}
```

**Campos:**
- `id` - ID único (cuid)
- `titulo` - Título do curso
- `descricao` - Descrição do curso
- `cargaHoraria` - Carga horária (ex: "40 horas")
- `modalidade` - Modalidade (Presencial, Online, Híbrido)
- `categoria` - Categoria (Tecnologia, Marketing, etc.)
- `unidades` - JSON com array de unidades (estrutura completa)
- `dataCriacao` - Data de criação
- `dataModificacao` - Data de última modificação

**Índices:**
- `titulo` - Para buscas
- `categoria` - Para filtros

**Estrutura JSON de `unidades`:**
```json
[
  {
    "id": "unit-1",
    "titulo": "Introdução",
    "descricao": "...",
    "ordem": 0,
    "conteudo": [
      {
        "id": "content-1",
        "tipo": "titulo",
        "conteudo": "Título",
        "ordem": 0
      },
      ...
    ]
  }
]
```

---

### **Modelo: Comment**

```prisma
model Comment {
  id        Int      @id @default(autoincrement())
  text      String
  createdAt DateTime @default(now())
}
```

**Nota:** Modelo de exemplo, pode ser expandido futuramente.

---

### **Cliente Prisma**
**Arquivo:** `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export { prisma }
```

**Uso:**
```typescript
import { prisma } from '@/lib/prisma'

const cursos = await prisma.curso.findMany()
```

**Singleton Pattern:** Garante uma única instância do Prisma Client.

---

## 📝 Tipos TypeScript

### **Tipos Principais** (`src/types/gerador-curso.ts`)

#### **ConteudoUnidade**
```typescript
interface ConteudoUnidade {
  id: string
  tipo: 'titulo' | 'paragrafo' | 'subtitulo' | 'imagem' | 
        'accordion' | 'flipcard' | 'lista' | 'quiz' | 'info-box'
  conteudo: string
  ordem: number
  
  // Imagens
  tamanho?: 'pequena' | 'media' | 'grande'
  legenda?: string
  fonte?: string
  
  // Parágrafos
  corTexto?: string
  alinhamento?: 'esquerda' | 'centro' | 'direita' | 'justificado'
  
  // Layout
  colunas?: 6 | 12
  
  // Accordion
  items?: AccordionItem[]
  
  // Flipcard
  tipoFrente?: 'imagem' | 'imagem-titulo' | 'titulo'
  imagemFrente?: string
  tituloFrente?: string
  conteudoVerso?: string
  alturaCard?: string
  
  // Lista
  itensLista?: ListaItem[]
  tipoLista?: 'ordenada' | 'nao-ordenada' | 'check'
  
  // Quiz
  quizData?: QuizData
  
  // Info Box
  tipoInfoBox?: 'atencao' | 'saiba_mais' | 'info' | 'curiosidade'
  tituloInfoBox?: string
}
```

#### **Unidade**
```typescript
interface Unidade {
  id: string
  titulo: string
  descricao: string
  conteudo: ConteudoUnidade[]
  ordem: number
}
```

#### **CursoGerado**
```typescript
interface CursoGerado {
  id: string
  titulo: string
  descricao: string
  cargaHoraria: string
  modalidade: string
  categoria: string
  dataCriacao: Date
  dataModificacao: Date
  unidades: Unidade[]
}
```

#### **QuizData**
```typescript
interface QuizData {
  questions: QuizQuestion[]
}

interface QuizQuestion {
  id: string
  pergunta: string
  dica?: string
  opcoes: QuizItem[]
}

interface QuizItem {
  id: string
  texto: string
  isCorrect: boolean
  feedback: string
}
```

---

## 🔄 Fluxo de Dados

### **Fluxo de Criação de Curso**

```
1. Usuário clica "Criar Novo Curso"
   ↓
2. Navega para /cursos/novo
   ↓
3. Preenche formulário
   ↓
4. Submit → GeradorCursoContext.criarCurso()
   ↓
5. Atualiza estado local (otimistic update)
   ↓
6. API POST /api/cursos
   ↓
7. Prisma.curso.create()
   ↓
8. Retorna curso criado
   ↓
9. Atualiza contexto com resposta do servidor
   ↓
10. Navega para /cursos/[id]/editar
```

### **Fluxo de Edição de Conteúdo**

```
1. Usuário edita conteúdo na página de edição
   ↓
2. GeradorCursoContext.editarConteudo()
   ↓
3. Atualiza estado local
   ↓
4. API PUT /api/cursos/[id]
   ↓
5. Prisma.curso.update()
   ↓
6. Atualiza JSON de unidades
   ↓
7. Retorna curso atualizado
   ↓
8. Sincroniza contexto
```

### **Fluxo de Exportação PDF**

```
1. Usuário clica "Exportar"
   ↓
2. Abre ExportModal
   ↓
3. Seleciona PDF e nome do arquivo
   ↓
4. usePDF.generatePDF()
   ↓
5. API POST /api/generate-pdf
   ↓
6. Busca curso do banco
   ↓
7. pdf-service.generateCoursePDF()
   ↓
8. Usa jsPDF + Puppeteer para gerar PDF
   ↓
9. Retorna Buffer do PDF
   ↓
10. Download automático no navegador
```

### **Fluxo de Exportação SCORM**

```
1. Usuário clica "Exportar"
   ↓
2. Abre ExportModal
   ↓
3. Seleciona SCORM e nome do arquivo
   ↓
4. useSCORM.generateSCORM()
   ↓
5. API POST /api/generate-scorm
   ↓
6. Recebe objeto curso completo do frontend
   ↓
7. scorm-service.generateSCORMPackage()
   ↓
8. Gera index.html (SPA com Hero + Player)
   ↓
9. Gera imsmanifest.xml (manifesto SCORM 1.2)
   ↓
10. Gera scorm_api_wrapper.js (wrapper da API)
   ↓
11. Adiciona arquivos XSD de validação
   ↓
12. Cria arquivo ZIP usando JSZip
   ↓
13. Retorna Buffer do ZIP
   ↓
14. Download automático no navegador
```

### **Fluxo de Autenticação**

```
1. Usuário preenche login
   ↓
2. AuthContext.login()
   ↓
3. API POST /api/auth/login
   ↓
4. Valida credenciais (Prisma + bcrypt)
   ↓
5. Gera JWT token
   ↓
6. Retorna token e dados do usuário
   ↓
7. Salva token no localStorage
   ↓
8. Atualiza AuthContext
   ↓
9. AuthGuard permite acesso
```

---

## ⚙️ Funcionalidades Principais

### **1. Criação de Cursos**

**Página:** `/cursos/novo`

**Funcionalidades:**
- Formulário para criar curso básico
- Campos: título, descrição, categoria, carga horária, modalidade
- Validação de campos obrigatórios
- Redireciona para edição após criação

---

### **2. Edição de Cursos**

**Página:** `/cursos/[id]/editar`

**Funcionalidades:**
- Editar informações gerais do curso
- Adicionar/editar/deletar unidades
- Adicionar/editar/deletar conteúdo
- Reordenar unidades e conteúdos
- Upload de imagens
- Preview do curso
- Exportação (PDF, SCORM)

**Tipos de Conteúdo Suportados:**
1. **Título** - Título principal
2. **Subtítulo** - Subtítulo
3. **Parágrafo** - Texto com formatação
4. **Imagem** - Com legenda e fonte
5. **Accordion** - Acordeão expansível
6. **Flipcard** - Card com frente/verso
7. **Lista** - Ordenada, não ordenada ou com check
8. **Quiz** - Perguntas com múltipla escolha
9. **Info Box** - Caixa de informação (info, warning, error, success)

---

### **3. Lista de Cursos**

**Página:** `/cursos`

**Funcionalidades:**
- Lista todos os cursos com paginação
- Busca por título
- Filtros por categoria e modalidade
- Cards com informações resumidas
- Ações: Preview, Editar, Excluir, Exportar
- Paginação

---

### **4. Preview de Cursos**

**Página:** `/cursos/[id]/preview`

**Funcionalidades:**
- Visualização completa do curso
- Navegação entre unidades
- Renderização de todos os tipos de conteúdo
- Navegação lateral (índice)

---

### **5. Geração por IA**

**API:** `/api/generate-course-from-text`

**Funcionalidades:**
- Gera curso completo a partir de prompt
- Usa Google Gemini AI
- Cria estrutura com múltiplas unidades
- Gera conteúdo variado (títulos, parágrafos, listas, etc.)
- Retorna JSON estruturado

**Uso:**
```typescript
const response = await fetch('/api/generate-course-from-text', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'Crie um curso sobre React' })
});
const { curso } = await response.json();
```

---

### **6. Exportação PDF**

**Funcionalidades:**
- Gera PDF completo do curso
- Inclui todas as unidades e conteúdos
- Suporta imagens, quizzes, flipcards
- Layout profissional com índice
- Download automático

**Tecnologias:**
- jsPDF - Geração do PDF
- Puppeteer - Renderização HTML para PDF

---

### **7. Exportação SCORM**

**Funcionalidades:**
- Gera pacote SCORM 1.2 completo (ZIP)
- Player SPA (Single Page Application) sem recarregar página
- Layout fiel ao design React (Hero Section + Sheet de navegação)
- SCORM API wrapper para comunicação com LMS
- Suporta todos os tipos de conteúdo
- Progresso e localização salva automaticamente
- Compatível com LMS padrão SCORM 1.2

**Estrutura do Pacote SCORM:**
- `index.html` - Player principal (SPA)
- `imsmanifest.xml` - Manifesto SCORM 1.2
- `scorm_api_wrapper.js` - Wrapper da API SCORM
- `*.xsd` - Arquivos de validação XSD

**Características do Player:**
- **Menu Hero:** Tela inicial com informações do curso e lista de unidades
- **Player:** Visualizador de conteúdo com navegação
- **Sheet Navigation:** Gaveta lateral para navegação rápida
- **SCORM Integration:** Comunicação completa com LMS
- **Progress Tracking:** Salva localização e status de conclusão
- **Responsive:** Design adaptável a diferentes tamanhos de tela

**Tecnologias:**
- JSZip - Criação de arquivos ZIP
- Tailwind CSS (CDN) - Estilização
- SCORM 1.2 API - Padrão de comunicação com LMS

---

### **8. Upload de Imagens**

**Funcionalidades:**
- Upload para Vercel Blob Storage
- Validação de tipo de arquivo
- Retorna URL pública
- Usado em conteúdos do tipo "imagem"

---

### **9. Autenticação**

**Funcionalidades:**
- Login com email/senha
- Cadastro de novos usuários
- Proteção de rotas (AuthGuard)
- Sessão persistente (JWT)
- Logout

**Segurança:**
- Senhas hasheadas com bcrypt
- Tokens JWT com expiração
- Validação de rotas protegidas

---

## 🎨 UI e Estilos

### **Framework CSS**
- **Tailwind CSS 4** - Utility-first CSS
- **Radix UI** - Componentes acessíveis
- **Framer Motion** - Animações

### **Tema**
- Suporte a Dark Mode
- Cores personalizadas
- Variáveis CSS para temas

### **Componentes UI Base**
Localizados em `src/components/ui/`:
- `button.tsx` - Botões
- `card.tsx` - Cards
- `dialog.tsx` - Modais
- `input.tsx` - Inputs
- `select.tsx` - Selects
- `tooltip.tsx` - Tooltips
- E mais...

---

## 📦 Dependências Principais

### **Core**
- `next` - Framework React
- `react` - Biblioteca UI
- `typescript` - Tipagem estática

### **Banco de Dados**
- `@prisma/client` - ORM
- `prisma` - CLI do Prisma

### **UI**
- `tailwindcss` - CSS framework
- `@radix-ui/*` - Componentes acessíveis
- `lucide-react` - Ícones
- `framer-motion` - Animações
- `sonner` - Toast notifications

### **PDF e Documentos**
- `jspdf` - Geração de PDF
- `puppeteer` - Headless browser
- `mammoth` - Extração de DOCX
- `pdf-parse` - Parse de PDF

### **SCORM**
- `jszip` - Criação de arquivos ZIP
- `@types/jszip` - Tipos TypeScript para JSZip

### **Autenticação**
- `bcryptjs` - Hash de senhas
- `jose` - JWT

### **IA**
- `@google/generative-ai` - Google Gemini

### **Storage**
- `@vercel/blob` - Vercel Blob Storage

---

## 🚀 Scripts Disponíveis

```json
{
  "dev": "next dev",                    // Servidor de desenvolvimento
  "build": "prisma generate && next build",  // Build de produção
  "start": "next start",                 // Servidor de produção
  "lint": "eslint",                     // Linter
  "db:migrate": "prisma migrate dev",   // Criar migração
  "db:seed": "tsx prisma/seed.ts",      // Seed do banco
  "db:studio": "prisma studio",          // Interface visual do banco
  "db:push": "prisma db push",          // Push schema para banco
  "db:generate": "prisma generate"      // Gerar Prisma Client
}
```

---

## 🔐 Variáveis de Ambiente

Arquivo `.env.local` (não versionado):

```env
# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# JWT
JWT_SECRET="sua_chave_secreta_aqui"

# Google AI
GOOGLE_API_KEY="sua_chave_api_google"

# Vercel Blob (opcional)
BLOB_READ_WRITE_TOKEN="token_do_vercel_blob"
```

---

## 📚 Estrutura de Rotas

### **Rotas Públicas**
- `/login` - Login
- `/cadastro` - Cadastro

### **Rotas Protegidas**
- `/home` - Dashboard
- `/cursos` - Lista de cursos
- `/cursos/novo` - Criar curso
- `/cursos/[id]/editar` - Editar curso
- `/cursos/[id]/preview` - Preview do curso
- `/usuarios` - Gestão de usuários
- `/configuracoes` - Configurações

### **API Routes**
Todas as rotas em `/api/*` são Server Actions (backend).

---

## 🎯 Próximos Passos / Melhorias Futuras

1. ✅ **SCORM** - Implementação completa de exportação SCORM 1.2 (CONCLUÍDO)
2. **Progresso** - Sistema de progresso dos alunos
3. **Comentários** - Sistema de comentários nos cursos
4. **Notificações** - Notificações push
5. **Analytics** - Analytics de uso dos cursos
6. **Versões** - Versionamento de cursos
7. **Colaboração** - Múltiplos autores por curso
8. **Exportação DOCX** - Exportação em Word
9. **Temas Personalizados** - Temas customizáveis por curso
10. **LMS Integration** - Integração com LMS externos

---

## 📖 Documentação Adicional

- `DATABASE_SETUP.md` - Configuração do banco
- `ENV_SETUP.md` - Configuração de variáveis
- `PRISMA_SETUP.md` - Configuração do Prisma
- `QUICK_START.md` - Guia rápido de início

---

## 🤝 Contribuindo

Este documento foi criado para facilitar o entendimento da estrutura do projeto. Para contribuir:

1. Leia este documento completamente
2. Entenda a arquitetura antes de fazer mudanças
3. Siga os padrões estabelecidos
4. Mantenha este documento atualizado

---

**Última atualização:** Janeiro 2025
**Versão do Projeto:** 0.2.0

---

## 📦 Serviços (src/lib/)

### **scorm-service.ts**

**Localização:** `src/lib/scorm-service.ts`

**Função:** Serviço principal para geração de pacotes SCORM 1.2.

**Funções principais:**

#### **generateSCORMPackage(curso: CursoGerado): Promise<Buffer>**
Função principal que gera o pacote SCORM completo.

**Processo:**
1. Cria instância JSZip
2. Gera `imsmanifest.xml` (manifesto SCORM)
3. Gera `index.html` (player SPA)
4. Gera `scorm_api_wrapper.js` (wrapper da API)
5. Adiciona arquivos XSD de validação
6. Gera ZIP como Buffer

#### **generateIndexHtml(curso: CursoGerado): string**
Gera o HTML completo do player SCORM como SPA.

**Características:**
- **Duas telas:** Menu Hero e Player
- **Navegação SPA:** JavaScript alterna entre telas sem recarregar
- **Layout fiel:** Recria exatamente o design React
- **Tailwind CSS:** Via CDN
- **SCORM API:** Integração completa com LMS

**Estrutura HTML:**
- `#menu-screen` - Tela inicial (Hero Section)
- `#player-screen` - Tela do player (conteúdo)
- `#sheet-content` - Gaveta de navegação lateral
- JavaScript para navegação e comunicação SCORM

#### **generateManifest(curso: CursoGerado): string**
Gera o manifesto XML conforme padrão SCORM 1.2.

**Inclui:**
- Metadata (schema, versão)
- Organizations (estrutura do curso)
- Resources (arquivos do pacote)

#### **generateScormWrapper(): string**
Gera o wrapper JavaScript da API SCORM.

**Suporta:**
- SCORM 1.2 (`API`)
- SCORM 2004 (`API_1484_11`)
- Busca automática da API no parent window
- Funções: `init`, `terminate`, `save`, `getValue`, `setValue`, `getStudentName`

#### **renderConteudo(conteudo: ConteudoUnidade): string**
Converte conteúdo JSON em HTML usando Tailwind CSS.

**Suporta:**
- Títulos e subtítulos
- Parágrafos (com alinhamento e cor)
- Imagens (com tamanho, legenda, fonte)
- Accordion, Flipcard, Quiz (stubs)
- Lista, Info Box (stubs)

#### **getXSDs(): { [key: string]: string }**
Retorna arquivos XSD simplificados para validação.

**Arquivos:**
- `imscp_rootv1p1p2.xsd`
- `adlcp_rootv1p2.xsd`
- `imsmd_rootv1p2p1.xsd`

---

